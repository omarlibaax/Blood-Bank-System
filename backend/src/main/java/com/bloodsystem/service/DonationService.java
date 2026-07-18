package com.bloodsystem.service;

import com.bloodsystem.model.BloodInventory;
import com.bloodsystem.model.Donation;
import com.bloodsystem.model.Donor;
import com.bloodsystem.repository.BloodInventoryRepository;
import com.bloodsystem.repository.BloodIssueLogRepository;
import com.bloodsystem.repository.DonationRepository;
import com.bloodsystem.repository.DonorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class DonationService {

    @Autowired
    private DonationRepository donationRepository;

    @Autowired
    private DonorRepository donorRepository;

    @Autowired
    private BloodInventoryRepository bloodInventoryRepository;

    @Autowired
    private BloodIssueLogRepository bloodIssueLogRepository;

    public List<Donation> getAllDonations() {
        return donationRepository.findAll();
    }

    public Donation getDonationById(UUID id) {
        return donationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Donation not found with ID: " + id));
    }

    @Transactional
    public Donation createDonation(Donation donation) {
        if (donation.getDonor() == null || donation.getDonor().getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Donor is required");
        }
        if (donation.getUnits() == null || donation.getUnits().signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Donation volume must be greater than zero");
        }

        Donor donor = donorRepository.findById(donation.getDonor().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Donor not found"));

        if (donor.getBloodGroup() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Donor has no blood group assigned");
        }

        donation.setDonor(donor);
        if (donation.getDonationDate() == null) {
            donation.setDonationDate(LocalDate.now());
        }

        Donation savedDonation = donationRepository.save(donation);

        int totalDonations = donor.getTotalDonations() == null ? 0 : donor.getTotalDonations();
        donor.setLastDonationDate(donation.getDonationDate());
        donor.setTotalDonations(totalDonations + 1);
        donorRepository.save(donor);

        BloodInventory inventory = BloodInventory.builder()
                .donation(savedDonation)
                .bloodGroup(donor.getBloodGroup())
                .bloodBagNumber("BAG-" + System.currentTimeMillis())
                .collectionDate(donation.getDonationDate())
                .expiryDate(donation.getDonationDate().plusDays(42))
                .units(donation.getUnits())
                .location("Central Storage Shelf A")
                .status("Available")
                .build();
        bloodInventoryRepository.save(inventory);

        return savedDonation;
    }

    @Transactional
    public Donation updateDonation(UUID id, Donation details) {
        Donation donation = getDonationById(id);
        List<BloodInventory> bags = bloodInventoryRepository.findByDonationId(id);

        // Soft fields always allowed
        donation.setDoctorName(details.getDoctorName());
        donation.setRemarks(details.getRemarks());

        boolean volumeChanging = details.getUnits() != null
                && donation.getUnits() != null
                && details.getUnits().compareTo(donation.getUnits()) != 0;
        boolean dateChanging = details.getDonationDate() != null
                && donation.getDonationDate() != null
                && !details.getDonationDate().equals(donation.getDonationDate());

        if (volumeChanging || dateChanging) {
            if (isInventoryConsumed(bags, donation.getUnits())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Cannot change volume/date: blood from this donation was already issued or partially used. Only doctor and remarks can be edited.");
            }

            if (details.getUnits() == null || details.getUnits().signum() <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Donation volume must be greater than zero");
            }

            BigDecimal oldUnits = donation.getUnits();
            BigDecimal newUnits = details.getUnits();
            BigDecimal delta = newUnits.subtract(oldUnits);

            donation.setUnits(newUnits);
            if (details.getDonationDate() != null) {
                donation.setDonationDate(details.getDonationDate());
            }

            // Adjust inventory by delta only — never overwrite remaining stock with full donation volume
            BloodInventory availableBag = bags.stream()
                    .filter(bag -> "Available".equalsIgnoreCase(bag.getStatus()) || "Expired".equalsIgnoreCase(bag.getStatus()))
                    .findFirst()
                    .orElse(null);

            if (availableBag != null) {
                BigDecimal current = availableBag.getUnits() != null ? availableBag.getUnits() : BigDecimal.ZERO;
                BigDecimal next = current.add(delta);
                if (next.signum() < 0) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Cannot reduce donation below remaining inventory (" + current + " L)");
                }
                availableBag.setUnits(next);
                availableBag.setCollectionDate(donation.getDonationDate());
                availableBag.setExpiryDate(donation.getDonationDate().plusDays(42));
                bloodInventoryRepository.save(availableBag);
            }
        }

        Donation saved = donationRepository.save(donation);

        Donor donor = donation.getDonor();
        if (donor != null && dateChanging) {
            donor.setLastDonationDate(saved.getDonationDate());
            donorRepository.save(donor);
        }

        return saved;
    }

    @Transactional
    public void deleteDonation(UUID id) {
        Donation donation = getDonationById(id);
        List<BloodInventory> bags = bloodInventoryRepository.findByDonationId(id);

        if (isInventoryConsumed(bags, donation.getUnits())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Cannot delete a donation whose blood was already issued or partially used");
        }

        for (BloodInventory bag : bags) {
            List<?> logs = bloodIssueLogRepository.findByBloodInventory_Id(bag.getId());
            if (!logs.isEmpty()) {
                bloodIssueLogRepository.deleteAll(bloodIssueLogRepository.findByBloodInventory_Id(bag.getId()));
            }
        }
        bloodInventoryRepository.deleteAll(bags);
        donationRepository.delete(donation);

        Donor donor = donation.getDonor();
        if (donor != null) {
            int total = donor.getTotalDonations() == null ? 0 : donor.getTotalDonations();
            donor.setTotalDonations(Math.max(0, total - 1));
            donorRepository.save(donor);
        }
    }

    /**
     * Inventory is considered consumed when any bag is Issued, has issue logs,
     * or Available/Expired units no longer match the original donation volume.
     */
    private boolean isInventoryConsumed(List<BloodInventory> bags, BigDecimal donationUnits) {
        if (bags == null || bags.isEmpty()) {
            return false;
        }

        BigDecimal remaining = BigDecimal.ZERO;
        for (BloodInventory bag : bags) {
            if ("Issued".equalsIgnoreCase(bag.getStatus())) {
                return true;
            }
            if (!bloodIssueLogRepository.findByBloodInventory_Id(bag.getId()).isEmpty()) {
                return true;
            }
            if ("Available".equalsIgnoreCase(bag.getStatus()) || "Expired".equalsIgnoreCase(bag.getStatus())) {
                remaining = remaining.add(bag.getUnits() != null ? bag.getUnits() : BigDecimal.ZERO);
            }
        }

        return donationUnits != null && remaining.compareTo(donationUnits) != 0;
    }

    public List<Donation> getDonationsByDonor(UUID donorId) {
        return donationRepository.findByDonorId(donorId);
    }
}
