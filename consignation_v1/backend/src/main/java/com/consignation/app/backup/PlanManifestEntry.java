package com.consignation.app.backup;

import lombok.*;
import java.time.LocalDateTime;

/** Entrée du manifeste : dernier emplacement connu sur disque d'un plan donné. */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PlanManifestEntry {
    private Long planId;
    private String reference;
    private String equipementCode;
    private String statut;
    private String absolutePath;
    private String sha256;
    private LocalDateTime savedAt;
}
