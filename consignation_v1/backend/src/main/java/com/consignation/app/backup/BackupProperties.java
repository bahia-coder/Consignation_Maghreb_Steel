package com.consignation.app.backup;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Centralise la configuration du backup local des plans (chemin racine, réconciliation).
 * Aucun chemin n'est codé en dur ailleurs dans le code : tout passe par ce bean,
 * lui-même alimenté par application.properties (clé backup.plans.path).
 */
@Component
@ConfigurationProperties(prefix = "backup")
@Getter @Setter
public class BackupProperties {

    /** Valeur par défaut alignée sur application.properties (backup.plans.path). */
    private String plansPath = "C:/Users/pc/Downloads/Nouveau dossier/Plans_Consignation";

    private boolean reconciliationEnabled = true;

    private long reconciliationIntervalMs = 900_000L;

    public Path getRootPath() {
        return Paths.get(plansPath);
    }
}
