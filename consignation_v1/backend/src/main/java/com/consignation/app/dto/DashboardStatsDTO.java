package com.consignation.app.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class DashboardStatsDTO {
    private long totalPlans;
    // Nouvelles statistiques par statut
    private long plansDemandeEnCours;
    private long plansDemandeAccepte;
    private long plansDemandeRejete;
    private long plansEnCours;
    private long plansEnAttenteValidation;
    private long plansValides;
    private long plansRejetes;
    private long plansTestes;

    private long totalEquipements;
    private List<HistoriquePlanDTO> activiteRecente;
    private Map<String, Long> plansParMois;

    // Admin uniquement
    private Long totalUtilisateurs;
    private Long totalZones;
    private Map<String, Long> utilisateursParRole;
    private List<ZoneStatsDTO> statsParZone;

    // Manager / Chargé uniquement
    private String zoneCode;
    private String zoneNom;
}
