package com.consignation.app.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DemandePlanDTO {

    @NotNull
    private Long equipementId;

    @NotBlank
    private String descriptionIntervention;

    private String responsableIntervention;
}
