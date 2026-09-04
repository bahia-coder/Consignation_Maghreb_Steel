package com.consignation.app.backup;

import com.consignation.app.model.BackupOperation;
import com.consignation.app.model.BackupStatus;
import com.consignation.app.repository.BackupOperationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;

/**
 * Écoute synchrone, exécutée DANS la transaction appelante (avant commit) :
 * enregistre une ligne PENDING durable pour chaque événement de backup, afin
 * qu'aucune opération ne soit perdue même si l'application s'arrête juste
 * après le commit et avant que le traitement asynchrone n'ait eu lieu.
 */
@Component
@RequiredArgsConstructor
public class BackupQueueListener {

    private final BackupOperationRepository backupOperationRepository;

    @EventListener
    public void onPlanBackupEvent(PlanBackupEvent event) {
        LocalDateTime now = LocalDateTime.now();
        BackupOperation op = BackupOperation.builder()
                .planId(event.getPlanId())
                .planReference(event.getPlanReference())
                .equipementId(event.getEquipementId())
                .statutSnapshot(event.getStatutSnapshot())
                .pdfSnapshot(event.getPdfSnapshot())
                .deletedAt(event.getDeletedAt())
                .type(event.getType())
                .status(BackupStatus.PENDING)
                .createdAt(now)
                .updatedAt(now)
                .build();
        backupOperationRepository.save(op);
    }
}
