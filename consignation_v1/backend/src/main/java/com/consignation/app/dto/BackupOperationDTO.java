package com.consignation.app.dto;

import com.consignation.app.model.BackupOperationType;
import com.consignation.app.model.BackupStatus;
import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BackupOperationDTO {
    private Long id;
    private BackupOperationType type;
    private BackupStatus status;
    private String planReference;
    private String message;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
