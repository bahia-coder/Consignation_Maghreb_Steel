package com.consignation.app.backup;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Lit/écrit Backup_Metadata/backup_manifest.json et backup.log. Un seul writer
 * logique à la fois (verrou interne) car plusieurs opérations de backup peuvent
 * s'exécuter en parallèle sur le pool async dédié.
 */
@Service
@RequiredArgsConstructor
public class BackupManifestService {

    private final ObjectMapper objectMapper;
    private final BackupProperties properties;
    private final Object lock = new Object();
    private BackupManifest cached;

    private Path metadataDir() {
        return properties.getRootPath().resolve("Backup_Metadata");
    }

    private Path manifestPath() {
        return metadataDir().resolve("backup_manifest.json");
    }

    private Path logPath() {
        return metadataDir().resolve("backup.log");
    }

    private BackupManifest load() {
        if (cached != null) {
            return cached;
        }
        Path path = manifestPath();
        if (Files.exists(path)) {
            try {
                cached = objectMapper.readValue(path.toFile(), BackupManifest.class);
                return cached;
            } catch (IOException e) {
                // Manifeste corrompu/illisible : on repart d'un manifeste vierge plutôt que de bloquer le backup.
            }
        }
        cached = new BackupManifest();
        return cached;
    }

    public Optional<PlanManifestEntry> getPlanEntry(Long planId) {
        synchronized (lock) {
            return Optional.ofNullable(load().getPlans().get(String.valueOf(planId)));
        }
    }

    public void updatePlanEntry(Long planId, PlanManifestEntry entry) {
        synchronized (lock) {
            BackupManifest manifest = load();
            manifest.getPlans().put(String.valueOf(planId), entry);
            persist(manifest);
        }
    }

    public void removePlanEntry(Long planId) {
        synchronized (lock) {
            BackupManifest manifest = load();
            manifest.getPlans().remove(String.valueOf(planId));
            persist(manifest);
        }
    }

    public void markFullBackup(String status) {
        synchronized (lock) {
            BackupManifest manifest = load();
            manifest.setLastBackupDate(LocalDateTime.now());
            manifest.setLastBackupStatus(status);
            persist(manifest);
        }
    }

    public BackupManifest snapshot() {
        synchronized (lock) {
            return load();
        }
    }

    private void persist(BackupManifest manifest) {
        try {
            Path path = manifestPath();
            Files.createDirectories(path.getParent());
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(path.toFile(), manifest);
        } catch (IOException e) {
            throw new BackupException("Impossible d'écrire le manifest de backup", e);
        }
    }

    public void log(String line) {
        synchronized (lock) {
            try {
                Path path = logPath();
                Files.createDirectories(path.getParent());
                String entry = "[" + LocalDateTime.now() + "] " + line + System.lineSeparator();
                Files.writeString(path, entry, StandardOpenOption.CREATE, StandardOpenOption.APPEND);
            } catch (IOException ignored) {
                // Le log est un confort de diagnostic ; ne doit jamais faire échouer le backup lui-même.
            }
        }
    }
}
