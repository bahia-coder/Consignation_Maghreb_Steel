package com.consignation.app.backup;

import com.consignation.app.model.BackupOperationType;
import lombok.Getter;
import java.time.LocalDateTime;

/**
 * Événement publié après le commit DB d'une mutation de plan. Pour PLAN_DELETE,
 * porte un instantané complet (référence, équipement, statut, octets PDF déjà
 * générés) car le plan n'existe plus en base au moment où le backup s'exécute.
 */
@Getter
public class PlanBackupEvent {

    private final Long planId;
    private final BackupOperationType type;
    private final String planReference;
    private final Long equipementId;
    private final String statutSnapshot;
    private final byte[] pdfSnapshot;
    private final LocalDateTime deletedAt;

    private PlanBackupEvent(Long planId, BackupOperationType type, String planReference,
                             Long equipementId, String statutSnapshot, byte[] pdfSnapshot,
                             LocalDateTime deletedAt) {
        this.planId = planId;
        this.type = type;
        this.planReference = planReference;
        this.equipementId = equipementId;
        this.statutSnapshot = statutSnapshot;
        this.pdfSnapshot = pdfSnapshot;
        this.deletedAt = deletedAt;
    }

    public static PlanBackupEvent sync(Long planId) {
        return new PlanBackupEvent(planId, BackupOperationType.PLAN_SYNC, null, null, null, null, null);
    }

    public static PlanBackupEvent delete(Long planId, String reference, Long equipementId,
                                          String statut, byte[] pdfBytes, LocalDateTime deletedAt) {
        return new PlanBackupEvent(planId, BackupOperationType.PLAN_DELETE, reference, equipementId,
                statut, pdfBytes, deletedAt);
    }
}
