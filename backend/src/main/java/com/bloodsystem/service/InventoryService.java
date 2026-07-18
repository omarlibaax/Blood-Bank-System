package com.bloodsystem.service;

import com.bloodsystem.model.BloodInventory;
import com.bloodsystem.model.BloodIssueLog;
import com.bloodsystem.repository.BloodInventoryRepository;
import com.bloodsystem.repository.BloodIssueLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class InventoryService {

    @Autowired
    private BloodInventoryRepository inventoryRepository;

    @Autowired
    private BloodIssueLogRepository issueLogRepository;

    public List<BloodInventory> getAllInventory() {
        return inventoryRepository.findAll();
    }

    public BloodInventory getInventoryById(UUID id) {
        return inventoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inventory item not found with ID: " + id));
    }

    public BloodInventory createInventory(BloodInventory item) {
        if (item.getStatus() == null || item.getStatus().isBlank()) {
            item.setStatus("Available");
        }
        return inventoryRepository.save(item);
    }

    public BloodInventory updateInventory(UUID id, BloodInventory details) {
        BloodInventory item = getInventoryById(id);
        if (details.getBloodBagNumber() != null) {
            item.setBloodBagNumber(details.getBloodBagNumber());
        }
        if (details.getExpiryDate() != null) {
            item.setExpiryDate(details.getExpiryDate());
        }
        if (details.getUnits() != null) {
            item.setUnits(details.getUnits());
        }
        if (details.getLocation() != null) {
            item.setLocation(details.getLocation());
        }
        if (details.getStatus() != null && !details.getStatus().isBlank()) {
            item.setStatus(details.getStatus());
        }
        return inventoryRepository.save(item);
    }

    @Transactional
    public void deleteInventory(UUID id) {
        BloodInventory item = getInventoryById(id);
        List<BloodIssueLog> logs = issueLogRepository.findByBloodInventoryId(id);
        if (!logs.isEmpty()) {
            issueLogRepository.deleteAll(logs);
        }
        inventoryRepository.delete(item);
    }

    @Transactional
    public void checkAndMarkExpired() {
        List<BloodInventory> availableStock = inventoryRepository.findByStatus("Available");
        LocalDate today = LocalDate.now();
        for (BloodInventory item : availableStock) {
            if (item.getExpiryDate() != null && item.getExpiryDate().isBefore(today)) {
                item.setStatus("Expired");
                inventoryRepository.save(item);
            }
        }
    }
}
