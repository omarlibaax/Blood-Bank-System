package com.bloodsystem.controller;

import com.bloodsystem.dto.*;
import com.bloodsystem.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    private void requireAdmin(Principal principal) {
        if (principal == null || !userService.isAdministrator(principal.getName())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Administrator access required");
        }
    }

    @GetMapping("/me")
    public UserResponse getCurrentUser(Principal principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        return userService.getUserByUsername(principal.getName());
    }

    @GetMapping
    public List<UserResponse> getAllUsers(Principal principal) {
        requireAdmin(principal);
        return userService.getAllUsers();
    }

    @GetMapping("/{id}")
    public UserResponse getUserById(@PathVariable UUID id, Principal principal) {
        requireAdmin(principal);
        return userService.getUserById(id);
    }

    @PostMapping
    public UserResponse createUser(@Valid @RequestBody UserCreateRequest request, Principal principal) {
        requireAdmin(principal);
        return userService.createUser(request);
    }

    @PutMapping("/{id}")
    public UserResponse updateUser(@PathVariable UUID id, @Valid @RequestBody UserUpdateRequest request, Principal principal) {
        requireAdmin(principal);
        return userService.updateUser(id, request);
    }

    @PostMapping("/{id}/reset-password")
    public MessageResponse resetPassword(@PathVariable UUID id, @RequestBody Map<String, String> body, Principal principal) {
        requireAdmin(principal);
        String newPassword = body.get("newPassword");
        if (newPassword == null || newPassword.length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 6 characters");
        }
        userService.resetUserPassword(id, newPassword);
        return new MessageResponse("Password reset successfully");
    }

    @DeleteMapping("/{id}")
    public MessageResponse deleteUser(@PathVariable UUID id, Principal principal) {
        requireAdmin(principal);
        userService.deleteUser(id, principal.getName());
        return new MessageResponse("User deleted successfully");
    }

    @PostMapping("/change-password")
    public MessageResponse changeOwnPassword(@Valid @RequestBody PasswordChangeRequest request, Principal principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        userService.changeOwnPassword(principal.getName(), request);
        return new MessageResponse("Password updated successfully");
    }
}
