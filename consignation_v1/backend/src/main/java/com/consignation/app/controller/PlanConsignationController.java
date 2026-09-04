package com.consignation.app.controller;

import com.consignation.app.dto.*;
import com.consignation.app.model.PlanConsignation;
import com.consignation.app.repository.PlanConsignationRepository;
import com.consignation.app.service.PdfGenerationService;
import com.consignation.app.service.PlanConsignationService;
import io.jsonwebtoken.Claims;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/plans")
@RequiredArgsConstructor
public class PlanConsignationController {

    private final PlanConsignationService planService;
    private final PdfGenerationService pdfService;
    private final PlanConsignationRepository planRepository;

    @GetMapping("/equipement/{equipementId}")
    public ResponseEntity<List<PlanConsignationDTO>> findByEquipement(@PathVariable Long equipementId) {
        return ResponseEntity.ok(planService.findByEquipement(equipementId));
    }

    @GetMapping("/zone/{zoneId}")
    public ResponseEntity<List<PlanConsignationDTO>> findByZone(@PathVariable Long zoneId, Authentication auth) {
        String role = getRole(auth);
        Long userZoneId = getZoneId(auth);
        // Chargé des Travaux et Manager ne peuvent accéder qu'à leur propre zone
        if (!"ADMIN".equals(role) && userZoneId != null && !userZoneId.equals(zoneId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(planService.findByZone(zoneId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlanConsignationDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(planService.findById(id));
    }

    @PostMapping("/demande")
    public ResponseEntity<PlanConsignationDTO> creerDemande(
            @Valid @RequestBody DemandePlanDTO dto,
            Authentication auth) {
        String role = getRole(auth);
        Long userZoneId = getZoneId(auth);
        Long demandeurId = getUserId(auth);
        // Les non-admin ne peuvent créer que pour des équipements de leur zone
        if (!"ADMIN".equals(role) && userZoneId != null) {
            planService.verifierZoneEquipement(dto.getEquipementId(), userZoneId);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(planService.creerDemande(dto, demandeurId));
    }

    @PutMapping("/{id}/infos")
    public ResponseEntity<PlanConsignationDTO> modifierInfos(
            @PathVariable Long id,
            @Valid @RequestBody DemandePlanDTO dto,
            Authentication auth) {
        return ResponseEntity.ok(planService.modifierInfos(id, dto, getUserId(auth)));
    }

    @PatchMapping("/{id}/accepter-demande")
    public ResponseEntity<PlanConsignationDTO> accepterDemande(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(planService.accepterDemande(id, getUserId(auth)));
    }

    @PatchMapping("/{id}/rejeter-demande")
    public ResponseEntity<PlanConsignationDTO> rejeterDemande(
            @PathVariable Long id,
            @RequestParam String commentaire,
            Authentication auth) {
        return ResponseEntity.ok(planService.rejeterDemande(id, commentaire, getUserId(auth)));
    }

    @PatchMapping("/{id}/tester")
    public ResponseEntity<PlanConsignationDTO> testerPlan(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(planService.testerPlan(id, getUserId(auth)));
    }

    @PatchMapping("/{id}/soumettre-validation")
    public ResponseEntity<PlanConsignationDTO> envoyerPourValidation(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(planService.envoyerPourValidation(id, getUserId(auth)));
    }

    @PostMapping("/{id}/valider")
    public ResponseEntity<PlanConsignationDTO> valider(
            @PathVariable Long id,
            @Valid @RequestBody DemandeValidationDTO dto,
            Authentication auth) {
        Long valideurId = getUserId(auth);
        return ResponseEntity.ok(planService.valider(id, dto, valideurId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerPlan(@PathVariable Long id, Authentication auth) {
        planService.supprimerPlan(id, getUserId(auth));
        return ResponseEntity.noContent().build();
    }

    @GetMapping(value = "/{id}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> telechargerPdf(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean avecDate) {
        PlanConsignation plan = planRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plan non trouvé : " + id));

        plan.getEquipement().getZone().getCode();
        if (plan.getEnergies() != null) plan.getEnergies().forEach(e -> {
            if (e.getDispositif() != null) e.getDispositif().getDesignation();
        });
        if (plan.getDemandeur() != null) plan.getDemandeur().getNom();
        if (plan.getValidation() != null && plan.getValidation().getSignature() != null) {
            plan.getValidation().getSignature().getSignataire();
        }

        try {
            byte[] pdf = avecDate ? pdfService.genererPdfAvecDate(plan) : pdfService.genererPdf(plan);
            String filename = "plan-consignation-" + plan.getReference() + ".pdf";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", filename);
            headers.setContentLength(pdf.length);

            return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
        } catch (Exception e) {
            throw new RuntimeException("Erreur génération PDF : " + e.getMessage(), e);
        }
    }

    private Long getUserId(Authentication auth) {
        if (auth != null && auth.getDetails() instanceof Claims claims) {
            return claims.get("userId", Long.class);
        }
        return null;
    }

    private String getRole(Authentication auth) {
        if (auth != null && auth.getDetails() instanceof Claims claims) {
            return claims.get("role", String.class);
        }
        return null;
    }

    private Long getZoneId(Authentication auth) {
        if (auth != null && auth.getDetails() instanceof Claims claims) {
            return claims.get("zoneId", Long.class);
        }
        return null;
    }
}
