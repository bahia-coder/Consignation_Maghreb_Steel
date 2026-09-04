package com.consignation.app.service;

import com.consignation.app.dto.EnergieDangereuseDTO;
import com.consignation.app.model.*;
import com.consignation.app.repository.DispositifIsolationRepository;
import com.consignation.app.repository.EnergieDangereuseRepository;
import com.consignation.app.repository.PlanConsignationRepository;
import com.consignation.app.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class EnergieDangereuseService {

    private final EnergieDangereuseRepository energieRepository;
    private final PlanConsignationRepository planRepository;
    private final DispositifIsolationRepository dispositifRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final HistoriqueService historiqueService;
    private final ApprobationOrdreService approbationService;

    public List<EnergieDangereuseDTO> findByPlan(Long planId) {
        return energieRepository.findByPlanIdOrderByOrdreAsc(planId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private void verifierEtReactiverSiNecessaire(PlanConsignation plan) {
        if (plan.getStatut() == StatutPlan.PLAN_VALIDE || plan.getStatut() == StatutPlan.PLAN_TESTE) {
            throw new IllegalStateException("Impossible de modifier un plan validé ou testé.");
        }
        if (plan.getStatut() == StatutPlan.DEMANDE_REJETE || plan.getStatut() == StatutPlan.DEMANDE_EN_COURS) {
            throw new IllegalStateException("La demande doit être acceptée avant d'ajouter des énergies.");
        }
        // Passage automatique DEMANDE_ACCEPTE → PLAN_EN_COURS à l'ajout de la 1ère énergie
        if (plan.getStatut() == StatutPlan.DEMANDE_ACCEPTE) {
            plan.setStatut(StatutPlan.PLAN_EN_COURS);
            planRepository.save(plan);
            historiqueService.enregistrer(plan, TypeAction.PLAN_EN_COURS,
                    "Plan passé en cours — première énergie dangereuse ajoutée", null);
        }
        // Retour en plan en cours si soumis ou rejeté
        if (plan.getStatut() == StatutPlan.PLAN_EN_ATTENTE_VALIDATION || plan.getStatut() == StatutPlan.PLAN_REJETE) {
            plan.setStatut(StatutPlan.PLAN_EN_COURS);
            planRepository.save(plan);
            historiqueService.enregistrer(plan, TypeAction.PLAN_EN_COURS,
                    "Plan remis en cours suite à une modification des énergies", null);
        }
    }

    public List<EnergieDangereuseDTO> ajouterBatch(Long planId, List<EnergieDangereuseDTO> items, Long saisieParId) {
        PlanConsignation plan = planRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Plan non trouvé : " + planId));

        verifierEtReactiverSiNecessaire(plan);

        Utilisateur saisiePar = saisieParId != null
                ? utilisateurRepository.findById(saisieParId).orElse(null)
                : null;

        int ordreCounter = energieRepository.findByPlanIdOrderByOrdreAsc(planId).size() + 1;

        for (EnergieDangereuseDTO dto : items) {
            DispositifIsolation dispositif = dto.getDispositifId() != null
                    ? dispositifRepository.findById(dto.getDispositifId()).orElse(null)
                    : null;

            EnergieDangereuse energie = EnergieDangereuse.builder()
                    .ordre(ordreCounter++)
                    .plan(plan)
                    .equipementOrgane(dto.getEquipementOrgane())
                    .type(dto.getType())
                    .energieResiduelle(dto.getEnergieResiduelle())
                    .repereLocalisation(dto.getRepereLocalisation())
                    .action(dto.getAction())
                    .dispositif(dispositif)
                    .pointValeurVAE(dto.getPointValeurVAE())
                    .saisiePar(saisiePar)
                    .build();

            energieRepository.save(energie);
        }

        if (saisiePar != null) approbationService.enregistrerParticipant(plan, saisiePar);
        approbationService.reinitialiser(plan);
        historiqueService.enregistrer(plan, TypeAction.ENERGIE_AJOUTEE,
                items.size() + " énergie(s) dangereuse(s) ajoutée(s)", saisiePar);

        return findByPlan(planId);
    }

    public EnergieDangereuseDTO modifier(Long id, EnergieDangereuseDTO dto, Long userId) {
        EnergieDangereuse e = energieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Énergie non trouvée : " + id));

        verifierEtReactiverSiNecessaire(e.getPlan());

        DispositifIsolation dispositif = dto.getDispositifId() != null
                ? dispositifRepository.findById(dto.getDispositifId()).orElse(null)
                : null;

        String ancienOrgane = e.getEquipementOrgane();

        e.setEquipementOrgane(dto.getEquipementOrgane());
        e.setType(dto.getType());
        e.setEnergieResiduelle(dto.getEnergieResiduelle());
        e.setRepereLocalisation(dto.getRepereLocalisation());
        e.setAction(dto.getAction());
        e.setDispositif(dispositif);
        e.setPointValeurVAE(dto.getPointValeurVAE());

        Utilisateur user = userId != null ? utilisateurRepository.findById(userId).orElse(null) : null;
        EnergieDangereuse saved = energieRepository.save(e);
        approbationService.reinitialiser(saved.getPlan());
        historiqueService.enregistrer(saved.getPlan(), TypeAction.ENERGIE_MODIFIEE,
                "Énergie modifiée — Organe : " + nvl(ancienOrgane)
                + " | Type : " + (saved.getType() != null ? saved.getType().name() : "—"), user);
        return toDTO(saved);
    }

    public void supprimer(Long id, Long userId) {
        EnergieDangereuse energie = energieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Énergie non trouvée : " + id));

        PlanConsignation plan = energie.getPlan();
        verifierEtReactiverSiNecessaire(plan);
        String desc = "Énergie supprimée — Organe : " + nvl(energie.getEquipementOrgane())
                + " | Type : " + (energie.getType() != null ? energie.getType().name() : "—");
        Utilisateur user = userId != null ? utilisateurRepository.findById(userId).orElse(null) : null;

        energieRepository.delete(energie);
        reordonner(plan.getId());
        approbationService.reinitialiser(plan);
        historiqueService.enregistrer(plan, TypeAction.ENERGIE_SUPPRIMEE, desc, user);
    }

    public List<EnergieDangereuseDTO> deplacerVersHaut(Long id, Long userId) {
        EnergieDangereuse energie = energieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Énergie non trouvée : " + id));
        if (energie.getOrdre() <= 1) return findByPlan(energie.getPlan().getId());

        verifierEtReactiverSiNecessaire(energie.getPlan());
        Utilisateur user = userId != null ? utilisateurRepository.findById(userId).orElse(null) : null;
        List<EnergieDangereuse> energies = energieRepository.findByPlanIdOrderByOrdreAsc(energie.getPlan().getId());
        int idx = energies.indexOf(energie);
        if (idx > 0) {
            EnergieDangereuse precedente = energies.get(idx - 1);
            int tmp = energie.getOrdre();
            energie.setOrdre(precedente.getOrdre());
            precedente.setOrdre(tmp);
            energieRepository.save(energie);
            energieRepository.save(precedente);
            approbationService.reinitialiser(energie.getPlan());
            historiqueService.enregistrer(energie.getPlan(), TypeAction.ORDRE_MODIFIE,
                    "Ordre modifié — " + nvl(energie.getEquipementOrgane()) + " déplacé vers le haut", user);
        }
        return findByPlan(energie.getPlan().getId());
    }

    public List<EnergieDangereuseDTO> deplacerVersBas(Long id, Long userId) {
        EnergieDangereuse energie = energieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Énergie non trouvée : " + id));
        verifierEtReactiverSiNecessaire(energie.getPlan());
        Utilisateur user = userId != null ? utilisateurRepository.findById(userId).orElse(null) : null;
        List<EnergieDangereuse> energies = energieRepository.findByPlanIdOrderByOrdreAsc(energie.getPlan().getId());
        int idx = energies.indexOf(energie);
        if (idx < energies.size() - 1) {
            EnergieDangereuse suivante = energies.get(idx + 1);
            int tmp = energie.getOrdre();
            energie.setOrdre(suivante.getOrdre());
            suivante.setOrdre(tmp);
            energieRepository.save(energie);
            energieRepository.save(suivante);
            approbationService.reinitialiser(energie.getPlan());
            historiqueService.enregistrer(energie.getPlan(), TypeAction.ORDRE_MODIFIE,
                    "Ordre modifié — " + nvl(energie.getEquipementOrgane()) + " déplacé vers le bas", user);
        }
        return findByPlan(energie.getPlan().getId());
    }

    public List<EnergieDangereuseDTO> synchroniser(Long planId, List<EnergieDangereuseDTO> items, Long saisieParId) {
        PlanConsignation plan = planRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Plan non trouvé : " + planId));

        verifierEtReactiverSiNecessaire(plan);

        Utilisateur saisiePar = saisieParId != null
                ? utilisateurRepository.findById(saisieParId).orElse(null)
                : null;

        List<EnergieDangereuse> existing = energieRepository.findByPlanIdOrderByOrdreAsc(planId);

        // IDs soumis (lignes existantes conservées)
        Set<Long> submittedIds = items.stream()
                .filter(d -> d.getId() != null)
                .map(EnergieDangereuseDTO::getId)
                .collect(Collectors.toSet());

        // Supprimer les lignes absentes de la soumission
        for (EnergieDangereuse e : existing) {
            if (!submittedIds.contains(e.getId())) {
                energieRepository.delete(e);
            }
        }

        // Anciens ordres pour détecter un changement
        Map<Long, Integer> oldOrdres = existing.stream()
                .collect(Collectors.toMap(EnergieDangereuse::getId, EnergieDangereuse::getOrdre));

        boolean ordreChanged = false;
        int ajouts = 0;

        for (int i = 0; i < items.size(); i++) {
            EnergieDangereuseDTO dto = items.get(i);
            int newOrdre = i + 1;

            DispositifIsolation dispositif = dto.getDispositifId() != null
                    ? dispositifRepository.findById(dto.getDispositifId()).orElse(null)
                    : null;

            if (dto.getId() != null) {
                energieRepository.findById(dto.getId()).ifPresent(e -> {
                    if (!Objects.equals(oldOrdres.get(e.getId()), newOrdre)) {
                        // ordreChanged handled below
                    }
                    e.setOrdre(newOrdre);
                    e.setEquipementOrgane(dto.getEquipementOrgane());
                    e.setType(dto.getType());
                    e.setEnergieResiduelle(dto.getEnergieResiduelle());
                    e.setRepereLocalisation(dto.getRepereLocalisation());
                    e.setAction(dto.getAction());
                    e.setDispositif(dispositif);
                    e.setPointValeurVAE(dto.getPointValeurVAE());
                    energieRepository.save(e);
                });
                Integer prev = oldOrdres.get(dto.getId());
                if (prev != null && prev != newOrdre) ordreChanged = true;
            } else {
                EnergieDangereuse energie = EnergieDangereuse.builder()
                        .ordre(newOrdre)
                        .plan(plan)
                        .equipementOrgane(dto.getEquipementOrgane())
                        .type(dto.getType())
                        .repereLocalisation(dto.getRepereLocalisation())
                        .action(dto.getAction())
                        .dispositif(dispositif)
                        .pointValeurVAE(dto.getPointValeurVAE())
                        .saisiePar(saisiePar)
                        .build();
                energieRepository.save(energie);
                ajouts++;
            }
        }

        if (ajouts > 0 && saisiePar != null) approbationService.enregistrerParticipant(plan, saisiePar);
        approbationService.reinitialiser(plan);

        if (ordreChanged) {
            historiqueService.enregistrer(plan, TypeAction.ORDRE_MODIFIE,
                    "Ordre des énergies modifié depuis le formulaire de saisie", saisiePar);
        }
        if (ajouts > 0) {
            historiqueService.enregistrer(plan, TypeAction.ENERGIE_AJOUTEE,
                    ajouts + " énergie(s) dangereuse(s) ajoutée(s)", saisiePar);
        }
        if (!ordreChanged && ajouts == 0) {
            historiqueService.enregistrer(plan, TypeAction.ENERGIE_MODIFIEE,
                    "Énergies dangereuses mises à jour", saisiePar);
        }

        return findByPlan(planId);
    }

    private void reordonner(Long planId) {
        List<EnergieDangereuse> energies = energieRepository.findByPlanIdOrderByOrdreAsc(planId);
        for (int i = 0; i < energies.size(); i++) {
            energies.get(i).setOrdre(i + 1);
        }
        energieRepository.saveAll(energies);
    }

    private String nvl(String s) {
        return (s != null && !s.isBlank()) ? s : "—";
    }

    private EnergieDangereuseDTO toDTO(EnergieDangereuse e) {
        Utilisateur sp = e.getSaisiePar();
        return EnergieDangereuseDTO.builder()
                .id(e.getId())
                .ordre(e.getOrdre())
                .planId(e.getPlan().getId())
                .equipementOrgane(e.getEquipementOrgane())
                .type(e.getType())
                .energieResiduelle(e.getEnergieResiduelle())
                .repereLocalisation(e.getRepereLocalisation())
                .action(e.getAction())
                .dispositifId(e.getDispositif() != null ? e.getDispositif().getId() : null)
                .dispositifDesignation(e.getDispositif() != null ? e.getDispositif().getDesignation() : null)
                .pointValeurVAE(e.getPointValeurVAE())
                .saisieParId(sp != null ? sp.getId() : null)
                .saisieParNom(sp != null ? sp.getPrenom() + " " + sp.getNom() : null)
                .saisieParMatricule(sp != null ? sp.getMatricule() : null)
                .build();
    }
}
