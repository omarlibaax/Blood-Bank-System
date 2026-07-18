package com.bloodsystem.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "blood_groups")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BloodGroup {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "blood_group_id")
    private Integer id;

    @Column(name = "blood_group", unique = true, nullable = false, length = 5)
    private String groupName;
}
