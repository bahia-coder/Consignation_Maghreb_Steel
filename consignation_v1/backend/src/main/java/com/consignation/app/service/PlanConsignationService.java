package com.consignation.app.service;

import com.consignation.app.backup.PlanBackupEvent;
import com.consignation.app.dto.*;
import com.consignation.app.model.*;
import com.consignation.app.model.Role;
import com.consignation.app.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PlanConsignationService {

    private static final Map<String, String> ROLE_FONCTIONS = Map.of(
            "ADMIN",          "Administrateur",
            "MANAGER",        "Manager de Zone",
            "CHARGE",         "Chargé de Consignation",
            "CHARGE_TRAVAUX", "Chargé des Travaux"
    );

    // Une demande créée par un Manager ou un Chargé de Consignation est déjà émise par
    // quelqu'un habilité à l'accepter : on saute l'étape d'acceptation manuelle. Une
    // demande du Chargé des Travaux (ou sans demandeur identifié) suit le circuit normal.
    private static final Set<Role> AUTO_ACCEPT_ROLES = Set.of(Role.MANAGER, Role.CHARGE);

    private final PlanConsignationRepository planRepository;
    private final EquipementRepository equipementRepository;
    private final EnergieDangereuseRepository energieRepository;
    private final ValidationRepository validationRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final HistoriqueService historiqueService;
    private final ApprobationOrdreService approbationService;
    private final PdfGenerationService pdfService;
    private final ApplicationEventPublisher eventPublisher;

    public void verifierZoneEquipement(Long equipementId, Long zoneId) {
        Equipement equipement = equipementRepository.findById(equipementId)
                .orElseThrow(() -> new RuntimeException("Équipement non trouvé : " + equipementId));
        if (equipement.getZone() == null || !zoneId.equals(equipement.getZone().getId())) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Accès refusé : cet équipement n'appartient pas à votre zone.");
        }
    }

    public List<PlanConsignationDTO> findByEquipement(Long equipementId) {
        return planRepository.findByEquipementId(equipementId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<PlanConsignationDTO> findByZone(Long zoneId) {
        return planRepository.findByEquipement_ZoneId(zoneId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public PlanConsignationDTO findById(Long id) {
        PlanConsignation plan = planRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plan non trouvé : " + id));
        return toDTODetail(plan);
    }

    public PlanConsignationDTO creerDemande(DemandePlanDTO dto, Long demandeurId) {
        Equipement equipement = equipementRepository.findById(dto.getEquipementId())
                .orElseThrow(() -> new RuntimeException("Équipement non trouvé : " + dto.getEquipementId()));

        Utilisateur demandeur = demandeurId != null
                ? utilisateurRepository.findById(demandeurId).orElse(null)
                : null;

        long ordre = planRepository.countByEquipementId(equipement.getId()) + 1;
        String[] parts = equipement.getCode().split("-");
        String shortCode = parts[parts.length - 1];
        String zoneCode = equipement.getZone() != null ? equipement.getZone().getCode() : "GEN";
        String reference = "CONS-" + zoneCode + "-" + shortCode + "-" + ordre;

        boolean autoAcceptee = demandeur != null && AUTO_ACCEPT_ROLES.contains(demandeur.getRole());

        PlanConsignation plan = PlanConsignation.builder()
                .reference(reference)
                .dateCreation(LocalDateTime.now())
                .descriptionIntervention(dto.getDescriptionIntervention())
                .responsableIntervention(dto.getResponsableIntervention())
                .demandeur(demandeur)
                .statut(autoAcceptee ? StatutPlan.DEMANDE_ACCEPTE : StatutPlan.DEMANDE_EN_COURS)
                .equipement(equipement)
                .build();

        PlanConsignation saved = planRepository.save(plan);
        String nomDemandeur = demandeur != null
                ? demandeur.getPrenom() + " " + demandeur.getNom()
                : nvl(dto.getResponsableIntervention());
        historiqueService.enregistrer(saved, TypeAction.DEMANDE_CREEE,
                "Demande créée par " + nomDemandeur, demandeur);
        if (autoAcceptee) {
            String fonction = ROLE_FONCTIONS.getOrDefault(demandeur.getRole().name(), demandeur.getRole().name());
            historiqueService.enregistrer(saved, TypeAction.DEMANDE_ACCEPTEE,
                    "Demande acceptée automatiquement (" + fonction + ")", demandeur);
        }
        eventPublisher.publishEvent(PlanBackupEvent.sync(saved.getId()));
        return toDTO(saved);
    }

    public PlanConsignationDTO accepterDemande(Long planId, Long userId) {
        PlanConsignation plan = getOrThrow(planId);
        if (plan.getStatut() != StatutPlan.DEMANDE_EN_COURS) {
            throw new IllegalStateException("Seule une demande en cours peut être acceptée.");
        }
        Utilisateur user = userId != null ? utilisateurRepository.findById(userId).orElse(null) : null;
        plan.setStatut(StatutPlan.DEMANDE_ACCEPTE);
        PlanConsignation saved = planRepository.save(plan);
        historiqueService.enregistrer(saved, TypeAction.DEMANDE_ACCEPTEE,
                "Demande acceptée" + (user != null ? " par " + user.getPrenom() + " " + user.getNom() : ""), user);
        eventPublisher.publishEvent(PlanBackupEvent.sync(saved.getId()));
        return toDTO(saved);
    }

    public PlanConsignationDTO rejeterDemande(Long planId, String commentaire, Long userId) {
        PlanConsignation plan = getOrThrow(planId);
        if (plan.getStatut() != StatutPlan.DEMANDE_EN_COURS) {
            throw new IllegalStateException("Seule une demande en cours peut être rejetée.");
        }
        if (commentaire == null || commentaire.isBlank()) {
            throw new IllegalArgumentException("Un commentaire est obligatoire pour rejeter une demande.");
        }
        Utilisateur user = userId != null ? utilisateurRepository.findById(userId).orElse(null) : null;
        plan.setStatut(StatutPlan.DEMANDE_REJETE);
        PlanConsignation saved = planRepository.save(plan);
        historiqueService.enregistrer(saved, TypeAction.DEMANDE_REJETEE,
                "Demande rejetée — " + commentaire, user);
        eventPublisher.publishEvent(PlanBackupEvent.sync(saved.getId()));
        return toDTO(saved);
    }

    public PlanConsignationDTO modifierInfos(Long planId, DemandePlanDTO dto, Long userId) {
        PlanConsignation plan = getOrThrow(planId);
        if (plan.getStatut() == StatutPlan.PLAN_VALIDE || plan.getStatut() == StatutPlan.PLAN_TESTE) {
            throw new IllegalStateException("Impossible de modifier un plan validé ou testé.");
        }
        Utilisateur user = userId != null ? utilisateurRepository.findById(userId).orElse(null) : null;

        plan.setDescriptionIntervention(dto.getDescriptionIntervention());
        plan.setResponsableIntervention(dto.getResponsableIntervention());

        if (plan.getStatut() == StatutPlan.PLAN_EN_ATTENTE_VALIDATION) {
            plan.setStatut(StatutPlan.PLAN_EN_COURS);
            historiqueService.enregistrer(plan, TypeAction.PLAN_EN_COURS,
                    "Plan remis en cours suite à une modification des informations", user);
        }
        PlanConsignation saved = planRepository.save(plan);
        historiqueService.enregistrer(saved, TypeAction.ENERGIE_MODIFIEE,
                "Informations du plan modifiées", user);
        eventPublisher.publishEvent(PlanBackupEvent.sync(saved.getId()));
        return toDTO(saved);
    }

    public PlanConsignationDTO envoyerPourValidation(Long planId, Long userId) {
        PlanConsignation plan = getOrThrow(planId);
        if (plan.getStatut() != StatutPlan.PLAN_EN_COURS) {
            throw new IllegalStateException("Le plan doit être en cours pour être soumis à validation.");
        }
        long nbEnergies = energieRepository.findByPlanIdOrderByOrdreAsc(planId).size();
        if (nbEnergies == 0) {
            throw new IllegalStateException("Le plan doit contenir au moins une énergie dangereuse.");
        }
        if (approbationService.aDesParticipants(planId) && !approbationService.tousApprouves(planId)) {
            throw new IllegalStateException(
                    "Tous les participants doivent approuver l'ordre des énergies avant la soumission.");
        }
        Utilisateur user = userId != null ? utilisateurRepository.findById(userId).orElse(null) : null;
        plan.setStatut(StatutPlan.PLAN_EN_ATTENTE_VALIDATION);
        plan.setDateEnvoi(LocalDateTime.now());
        PlanConsignation saved = planRepository.save(plan);
        historiqueService.enregistrer(saved, TypeAction.SOUMIS_VALIDATION, "Plan soumis pour validation", user);
        eventPublisher.publishEvent(PlanBackupEvent.sync(saved.getId()));
        return toDTO(saved);
    }

    public PlanConsignationDTO valider(Long planId, DemandeValidationDTO dto, Long valideurId) {
        PlanConsignation plan = getOrThrow(planId);
        if (plan.getStatut() != StatutPlan.PLAN_EN_ATTENTE_VALIDATION) {
            throw new IllegalStateException("Le plan n'est pas en attente de validation.");
        }
        if (dto.getDecision() == DecisionValidation.REJETE &&
                (dto.getCommentaire() == null || dto.getCommentaire().isBlank())) {
            throw new IllegalArgumentException("Un commentaire est obligatoire en cas de rejet.");
        }

        Utilisateur valideur = utilisateurRepository.findById(valideurId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé : " + valideurId));

        String signataire = valideur.getPrenom() + " " + valideur.getNom();
        String fonction = ROLE_FONCTIONS.getOrDefault(valideur.getRole().name(), valideur.getRole().name());

        SignatureNumerique signature = SignatureNumerique.builder()
                .signataire(signataire)
                .fonction(fonction)
                .donneesSignature(dto.getDonneesSignature())
                .dateSignature(LocalDateTime.now())
                .build();

        Validation validation = Validation.builder()
                .decision(dto.getDecision())
                .dateValidation(LocalDateTime.now())
                .commentaire(dto.getCommentaire())
                .plan(plan)
                .signature(signature)
                .build();

        plan.setValidation(validation);
        boolean isValide = dto.getDecision() == DecisionValidation.VALIDE;
        // Plan rejeté retourne en cours pour correction
        plan.setStatut(isValide ? StatutPlan.PLAN_VALIDE : StatutPlan.PLAN_EN_COURS);
        plan.setDateValidation(LocalDateTime.now());

        PlanConsignation saved = planRepository.save(plan);
        String descValidation = isValide
                ? "Plan validé par " + signataire + " (" + fonction + ")"
                : "Plan rejeté par " + signataire + " (" + fonction + ")"
                  + (dto.getCommentaire() != null ? " — " + dto.getCommentaire() : "");
        historiqueService.enregistrer(saved, isValide ? TypeAction.PLAN_VALIDE : TypeAction.PLAN_REJETE,
                descValidation, valideur);
        eventPublisher.publishEvent(PlanBackupEvent.sync(saved.getId()));
        return toDTO(saved);
    }

    public PlanConsignationDTO testerPlan(Long planId, Long userId) {
        PlanConsignation plan = getOrThrow(planId);
        if (plan.getStatut() != StatutPlan.PLAN_VALIDE) {
            throw new IllegalStateException("Seul un plan validé peut être testé.");
        }
        Utilisateur user = userId != null ? utilisateurRepository.findById(userId).orElse(null) : null;
        plan.setStatut(StatutPlan.PLAN_TESTE);
        PlanConsignation saved = planRepository.save(plan);
        historiqueService.enregistrer(saved, TypeAction.PLAN_TESTE,
                "Plan testé" + (user != null ? " par " + user.getPrenom() + " " + user.getNom() : ""), user);
        eventPublisher.publishEvent(PlanBackupEvent.sync(saved.getId()));
        return toDTO(saved);
    }

    /**
     * Supprime définitivement un plan. Le PDF final est généré AVANT la suppression DB
     * (le plan n'existera plus pour le régénérer ensuite) et ses octets voyagent dans
     * l'événement de backup afin d'être archivés indépendamment de tout accès ultérieur
     * à la base. L'historique et les approbations du plan sont supprimés au préalable :
     * ce sont des FK NOT NULL vers le plan, non cascadées — leur laisser des lignes
     * orphelines empêcherait la suppression. La traçabilité de cette suppression est
     * conservée côté backup (dossier Archive/ + backup.log), pas en base.
     */
    public void supprimerPlan(Long planId, Long userId) {
        PlanConsignation plan = getOrThrow(planId);

        plan.getEquipement().getZone().getCode();
        if (plan.getEnergies() != null) {
            plan.getEnergies().forEach(e -> {
                if (e.getDispositif() != null) {
                    e.getDispositif().getDesignation();
                }
            });
        }
        if (plan.getDemandeur() != null) {
            plan.getDemandeur().getNom();
        }
        if (plan.getValidation() != null && plan.getValidation().getSignature() != null) {
            plan.getValidation().getSignature().getSignataire();
        }

        byte[] pdfSnapshot;
        try {
            pdfSnapshot = pdfService.genererPdf(plan);
        } catch (Exception e) {
            throw new RuntimeException("Erreur génération PDF avant suppression : " + e.getMessage(), e);
        }

        Long equipementId = plan.getEquipement().getId();
        String reference = plan.getReference();
        String statut = plan.getStatut().name();
        LocalDateTime deletedAt = LocalDateTime.now();

        historiqueService.deleteByPlan(planId);
        approbationService.supprimerParPlan(planId);
        planRepository.delete(plan);

        eventPublisher.publishEvent(
                PlanBackupEvent.delete(planId, reference, equipementId, statut, pdfSnapshot, deletedAt));
    }

    // Appelé par EnergieDangereuseService : passage automatique DEMANDE_ACCEPTE → PLAN_EN_COURS
    public void passerEnPlanEnCoursSiNecessaire(PlanConsignation plan, Utilisateur user) {
        if (plan.getStatut() == StatutPlan.DEMANDE_ACCEPTE) {
            plan.setStatut(StatutPlan.PLAN_EN_COURS);
            planRepository.save(plan);
            historiqueService.enregistrer(plan, TypeAction.PLAN_EN_COURS,
                    "Plan passé en cours suite à l'ajout de la première énergie dangereuse", user);
        }
    }

    private String nvl(String s) {
        return (s != null && !s.isBlank()) ? s : "—";
    }

    private PlanConsignation getOrThrow(Long planId) {
        return planRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Plan non trouvé : " + planId));
    }

    public PlanConsignationDTO toDTO(PlanConsignation p) {
        Utilisateur dem = p.getDemandeur();
        return PlanConsignationDTO.builder()
                .id(p.getId())
                .reference(p.getReference())
                .dateCreation(p.getDateCreation())
                .dateEnvoi(p.getDateEnvoi())
                .dateValidation(p.getDateValidation())
                .descriptionIntervention(p.getDescriptionIntervention())
                .responsableIntervention(p.getResponsableIntervention())
                .demandeurId(dem != null ? dem.getId() : null)
                .demandeurNom(dem != null ? dem.getPrenom() + " " + dem.getNom() : null)
                .demandeurMatricule(dem != null ? dem.getMatricule() : null)
                .statut(p.getStatut())
                .equipementId(p.getEquipement().getId())
                .equipementCode(p.getEquipement().getCode())
                .equipementDescription(p.getEquipement().getDescription())
                .build();
    }

    public PlanConsignationDTO toDTODetail(PlanConsignation p) {
        PlanConsignationDTO dto = toDTO(p);
        if (p.getEnergies() != null) {
            dto.setEnergies(p.getEnergies().stream()
                    .map(this::toEnergieDTO)
                    .collect(Collectors.toList()));
        }
        if (p.getValidation() != null) {
            dto.setValidation(toValidationDTO(p.getValidation()));
        }
        return dto;
    }

    private EnergieDangereuseDTO toEnergieDTO(EnergieDangereuse e) {
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
                .build();
    }

    private ValidationDTO toValidationDTO(Validation v) {
        SignatureNumeriqueDTO sigDto = null;
        if (v.getSignature() != null) {
            sigDto = SignatureNumeriqueDTO.builder()
                    .id(v.getSignature().getId())
                    .signataire(v.getSignature().getSignataire())
                    .fonction(v.getSignature().getFonction())
                    .donneesSignature(v.getSignature().getDonneesSignature())
                    .dateSignature(v.getSignature().getDateSignature())
                    .build();
        }
        return ValidationDTO.builder()
                .id(v.getId())
                .decision(v.getDecision())
                .dateValidation(v.getDateValidation())
                .commentaire(v.getCommentaire())
                .planId(v.getPlan().getId())
                .signature(sigDto)
                .build();
    }
}
