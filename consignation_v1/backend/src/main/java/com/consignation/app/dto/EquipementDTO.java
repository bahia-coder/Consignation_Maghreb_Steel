package com.consignation.app.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EquipementDTO {
    private Long id;
    private String code;
    private String description;
    private Long parentId;
    private String parentCode;
    private Long zoneId;
    private String zoneCode;
    private boolean hasSousEquipements;
    private int nombrePlans;
}
