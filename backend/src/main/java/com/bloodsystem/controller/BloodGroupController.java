package com.bloodsystem.controller;

import com.bloodsystem.model.BloodGroup;
import com.bloodsystem.repository.BloodGroupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/blood-groups")
public class BloodGroupController {

    @Autowired
    private BloodGroupRepository bloodGroupRepository;

    @GetMapping
    public List<BloodGroup> getAllBloodGroups() {
        return bloodGroupRepository.findAll();
    }
}
