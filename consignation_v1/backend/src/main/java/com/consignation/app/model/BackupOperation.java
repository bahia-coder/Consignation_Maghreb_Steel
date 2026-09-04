package com.consignation.app.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * File d'attente persistante des opérations de backup (PENDING/SUCCESS/FAILED).
 * planId n'est pas une FK : le plan référencé peut avoir été supprimé de plans_consignation.
 * Les champs equipementId/statutSnapshot/pdfSnapshot/deletedAt ne sont renseignés
 * que pour le type PLAN_DELETE, afin que l'archivage puisse être rejoué après un
 * redémarrage de l'application sans dépendre d'une relecture en base du plan supprimé.
 */
@Entity
@Table(name = "backup_operations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BackupOperation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long planId;

    private String planReference;

    private Long equipementId;

    private String statutSnapshot;

    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] pdfSnapshot;

    private LocalDateTime deletedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BackupOperationType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private BackupStatus status;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
