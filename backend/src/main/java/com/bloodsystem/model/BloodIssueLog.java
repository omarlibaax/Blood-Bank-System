package com.bloodsystem.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "blood_issue_log")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BloodIssueLog {
    @Id
    @GeneratedValue
    @Column(name = "issue_id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "request_item_id")
    private BloodRequestItem requestItem;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "inventory_id")
    private BloodInventory bloodInventory;

    @Column(name = "issued_units", precision = 5, scale = 2)
    private BigDecimal issuedUnits;

    @CreationTimestamp
    @Column(name = "issued_date", updatable = false)
    private LocalDateTime issuedDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issued_by")
    private User issuedBy;
}
