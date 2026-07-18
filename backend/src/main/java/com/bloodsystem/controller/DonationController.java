package com.bloodsystem.controller;

import com.bloodsystem.model.Donation;
import com.bloodsystem.model.User;
import com.bloodsystem.repository.UserRepository;
import com.bloodsystem.service.DonationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/donations")
public class DonationController {

    @Autowired
    private DonationService donationService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public List<Donation> getAllDonations() {
        return donationService.getAllDonations();
    }

    @GetMapping("/{id}")
    public Donation getDonationById(@PathVariable UUID id) {
        return donationService.getDonationById(id);
    }

    @PostMapping
    public Donation createDonation(@RequestBody Donation donation, Principal principal) {
        if (principal != null) {
            User user = userRepository.findByUsername(principal.getName()).orElse(null);
            donation.setCreatedBy(user);
        }
        return donationService.createDonation(donation);
    }

    @PutMapping("/{id}")
    public Donation updateDonation(@PathVariable UUID id, @RequestBody Donation donation) {
        return donationService.updateDonation(id, donation);
    }

    @DeleteMapping("/{id}")
    public void deleteDonation(@PathVariable UUID id) {
        donationService.deleteDonation(id);
    }

    @GetMapping("/donor/{donorId}")
    public List<Donation> getDonationsByDonor(@PathVariable UUID donorId) {
        return donationService.getDonationsByDonor(donorId);
    }
}
