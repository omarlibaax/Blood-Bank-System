package com.bloodsystem.repository;

import com.bloodsystem.model.BloodGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BloodGroupRepository extends JpaRepository<BloodGroup, Integer> {
    Optional<BloodGroup> findByGroupName(String groupName);
}
