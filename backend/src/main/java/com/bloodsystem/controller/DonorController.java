package com.bloodsystem.controller;

import com.bloodsystem.model.Donor;
import com.bloodsystem.service.DonorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/donors")
public class DonorController {

    @Autowired
    private DonorService donorService;

    @GetMapping
    public List<Donor> getAllDonors() {
        return donorService.getAllDonors();
    }

    @GetMapping("/{id}")
    public Donor getDonorById(@PathVariable UUID id) {
        return donorService.getDonorById(id);
    }

    @PostMapping
    public Donor createDonor(@RequestBody Donor donor) {
        return donorService.createDonor(donor);
    }

    @PutMapping("/{id}")
    public Donor updateDonor(@PathVariable UUID id, @RequestBody Donor donor) {
        return donorService.updateDonor(id, donor);
    }

    @DeleteMapping("/{id}")
    public void deleteDonor(@PathVariable UUID id) {
        donorService.deleteDonor(id);
    }

    @GetMapping("/search")
    public List<Donor> searchDonors(@RequestParam String name) {
        return donorService.searchDonorsByName(name);
    }
}
