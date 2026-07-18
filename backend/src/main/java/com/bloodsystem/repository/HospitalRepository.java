package com.bloodsystem.repository;

import com.bloodsystem.model.Hospital;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface HospitalRepository extends JpaRepository<Hospital, UUID> {
    List<Hospital> findByHospitalNameContainingIgnoreCase(String hospitalName);
}
