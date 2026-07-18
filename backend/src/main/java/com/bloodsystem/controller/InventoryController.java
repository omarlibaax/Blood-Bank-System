package com.bloodsystem.controller;

import com.bloodsystem.model.BloodInventory;
import com.bloodsystem.service.InventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;

    @GetMapping
    public List<BloodInventory> getAllInventory() {
        return inventoryService.getAllInventory();
    }

    @GetMapping("/{id}")
    public BloodInventory getInventoryById(@PathVariable UUID id) {
        return inventoryService.getInventoryById(id);
    }

    @PostMapping
    public BloodInventory createInventory(@RequestBody BloodInventory item) {
        return inventoryService.createInventory(item);
    }

    @PutMapping("/{id}")
    public BloodInventory updateInventory(@PathVariable UUID id, @RequestBody BloodInventory item) {
        return inventoryService.updateInventory(id, item);
    }

    @DeleteMapping("/{id}")
    public void deleteInventory(@PathVariable UUID id) {
        inventoryService.deleteInventory(id);
    }

    @PostMapping("/check-expired")
    public String checkExpired() {
        inventoryService.checkAndMarkExpired();
        return "Expired items checked and updated successfully.";
    }
}
