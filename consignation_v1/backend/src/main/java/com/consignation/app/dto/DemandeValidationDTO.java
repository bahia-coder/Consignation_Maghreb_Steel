package com.consignation.app.dto;

import com.consignation.app.model.DecisionValidation;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DemandeValidationDTO {

    @NotNull
    private DecisionValidation decision;

    private String commentaire;

    @NotBlank
    private String donneesSignature;
}
