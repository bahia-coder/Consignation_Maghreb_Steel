package com.consignation.app.backup;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Contenu de Backup_Metadata/backup_manifest.json — reste lisible/interprétable
 * indépendamment de la base de données (§20).
 */
@Getter @Setter
public class BackupManifest {
    private LocalDateTime lastBackupDate;
    private String lastBackupStatus = "JAMAIS_EXECUTE";
    /** Clé = planId (String, contrainte JSON), valeur = dernier emplacement connu sur disque. */
    private Map<String, PlanManifestEntry> plans = new LinkedHashMap<>();
}
