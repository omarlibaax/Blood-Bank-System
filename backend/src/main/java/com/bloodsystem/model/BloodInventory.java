package com.bloodsystem.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "blood_inventory")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BloodInventory {
    @Id
    @GeneratedValue
    @Column(name = "inventory_id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "donation_id")
    private Donation donation;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "blood_group_id")
    private BloodGroup bloodGroup;

    @Column(name = "blood_bag_number", unique = true, nullable = false, length = 50)
    private String bloodBagNumber;

    @Column(name = "collection_date")
    private LocalDate collectionDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "units", precision = 5, scale = 2)
    private BigDecimal units;

    @Column(name = "location", length = 100)
    private String location;

    @Column(name = "status", length = 20)
    @Builder.Default
    private String status = "Available";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
