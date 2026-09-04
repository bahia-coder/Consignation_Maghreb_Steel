package com.consignation.app.dto;

import com.consignation.app.model.TypeAction;
import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class HistoriquePlanDTO {
    private Long id;
    private Long planId;
    private TypeAction typeAction;
    private LocalDateTime dateAction;
    private String description;
    private String realiseeParNom;
}
