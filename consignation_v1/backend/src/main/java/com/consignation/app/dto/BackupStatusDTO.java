package com.consignation.app.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BackupStatusDTO {
    private String rootPath;
    private LocalDateTime lastBackupDate;
    private String lastBackupStatus;
    private long totalPlansSauvegardes;
    private long totalEchecs;
    private List<BackupOperationDTO> dernieresOperations;
}
