package com.bloodsystem.repository;

import com.bloodsystem.model.BloodIssueLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BloodIssueLogRepository extends JpaRepository<BloodIssueLog, UUID> {
    List<BloodIssueLog> findByRequestItemId(UUID requestItemId);
    List<BloodIssueLog> findByBloodInventoryId(UUID bloodInventoryId);
    List<BloodIssueLog> findByBloodInventory_Id(UUID bloodInventoryId);
}
