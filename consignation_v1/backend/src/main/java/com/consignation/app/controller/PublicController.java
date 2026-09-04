package com.consignation.app.controller;

import com.consignation.app.dto.EquipementDTO;
import com.consignation.app.dto.PlanConsignationDTO;
import com.consignation.app.model.PlanConsignation;
import com.consignation.app.model.StatutPlan;
import com.consignation.app.repository.PlanConsignationRepository;
import com.consignation.app.service.EquipementService;
import com.consignation.app.service.PdfGenerationService;
import com.consignation.app.service.PlanConsignationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Endpoints PUBLICS — accessibles sans token JWT
 * Utilisés par la page QR Code (scan sans connexion)
 */
@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class PublicController {

    private final EquipementService       equipementService;
    private final PlanConsignationService planService;
    private final PdfGenerationService    pdfService;
    private final PlanConsignationRepository planRepository;

    /** Infos d'un équipement */
    @GetMapping("/equipement/{id}")
    public ResponseEntity<EquipementDTO> getEquipement(@PathVariable Long id) {
        return ResponseEntity.ok(equipementService.findById(id));
    }

    /** Plans VALIDÉS d'un équipement (lecture seule, sans auth) */
    @GetMapping("/equipement/{id}/plans-valides")
    public ResponseEntity<List<PlanConsignationDTO>> getPlansValides(@PathVariable Long id) {
        List<PlanConsignationDTO> plans = planService.findByEquipement(id)
                .stream()
                .filter(p -> StatutPlan.PLAN_VALIDE.equals(p.getStatut()) || StatutPlan.PLAN_TESTE.equals(p.getStatut()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(plans);
    }

    /** Télécharger le PDF d'un plan validé (sans auth) */
    @GetMapping(value = "/plan/{id}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> downloadPdf(@PathVariable Long id) {
        PlanConsignation plan = planRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plan non trouvé : " + id));

        // Sécurité : seulement les plans validés sont accessibles publiquement
        if (plan.getStatut() != StatutPlan.PLAN_VALIDE && plan.getStatut() != StatutPlan.PLAN_TESTE) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        // Initialiser les associations lazy
        plan.getEquipement().getZone().getCode();
        if (plan.getEnergies() != null) plan.getEnergies().forEach(e -> {
            if (e.getDispositif() != null) e.getDispositif().getDesignation();
        });
        if (plan.getDemandeur() != null) plan.getDemandeur().getNom();
        if (plan.getValidation() != null && plan.getValidation().getSignature() != null) {
            plan.getValidation().getSignature().getSignataire();
        }

        try {
            byte[] pdf = pdfService.genererPdf(plan);
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
}
