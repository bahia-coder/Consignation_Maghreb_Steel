package com.consignation.app.dto;

import com.consignation.app.model.StatutPlan;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PlanConsignationDTO {
    private Long id;
    private String reference;
    private LocalDateTime dateCreation;
    private LocalDateTime dateEnvoi;
    private LocalDateTime dateValidation;
    private String descriptionIntervention;
    private String responsableIntervention;
    private Long demandeurId;
    private String demandeurNom;
    private String demandeurMatricule;
    private StatutPlan statut;
    private Long equipementId;
    private String equipementCode;
    private String equipementDescription;
    private List<EnergieDangereuseDTO> energies;
    private ValidationDTO validation;
}
