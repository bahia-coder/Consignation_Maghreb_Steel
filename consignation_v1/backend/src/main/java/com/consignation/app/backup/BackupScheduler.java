package com.consignation.app.backup;

import com.consignation.app.model.BackupOperation;
import com.consignation.app.model.BackupStatus;
import com.consignation.app.repository.BackupOperationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.util.List;

/**
 * Filet de sécurité léger — PAS le mécanisme principal (celui-ci reste événementiel,
 * voir BackupQueueListener/BackupExecutionListener). Toutes les ~15 min par défaut :
 * 1) retente les opérations restées PENDING/FAILED (crash avant exécution async, panne disque...) ;
 * 2) relance reconcile(), qui grâce au hash SHA-256 ne réécrit que ce qui a réellement changé —
 *    sert notamment à détecter les zones/équipements ajoutés directement en base (pas d'endpoint
 *    de création côté API aujourd'hui, donc pas d'événement à écouter pour ce cas précis).
 */
@Component
@RequiredArgsConstructor
public class BackupScheduler {

    private final BackupService backupService;
    private final BackupExecutionListener executionListener;
    private final BackupOperationRepository backupOperationRepository;
    private final BackupProperties properties;

    @Scheduled(
            fixedDelayString = "${backup.reconciliation.interval-ms:900000}",
            initialDelayString = "${backup.reconciliation.interval-ms:900000}")
    public void run() {
        if (!properties.isReconciliationEnabled()) {
            return;
        }
        retryPending();
        backupService.reconcile();
    }

    private void retryPending() {
        List<BackupOperation> stuck = backupOperationRepository.findByStatusIn(List.of(BackupStatus.FAILED, BackupStatus.PENDING));
        for (BackupOperation op : stuck) {
            executionListener.executeOperation(op);
        }
    }
}
