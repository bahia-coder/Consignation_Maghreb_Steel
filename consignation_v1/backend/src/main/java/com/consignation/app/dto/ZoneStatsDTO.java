package com.consignation.app.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ZoneStatsDTO {
    private String zoneCode;
    private String zoneNom;
    private long totalPlans;
    private long plansValides;
    private long plansEnCours;
    private long plansEnAttente;
    private long totalEquipements;
}
