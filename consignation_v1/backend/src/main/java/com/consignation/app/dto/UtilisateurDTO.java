package com.consignation.app.dto;

import lombok.Data;

@Data
public class UtilisateurDTO {
    private Long id;
    private String matricule;
    private String username;
    private String password;
    private String nom;
    private String prenom;
    private String role;
    private Long zoneId;
    private String zoneCode;
    private String zoneNom;
}
