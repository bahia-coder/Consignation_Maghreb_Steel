package com.consignation.app.backup;

import com.consignation.app.dto.BackupOperationDTO;
import com.consignation.app.dto.BackupStatusDTO;
import com.consignation.app.model.BackupOperation;
import com.consignation.app.model.BackupStatus;
import com.consignation.app.repository.BackupOperationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

/** Support du dashboard admin : statut du backup, déclenchement manuel, retry manuel. */
@Service
@RequiredArgsConstructor
public class BackupAdminService {

    private final BackupService backupService;
    private final BackupExecutionListener executionListener;
    private final BackupOperationRepository backupOperationRepository;
    private final BackupManifestService manifestService;
    private final BackupProperties properties;

    /** Backup complet manuel ("Sauvegarder maintenant"). Async : ne bloque pas la requête HTTP. */
    @Async("backupExecutor")
    public void runFullBackupAsync() {
        backupService.reconcile();
    }

    /** Retente manuellement toutes les opérations PENDING/FAILED. */
    @Async("backupExecutor")
    public void retryFailedAsync() {
        List<BackupOperation> stuck = backupOperationRepository.findByStatusIn(List.of(BackupStatus.FAILED, BackupStatus.PENDING));
        stuck.forEach(executionListener::executeOperation);
    }

    @Transactional(readOnly = true)
    public BackupStatusDTO getStatus() {
        BackupManifest manifest = manifestService.snapshot();
        List<BackupOperationDTO> recentes = backupOperationRepository.findTop50ByOrderByCreatedAtDesc()
                .stream()
                .limit(20)
                .map(this::toDTO)
                .collect(Collectors.toList());
        long echecs = backupOperationRepository.countByStatus(BackupStatus.FAILED);

        return BackupStatusDTO.builder()
                .rootPath(properties.getRootPath().toString())
                .lastBackupDate(manifest.getLastBackupDate())
                .lastBackupStatus(manifest.getLastBackupStatus())
                .totalPlansSauvegardes(manifest.getPlans().size())
                .totalEchecs(echecs)
                .dernieresOperations(recentes)
                .build();
    }

    private BackupOperationDTO toDTO(BackupOperation op) {
        return BackupOperationDTO.builder()
                .id(op.getId())
                .type(op.getType())
                .status(op.getStatus())
                .planReference(op.getPlanReference())
                .message(op.getMessage())
                .createdAt(op.getCreatedAt())
                .updatedAt(op.getUpdatedAt())
                .build();
    }
}
