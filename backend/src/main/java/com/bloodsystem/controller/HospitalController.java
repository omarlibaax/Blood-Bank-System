package com.bloodsystem.controller;

import com.bloodsystem.model.Hospital;
import com.bloodsystem.service.HospitalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/hospitals")
public class HospitalController {

    @Autowired
    private HospitalService hospitalService;

    @GetMapping
    public List<Hospital> getAllHospitals() {
        return hospitalService.getAllHospitals();
    }

    @GetMapping("/{id}")
    public Hospital getHospitalById(@PathVariable UUID id) {
        return hospitalService.getHospitalById(id);
    }

    @PostMapping
    public Hospital createHospital(@RequestBody Hospital hospital) {
        return hospitalService.createHospital(hospital);
    }

    @PutMapping("/{id}")
    public Hospital updateHospital(@PathVariable UUID id, @RequestBody Hospital details) {
        return hospitalService.updateHospital(id, details);
    }

    @DeleteMapping("/{id}")
    public void deleteHospital(@PathVariable UUID id) {
        hospitalService.deleteHospital(id);
    }
}
