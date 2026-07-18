package com.bloodsystem.service;

import com.bloodsystem.model.Donor;
import com.bloodsystem.repository.DonorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class DonorService {

    @Autowired
    private DonorRepository donorRepository;

    public List<Donor> getAllDonors() {
        return donorRepository.findAll();
    }

    public Donor getDonorById(UUID id) {
        return donorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Donor not found with ID: " + id));
    }

    public Donor createDonor(Donor donor) {
        if (donor.getDonorCode() == null || donor.getDonorCode().isEmpty()) {
            donor.setDonorCode("DNR-" + (System.currentTimeMillis() % 1000000));
        }
        if (donor.getStatus() == null || donor.getStatus().isBlank()) {
            donor.setStatus("Active");
        }
        if (donor.getTotalDonations() == null) {
            donor.setTotalDonations(0);
        }
        return donorRepository.save(donor);
    }

    public Donor updateDonor(UUID id, Donor donorDetails) {
        Donor donor = getDonorById(id);
        donor.setFullName(donorDetails.getFullName());
        donor.setGender(donorDetails.getGender());
        donor.setAge(donorDetails.getAge());
        donor.setBloodGroup(donorDetails.getBloodGroup());
        donor.setPhone(donorDetails.getPhone());
        donor.setEmail(donorDetails.getEmail());
        donor.setAddress(donorDetails.getAddress());
        donor.setPhoto(donorDetails.getPhoto());
        donor.setStatus(donorDetails.getStatus());
        if (donorDetails.getLastDonationDate() != null) {
            donor.setLastDonationDate(donorDetails.getLastDonationDate());
        }
        return donorRepository.save(donor);
    }

    public void deleteDonor(UUID id) {
        Donor donor = getDonorById(id);
        donorRepository.delete(donor);
    }

    public List<Donor> searchDonorsByName(String name) {
        return donorRepository.findByFullNameContainingIgnoreCase(name);
    }
}
