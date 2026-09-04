package com.consignation.app.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoginResponse {
    private String token;
    private Long userId;
    private String matricule;
    private String username;
    private String nom;
    private String prenom;
    private String role;
    private Long zoneId;
    private String zoneCode;
    private String zoneNom;
}
