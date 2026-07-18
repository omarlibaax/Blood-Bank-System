package com.bloodsystem.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/test")
public class TestController {

    @GetMapping("/user")
    public Map<String, Object> userAccess(Principal principal) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Secured content retrieved successfully!");
        response.put("user", principal.getName());
        return response;
    }
}
