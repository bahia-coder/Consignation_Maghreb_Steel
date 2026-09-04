package com.consignation.app.backup;

import com.consignation.app.model.BackupOperation;
import com.consignation.app.model.BackupOperationType;
import com.consignation.app.model.BackupStatus;
import com.consignation.app.repository.BackupOperationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import java.time.LocalDateTime;

/**
 * Écoute asynchrone, exécutée UNIQUEMENT après le commit de la transaction
 * (jamais avant, jamais si la transaction échoue) et hors du thread de la
 * requête HTTP : le backup ne bloque jamais l'utilisateur et ne s'exécute
 * jamais pour une opération DB qui a échoué.
 */
@Component
@RequiredArgsConstructor
public class BackupExecutionListener {

    private final BackupService backupService;
    private final BackupOperationRepository backupOperationRepository;

    @Async("backupExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onPlanBackupEvent(PlanBackupEvent event) {
        BackupOperation op = backupOperationRepository
                .findFirstByPlanIdAndTypeAndStatusOrderByCreatedAtDesc(event.getPlanId(), event.getType(), BackupStatus.PENDING)
                .orElse(null);
        if (op == null) {
            return; // La ligne PENDING est créée de façon synchrone avant le commit ; ne devrait pas manquer.
        }
        executeOperation(op);
    }

    /** Exécute (ou réexécute) une opération de backup et met à jour son statut. Réutilisé par le sweep de retry. */
    public void executeOperation(BackupOperation op) {
        try {
            if (op.getType() == BackupOperationType.PLAN_DELETE) {
                backupService.archivePlan(op);
            } else {
                backupService.backupPlanImmediate(op.getPlanId());
            }
            op.setStatus(BackupStatus.SUCCESS);
            op.setMessage(null);
        } catch (Exception e) {
            op.setStatus(BackupStatus.FAILED);
            String msg = e.getMessage();
            op.setMessage(msg != null && msg.length() > 2000 ? msg.substring(0, 2000) : msg);
        }
        op.setUpdatedAt(LocalDateTime.now());
        backupOperationRepository.save(op);
    }
}
