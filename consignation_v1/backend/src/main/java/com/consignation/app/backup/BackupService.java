package com.consignation.app.backup;

import com.consignation.app.model.*;
import com.consignation.app.repository.EquipementRepository;
import com.consignation.app.repository.PlanConsignationRepository;
import com.consignation.app.repository.ZoneRepository;
import com.consignation.app.service.PdfGenerationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

/**
 * Orchestrateur central du backup local des plans de consignation. Un seul
 * algorithme d'écriture idempotente (basé sur le hash SHA-256 du PDF régénéré)
 * sert à la fois le backup immédiat événementiel et le backup complet/manuel.
 */
@Service
@RequiredArgsConstructor
public class BackupService {

    private static final DateTimeFormatter DAY_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter TIMESTAMP_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd_HHmmss");

    private final ZoneRepository zoneRepository;
    private final EquipementRepository equipementRepository;
    private final PlanConsignationRepository planRepository;
    private final PdfGenerationService pdfService;
    private final BackupProperties properties;
    private final BackupManifestService manifestService;
    private final EquipementPathResolver pathResolver;
    private final StatutFolderMapper statutMapper;
    private final PathSanitizer sanitizer;

    /**
     * Backup complet/réconciliation : parcourt zones -> équipements racines -> récursion sur
     * sousEquipements (aucune profondeur codée en dur), crée les dossiers manquants et
     * resynchronise chaque plan. Sert au backup initial, au bouton "Sauvegarder maintenant"
     * et à la réconciliation périodique légère.
     */
    @Transactional(readOnly = true)
    public BackupRunSummary reconcile() {
        int equipements = 0;
        int plans = 0;
        int erreurs = 0;
        try {
            Files.createDirectories(properties.getRootPath());
            List<Zone> zones = zoneRepository.findAll();
            for (Zone zone : zones) {
                Path zoneDir = sanitizer.resolveSafe(properties.getRootPath(), "Zone_" + sanitizer.sanitize(zone.getCode()));
                Files.createDirectories(zoneDir);
                List<Equipement> racines = equipementRepository.findRootEquipementsByZone(zone.getId());
                for (Equipement racine : racines) {
                    int[] r = reconcileEquipement(racine);
                    equipements += r[0];
                    plans += r[1];
                    erreurs += r[2];
                }
            }
            manifestService.markFullBackup(erreurs == 0 ? "OK" : "PARTIEL");
            manifestService.log("Backup complet terminé : " + equipements + " équipement(s), "
                    + plans + " plan(s), " + erreurs + " erreur(s)");
        } catch (IOException e) {
            manifestService.markFullBackup("ERROR");
            manifestService.log("ECHEC backup complet : " + e.getMessage());
            throw new BackupException("Échec du backup complet", e);
        }
        return new BackupRunSummary(equipements, plans, erreurs);
    }

    /** @return {equipements, plans, erreurs} */
    private int[] reconcileEquipement(Equipement equipement) {
        int equipements = 1;
        int plans = 0;
        int erreurs = 0;
        try {
            Path equipementDir = pathResolver.equipementDir(properties.getRootPath(), equipement);
            Files.createDirectories(equipementDir.resolve("Plans"));

            List<PlanConsignation> planList = planRepository.findByEquipementId(equipement.getId());
            for (PlanConsignation plan : planList) {
                try {
                    forceLazyLoad(plan);
                    writePlanPdf(plan);
                    plans++;
                } catch (Exception e) {
                    erreurs++;
                    manifestService.log("ECHEC réconciliation plan " + plan.getReference() + " : " + e.getMessage());
                }
            }
        } catch (IOException e) {
            erreurs++;
            manifestService.log("ECHEC réconciliation équipement " + equipement.getCode() + " : " + e.getMessage());
        }

        List<Equipement> enfants = equipement.getSousEquipements();
        if (enfants != null) {
            for (Equipement enfant : enfants) {
                int[] r = reconcileEquipement(enfant);
                equipements += r[0];
                plans += r[1];
                erreurs += r[2];
            }
        }
        return new int[]{equipements, plans, erreurs};
    }

    /** Backup immédiat d'un seul plan (chemin événementiel : création/modification/changement de statut). */
    @Transactional(readOnly = true)
    public void backupPlanImmediate(Long planId) {
        PlanConsignation plan = planRepository.findById(planId)
                .orElseThrow(() -> new BackupException("Plan introuvable pour backup : " + planId));
        forceLazyLoad(plan);
        writePlanPdf(plan);
    }

    /** Force le chargement des relations lazy nécessaires à la génération du PDF et à la résolution du chemin. */
    private void forceLazyLoad(PlanConsignation plan) {
        Equipement eq = plan.getEquipement();
        eq.getZone().getCode();
        Equipement parent = eq.getParent();
        while (parent != null) {
            parent.getCode();
            parent = parent.getParent();
        }
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
    }

