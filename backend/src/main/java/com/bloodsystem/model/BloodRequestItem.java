package com.bloodsystem.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "blood_request_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BloodRequestItem {
    @Id
    @GeneratedValue
    @Column(name = "item_id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private BloodRequest bloodRequest;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "blood_group_id")
    private BloodGroup bloodGroup;

    @Column(name = "requested_units", nullable = false, precision = 5, scale = 2)
    private BigDecimal requestedUnits;

    @Column(name = "issued_units", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal issuedUnits = BigDecimal.ZERO;
}
