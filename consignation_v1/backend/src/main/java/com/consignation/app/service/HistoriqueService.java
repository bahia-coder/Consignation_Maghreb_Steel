package com.consignation.app.service;

import com.consignation.app.dto.HistoriquePlanDTO;
import com.consignation.app.model.HistoriquePlan;
import com.consignation.app.model.PlanConsignation;
import com.consignation.app.model.TypeAction;
import com.consignation.app.model.Utilisateur;
import com.consignation.app.repository.HistoriquePlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HistoriqueService {

    private final HistoriquePlanRepository historiqueRepository;

    @Transactional(propagation = Propagation.REQUIRED)
    public void enregistrer(PlanConsignation plan, TypeAction typeAction, String description) {
        enregistrer(plan, typeAction, description, null);
    }

    @Transactional(propagation = Propagation.REQUIRED)
    public void enregistrer(PlanConsignation plan, TypeAction typeAction, String description, Utilisateur realiseePar) {
        HistoriquePlan h = HistoriquePlan.builder()
                .plan(plan)
                .typeAction(typeAction)
                .dateAction(LocalDateTime.now())
                .description(description)
                .realiseePar(realiseePar)
                .build();
        historiqueRepository.save(h);
    }

    /**
     * Supprime l'historique d'un plan. Nécessaire avant une suppression DB du plan
     * lui-même : plan_id est une FK NOT NULL sans cascade depuis PlanConsignation.
     * La traçabilité de la suppression est conservée côté backup (archive PDF + log),
     * pas en base.
     */
    @Transactional(propagation = Propagation.REQUIRED)
    public void deleteByPlan(Long planId) {
        historiqueRepository.deleteByPlanId(planId);
    }

    @Transactional(readOnly = true)
    public List<HistoriquePlanDTO> findByPlan(Long planId) {
        return historiqueRepository.findByPlanIdOrderByDateActionAsc(planId).stream()
                .map(h -> {
                    Utilisateur u = h.getRealiseePar();
                    return HistoriquePlanDTO.builder()
                            .id(h.getId())
                            .planId(h.getPlan().getId())
                            .typeAction(h.getTypeAction())
                            .dateAction(h.getDateAction())
                            .description(h.getDescription())
                            .realiseeParNom(u != null ? u.getPrenom() + " " + u.getNom() : null)
                            .build();
                })
                .collect(Collectors.toList());
    }
}