    private void writePlanPdf(PlanConsignation plan) {
        try {
            byte[] pdfBytes = pdfService.genererPdf(plan);
            String newHash = PdfHashUtil.sha256(pdfBytes);

            Path equipementDir = pathResolver.equipementDir(properties.getRootPath(), plan.getEquipement());
            String statutFolder = statutMapper.folderFor(plan.getStatut());
            Path targetDir = sanitizer.resolveSafe(equipementDir, "Plans", statutFolder);
            Path targetFile = targetDir.resolve(sanitizer.sanitize(plan.getReference()) + ".pdf");

            Optional<PlanManifestEntry> existing = manifestService.getPlanEntry(plan.getId());
            if (existing.isPresent()) {
                Path oldPath = Path.of(existing.get().getAbsolutePath());
                boolean samePath = oldPath.equals(targetFile);
                boolean sameHash = newHash.equals(existing.get().getSha256());

                if (samePath && sameHash) {
                    return; // rien n'a changé : pas de réécriture inutile (dédoublonnage)
                }
                if (Files.exists(oldPath)) {
                    if (!sameHash) {
                        archiveToHistorique(plan, oldPath);
                    }
                    if (!samePath) {
                        Files.deleteIfExists(oldPath);
                    }
                }
            }

            Files.createDirectories(targetDir);
            Files.write(targetFile, pdfBytes);

            PlanManifestEntry entry = PlanManifestEntry.builder()
                    .planId(plan.getId())
                    .reference(plan.getReference())
                    .equipementCode(plan.getEquipement().getCode())
                    .statut(plan.getStatut().name())
                    .absolutePath(targetFile.toString())
                    .sha256(newHash)
                    .savedAt(LocalDateTime.now())
                    .build();
            manifestService.updatePlanEntry(plan.getId(), entry);
            manifestService.log("Plan " + plan.getReference() + " sauvegardé -> " + targetFile);
        } catch (Exception e) {
            manifestService.log("ECHEC backup plan " + plan.getReference() + " : " + e.getMessage());
            throw new BackupException("Échec du backup du plan " + plan.getId(), e);
        }
    }

    private void archiveToHistorique(PlanConsignation plan, Path oldPath) throws IOException {
        Path equipementDir = pathResolver.equipementDir(properties.getRootPath(), plan.getEquipement());
        Path historiqueDir = sanitizer.resolveSafe(equipementDir, "Historique", plan.getReference());
        Files.createDirectories(historiqueDir);
        String ts = LocalDateTime.now().format(TIMESTAMP_FORMAT);
        Path histFile = historiqueDir.resolve(sanitizer.sanitize(plan.getReference()) + "_" + ts + ".pdf");
        Files.copy(oldPath, histFile, StandardCopyOption.REPLACE_EXISTING);
    }

    /**
     * Archive le PDF d'un plan supprimé. Fonctionne uniquement à partir des données
     * portées par l'opération (octets PDF déjà générés avant la suppression DB) :
     * ne dépend jamais d'une relecture du plan, qui n'existe plus en base.
     */
    @Transactional(readOnly = true)
    public void archivePlan(BackupOperation op) {
        try {
            Equipement equipement = equipementRepository.findById(op.getEquipementId())
                    .orElseThrow(() -> new BackupException("Équipement introuvable pour archivage : " + op.getEquipementId()));
            Path equipementDir = pathResolver.equipementDir(properties.getRootPath(), equipement);
            Path archiveDir = sanitizer.resolveSafe(equipementDir, "Archive");
            Files.createDirectories(archiveDir);

            LocalDateTime deletedAt = op.getDeletedAt() != null ? op.getDeletedAt() : LocalDateTime.now();
            String dateStr = deletedAt.format(DAY_FORMAT);
            Path archiveFile = archiveDir.resolve(sanitizer.sanitize(op.getPlanReference()) + "_" + dateStr + ".pdf");
            Files.write(archiveFile, op.getPdfSnapshot());

            manifestService.removePlanEntry(op.getPlanId());
            manifestService.log("Plan " + op.getPlanReference() + " supprimé -> archivé " + archiveFile);

            // Retire l'éventuelle copie active restée dans Plans/{statut}/
            if (op.getStatutSnapshot() != null) {
                Path oldFile = sanitizer.resolveSafe(equipementDir, "Plans", sanitizer.sanitize(op.getStatutSnapshot()))
                        .resolve(sanitizer.sanitize(op.getPlanReference()) + ".pdf");
                Files.deleteIfExists(oldFile);
            }
        } catch (IOException e) {
            manifestService.log("ECHEC archivage plan " + op.getPlanReference() + " : " + e.getMessage());
            throw new BackupException("Échec de l'archivage du plan " + op.getPlanId(), e);
        }
    }
}
