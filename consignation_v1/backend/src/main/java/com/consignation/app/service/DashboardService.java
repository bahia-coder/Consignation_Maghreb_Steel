package com.consignation.app.service;

import com.consignation.app.dto.DashboardStatsDTO;
import com.consignation.app.dto.HistoriquePlanDTO;
import com.consignation.app.dto.ZoneStatsDTO;
import com.consignation.app.model.PlanConsignation;
import com.consignation.app.model.Role;
import com.consignation.app.model.StatutPlan;
import com.consignation.app.model.Zone;
import com.consignation.app.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final PlanConsignationRepository planRepository;
    private final EquipementRepository equipementRepository;
    private final HistoriquePlanRepository historiqueRepository;
    private final ZoneRepository zoneRepository;
    private final UtilisateurRepository utilisateurRepository;

    private Map<String, Long> buildPlansParMois(List<PlanConsignation> plans) {
        YearMonth now = YearMonth.now();
        Map<String, Long> map = new LinkedHashMap<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = now.minusMonths(i);
            map.put(ym.toString(), 0L);
        }
        plans.forEach(p -> {
            if (p.getDateCreation() == null) return;
            String key = YearMonth.from(p.getDateCreation()).toString();
            if (map.containsKey(key)) map.put(key, map.get(key) + 1);
        });
        return map;
    }

    public DashboardStatsDTO getStatsAdmin() {
        long total             = planRepository.count();
        long demandeEnCours    = planRepository.countByStatut(StatutPlan.DEMANDE_EN_COURS);
        long demandeAccepte    = planRepository.countByStatut(StatutPlan.DEMANDE_ACCEPTE);
        long demandeRejete     = planRepository.countByStatut(StatutPlan.DEMANDE_REJETE);
        long enCours           = planRepository.countByStatut(StatutPlan.PLAN_EN_COURS);
        long enAttenteVal      = planRepository.countByStatut(StatutPlan.PLAN_EN_ATTENTE_VALIDATION);
        long valides           = planRepository.countByStatut(StatutPlan.PLAN_VALIDE);
        long rejetes           = planRepository.countByStatut(StatutPlan.PLAN_REJETE);
        long testes            = planRepository.countByStatut(StatutPlan.PLAN_TESTE);

        List<Zone> zones = zoneRepository.findAll();
        List<ZoneStatsDTO> statsParZone = zones.stream()
                .map(z -> ZoneStatsDTO.builder()
                        .zoneCode(z.getCode())
                        .zoneNom(z.getNom())
                        .totalPlans(planRepository.countByEquipement_ZoneId(z.getId()))
                        .plansValides(planRepository.countByEquipement_ZoneIdAndStatut(z.getId(), StatutPlan.PLAN_VALIDE))
                        .plansEnCours(planRepository.countByEquipement_ZoneIdAndStatut(z.getId(), StatutPlan.PLAN_EN_COURS))
                        .plansEnAttente(planRepository.countByEquipement_ZoneIdAndStatut(z.getId(), StatutPlan.PLAN_EN_ATTENTE_VALIDATION))
                        .totalEquipements(equipementRepository.countByZoneId(z.getId()))
                        .build())
                .collect(Collectors.toList());

        Map<String, Long> utilisateursParRole = Map.of(
                "ADMIN",          utilisateurRepository.countByRole(Role.ADMIN),
                "MANAGER",        utilisateurRepository.countByRole(Role.MANAGER),
                "CHARGE",         utilisateurRepository.countByRole(Role.CHARGE),
                "CHARGE_TRAVAUX", utilisateurRepository.countByRole(Role.CHARGE_TRAVAUX)
        );

        List<HistoriquePlanDTO> activite = historiqueRepository.findTop10ByOrderByDateActionDesc()
                .stream().map(h -> HistoriquePlanDTO.builder()
                        .id(h.getId())
                        .planId(h.getPlan().getId())
                        .typeAction(h.getTypeAction())
                        .dateAction(h.getDateAction())
                        .description(h.getDescription())
                        .build())
                .collect(Collectors.toList());

        LocalDateTime sixMonthsAgo = LocalDateTime.now().minusMonths(6).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        List<PlanConsignation> recentPlans = planRepository.findByDateCreationBetween(sixMonthsAgo, LocalDateTime.now().plusDays(1));
        Map<String, Long> plansParMois = buildPlansParMois(recentPlans);

        return DashboardStatsDTO.builder()
                .totalPlans(total)
                .plansDemandeEnCours(demandeEnCours)
                .plansDemandeAccepte(demandeAccepte)
                .plansDemandeRejete(demandeRejete)
                .plansEnCours(enCours)
                .plansEnAttenteValidation(enAttenteVal)
                .plansValides(valides)
                .plansRejetes(rejetes)
                .plansTestes(testes)
                .totalEquipements(equipementRepository.count())
                .totalUtilisateurs(utilisateurRepository.count())
                .totalZones((long) zones.size())
                .utilisateursParRole(utilisateursParRole)
                .statsParZone(statsParZone)
                .activiteRecente(activite)
                .plansParMois(plansParMois)
                .build();
    }

    public DashboardStatsDTO getStatsZone(Long zoneId) {
        Zone zone = zoneRepository.findById(zoneId).orElseThrow();

        long total          = planRepository.countByEquipement_ZoneId(zoneId);
        long demandeEnCours = planRepository.countByEquipement_ZoneIdAndStatut(zoneId, StatutPlan.DEMANDE_EN_COURS);
        long demandeAccepte = planRepository.countByEquipement_ZoneIdAndStatut(zoneId, StatutPlan.DEMANDE_ACCEPTE);
        long demandeRejete  = planRepository.countByEquipement_ZoneIdAndStatut(zoneId, StatutPlan.DEMANDE_REJETE);
        long enCours        = planRepository.countByEquipement_ZoneIdAndStatut(zoneId, StatutPlan.PLAN_EN_COURS);
        long enAttenteVal   = planRepository.countByEquipement_ZoneIdAndStatut(zoneId, StatutPlan.PLAN_EN_ATTENTE_VALIDATION);
        long valides        = planRepository.countByEquipement_ZoneIdAndStatut(zoneId, StatutPlan.PLAN_VALIDE);
        long rejetes        = planRepository.countByEquipement_ZoneIdAndStatut(zoneId, StatutPlan.PLAN_REJETE);
        long testes         = planRepository.countByEquipement_ZoneIdAndStatut(zoneId, StatutPlan.PLAN_TESTE);

        List<HistoriquePlanDTO> activite = historiqueRepository
                .findTop10ByPlan_Equipement_ZoneIdOrderByDateActionDesc(zoneId)
                .stream().map(h -> HistoriquePlanDTO.builder()
                        .id(h.getId())
                        .planId(h.getPlan().getId())
                        .typeAction(h.getTypeAction())
                        .dateAction(h.getDateAction())
                        .description(h.getDescription())
                        .build())
                .collect(Collectors.toList());

        LocalDateTime sixMonthsAgo = LocalDateTime.now().minusMonths(6).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        List<PlanConsignation> recentPlans = planRepository.findByEquipement_ZoneIdAndDateCreationBetween(
                zoneId, sixMonthsAgo, LocalDateTime.now().plusDays(1));
        Map<String, Long> plansParMois = buildPlansParMois(recentPlans);

        return DashboardStatsDTO.builder()
                .totalPlans(total)
                .plansDemandeEnCours(demandeEnCours)
                .plansDemandeAccepte(demandeAccepte)
                .plansDemandeRejete(demandeRejete)
                .plansEnCours(enCours)
                .plansEnAttenteValidation(enAttenteVal)
                .plansValides(valides)
                .plansRejetes(rejetes)
                .plansTestes(testes)
                .totalEquipements(equipementRepository.countByZoneId(zoneId))
                .zoneCode(zone.getCode())
                .zoneNom(zone.getNom())
                .activiteRecente(activite)
                .plansParMois(plansParMois)
                .build();
    }
}
