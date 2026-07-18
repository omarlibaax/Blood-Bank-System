package com.bloodsystem.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JwtResponse {
    private String token;
    private String type = "Bearer";
    private String username;
    private String fullName;
    private String email;
    private String phone;
    private List<String> roles;

    public JwtResponse(String accessToken, String username, String fullName, String email, String phone, List<String> roles) {
        this.token = accessToken;
        this.username = username;
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.roles = roles;
    }
}
