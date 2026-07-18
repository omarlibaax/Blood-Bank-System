package com.bloodsystem.service;

import com.bloodsystem.model.Hospital;
import com.bloodsystem.repository.HospitalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class HospitalService {

    @Autowired
    private HospitalRepository hospitalRepository;

    public List<Hospital> getAllHospitals() {
        return hospitalRepository.findAll();
    }

    public Hospital getHospitalById(UUID id) {
        return hospitalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Hospital not found with ID: " + id));
    }

    public Hospital createHospital(Hospital hospital) {
        if (hospital.getHospitalCode() == null || hospital.getHospitalCode().isEmpty()) {
            hospital.setHospitalCode("HSP-" + (System.currentTimeMillis() % 1000000));
        }
        return hospitalRepository.save(hospital);
    }

    public Hospital updateHospital(UUID id, Hospital details) {
        Hospital hospital = getHospitalById(id);
        hospital.setHospitalName(details.getHospitalName());
        hospital.setPhone(details.getPhone());
        hospital.setEmail(details.getEmail());
        hospital.setAddress(details.getAddress());
        hospital.setContactPerson(details.getContactPerson());
        hospital.setStatus(details.getStatus());
        return hospitalRepository.save(hospital);
    }

    public void deleteHospital(UUID id) {
        Hospital hospital = getHospitalById(id);
        hospitalRepository.delete(hospital);
    }
}
