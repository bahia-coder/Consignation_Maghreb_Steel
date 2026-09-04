package com.consignation.app.service;

import com.consignation.app.dto.ApprobationOrdreDTO;
import com.consignation.app.model.ApprobationOrdre;
import com.consignation.app.model.PlanConsignation;
import com.consignation.app.model.Utilisateur;
import com.consignation.app.repository.ApprobationOrdreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ApprobationOrdreService {

    private final ApprobationOrdreRepository approbationRepository;

    /** Enregistre l'utilisateur comme participant s'il ne l'est pas déjà. */
    public void enregistrerParticipant(PlanConsignation plan, Utilisateur utilisateur) {
        if (utilisateur == null) return;
        if (!approbationRepository.existsByPlanIdAndUtilisateurId(plan.getId(), utilisateur.getId())) {
            approbationRepository.save(ApprobationOrdre.builder()
                    .plan(plan)
                    .utilisateur(utilisateur)
                    .approuve(false)
                    .build());
        }
    }

    /** Remet toutes les approbations du plan à false (après tout changement d'énergie). */
    public void reinitialiser(PlanConsignation plan) {
        List<ApprobationOrdre> all = approbationRepository.findByPlanId(plan.getId());
        all.forEach(a -> {
            a.setApprouve(false);
            a.setDateApprobation(null);
        });
        approbationRepository.saveAll(all);
    }

    /** L'utilisateur courant approuve l'ordre des énergies du plan. */
    public ApprobationOrdreDTO approuver(Long planId, Long userId) {
        ApprobationOrdre a = approbationRepository.findByPlanIdAndUtilisateurId(planId, userId)
                .orElseThrow(() -> new IllegalStateException(
                        "Vous n'êtes pas participant à la saisie des énergies de ce plan."));
        a.setApprouve(true);
        a.setDateApprobation(LocalDateTime.now());
        return toDTO(approbationRepository.save(a));
    }

    /** Tous les participants ont-ils approuvé ? */
    @Transactional(readOnly = true)
    public boolean tousApprouves(Long planId) {
        List<ApprobationOrdre> all = approbationRepository.findByPlanId(planId);
        return !all.isEmpty() && all.stream().allMatch(ApprobationOrdre::isApprouve);
    }

    /** Y a-t-il au moins un participant ? */
    @Transactional(readOnly = true)
    public boolean aDesParticipants(Long planId) {
        return !approbationRepository.findByPlanId(planId).isEmpty();
    }

    /** Supprime les participations liées à un plan (nécessaire avant une suppression DB du plan : FK NOT NULL sans cascade). */
    public void supprimerParPlan(Long planId) {
        approbationRepository.deleteByPlanId(planId);
    }

    /** L'utilisateur est-il participant ? */
    @Transactional(readOnly = true)
    public boolean estParticipant(Long planId, Long userId) {
        return approbationRepository.existsByPlanIdAndUtilisateurId(planId, userId);
    }

    @Transactional(readOnly = true)
    public List<ApprobationOrdreDTO> findByPlan(Long planId) {
        return approbationRepository.findByPlanId(planId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private ApprobationOrdreDTO toDTO(ApprobationOrdre a) {
        Utilisateur u = a.getUtilisateur();
        return ApprobationOrdreDTO.builder()
                .id(a.getId())
                .planId(a.getPlan().getId())
                .utilisateurId(u.getId())
                .utilisateurNom(u.getPrenom() + " " + u.getNom())
                .utilisateurMatricule(u.getMatricule())
                .approuve(a.isApprouve())
                .dateApprobation(a.getDateApprobation())
                .build();
    }
}
