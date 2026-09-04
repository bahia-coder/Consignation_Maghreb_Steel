package com.consignation.app.dto;

import com.consignation.app.model.DecisionValidation;
import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ValidationDTO {
    private Long id;
    private DecisionValidation decision;
    private LocalDateTime dateValidation;
    private String commentaire;
    private Long planId;
    private SignatureNumeriqueDTO signature;
}
