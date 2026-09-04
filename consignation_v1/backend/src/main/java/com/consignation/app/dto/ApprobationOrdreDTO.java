package com.consignation.app.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ApprobationOrdreDTO {
    private Long id;
    private Long planId;
    private Long utilisateurId;
    private String utilisateurNom;
    private String utilisateurMatricule;
    private boolean approuve;
    private LocalDateTime dateApprobation;
}
