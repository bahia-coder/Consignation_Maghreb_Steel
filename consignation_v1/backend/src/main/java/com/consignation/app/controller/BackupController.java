package com.consignation.app.controller;

import com.consignation.app.backup.BackupAdminService;
import com.consignation.app.dto.BackupStatusDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/backup")
@RequiredArgsConstructor
public class BackupController {

    private final BackupAdminService backupAdminService;

    @GetMapping("/status")
    public ResponseEntity<BackupStatusDTO> getStatus() {
        return ResponseEntity.ok(backupAdminService.getStatus());
    }

    /** Déclenche un backup complet ("Sauvegarder maintenant"). Async : répond immédiatement. */
    @PostMapping("/run")
    public ResponseEntity<Void> runNow() {
        backupAdminService.runFullBackupAsync();
        return ResponseEntity.status(HttpStatus.ACCEPTED).build();
    }

    /** Retente les opérations de backup restées PENDING/FAILED. Async : répond immédiatement. */
    @PostMapping("/retry")
    public ResponseEntity<Void> retry() {
        backupAdminService.retryFailedAsync();
        return ResponseEntity.status(HttpStatus.ACCEPTED).build();
    }
}
