package com.consignation.app.repository;

import com.consignation.app.model.BackupOperation;
import com.consignation.app.model.BackupOperationType;
import com.consignation.app.model.BackupStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BackupOperationRepository extends JpaRepository<BackupOperation, Long> {

    Optional<BackupOperation> findFirstByPlanIdAndTypeAndStatusOrderByCreatedAtDesc(
            Long planId, BackupOperationType type, BackupStatus status);

    List<BackupOperation> findByStatusIn(List<BackupStatus> statuses);

    List<BackupOperation> findTop50ByOrderByCreatedAtDesc();

    long countByStatus(BackupStatus status);
}
