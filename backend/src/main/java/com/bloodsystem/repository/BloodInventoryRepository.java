package com.bloodsystem.repository;

import com.bloodsystem.model.BloodInventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BloodInventoryRepository extends JpaRepository<BloodInventory, UUID> {
    List<BloodInventory> findByStatus(String status);
    List<BloodInventory> findByBloodGroupIdAndStatus(Integer bloodGroupId, String status);
    List<BloodInventory> findByBloodGroupIdAndStatusOrderByExpiryDateAsc(Integer bloodGroupId, String status);
    List<BloodInventory> findByDonationId(UUID donationId);
}
