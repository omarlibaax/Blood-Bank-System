package com.bloodsystem.config;

import com.bloodsystem.model.Role;
import com.bloodsystem.model.User;
import com.bloodsystem.repository.RoleRepository;
import com.bloodsystem.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private BloodGroupRepository bloodGroupRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Seed Roles
        if (roleRepository.count() == 0) {
            List<Role> roles = List.of(
                    Role.builder().name("Administrator").description("System Administrator").build(),
                    Role.builder().name("Staff").description("Blood Bank Staff").build(),
                    Role.builder().name("Doctor").description("Medical Officer").build(),
                    Role.builder().name("Lab Technician").description("Laboratory Staff").build()
            );
            roleRepository.saveAll(roles);
            System.out.println("Roles successfully seeded.");
        }

        // Seed Blood Groups
        if (bloodGroupRepository.count() == 0) {
            List<BloodGroup> groups = List.of(
                    BloodGroup.builder().groupName("A+").build(),
                    BloodGroup.builder().groupName("A-").build(),
                    BloodGroup.builder().groupName("B+").build(),
                    BloodGroup.builder().groupName("B-").build(),
                    BloodGroup.builder().groupName("AB+").build(),
                    BloodGroup.builder().groupName("AB-").build(),
                    BloodGroup.builder().groupName("O+").build(),
                    BloodGroup.builder().groupName("O-").build()
            );
            bloodGroupRepository.saveAll(groups);
            System.out.println("Blood groups successfully seeded.");
        }

        // Seed default administrator when no users exist
        if (userRepository.count() == 0) {
            Role adminRole = roleRepository.findByName("Administrator")
                    .orElseThrow(() -> new RuntimeException("Administrator role not found"));

            User admin = User.builder()
                    .fullName("System Administrator")
                    .username("admin")
                    .email("admin@bloodbank.local")
                    .password(passwordEncoder.encode("admin123"))
                    .phone("")
                    .role(adminRole)
                    .status(true)
                    .build();
            userRepository.save(admin);
            System.out.println("Default admin user seeded (username: admin, password: admin123).");
        }
    }
}
