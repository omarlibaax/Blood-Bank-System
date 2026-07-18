package com.bloodsystem.controller;

import com.bloodsystem.model.BloodRequest;
import com.bloodsystem.model.User;
import com.bloodsystem.repository.UserRepository;
import com.bloodsystem.service.RequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/requests")
public class RequestController {

    @Autowired
    private RequestService requestService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public List<BloodRequest> getAllRequests() {
        return requestService.getAllRequests();
    }

    @GetMapping("/{id}")
    public BloodRequest getRequestById(@PathVariable UUID id) {
        return requestService.getRequestById(id);
    }

    @PostMapping
    public BloodRequest createRequest(@RequestBody BloodRequest request) {
        return requestService.createRequest(request);
    }

    @PutMapping("/{id}")
    public BloodRequest updateRequest(@PathVariable UUID id, @RequestBody BloodRequest request) {
        return requestService.updateRequest(id, request);
    }

    @DeleteMapping("/{id}")
    public void deleteRequest(@PathVariable UUID id) {
        requestService.deleteRequest(id);
    }

    @PostMapping("/{id}/approve")
    public BloodRequest approveRequest(@PathVariable UUID id, Principal principal) {
        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("Logged-in user not found!"));
        return requestService.approveRequest(id, user.getId());
    }

    @PostMapping("/{id}/reject")
    public BloodRequest rejectRequest(@PathVariable UUID id) {
        return requestService.rejectRequest(id);
    }
}
