package com.bloodsystem.repository;

import com.bloodsystem.model.Donor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DonorRepository extends JpaRepository<Donor, UUID> {
    List<Donor> findByFullNameContainingIgnoreCase(String fullName);
    List<Donor> findByBloodGroupId(Integer bloodGroupId);
}
