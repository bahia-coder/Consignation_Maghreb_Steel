package com.consignation.app.backup;

import org.springframework.stereotype.Component;
import java.nio.file.Path;
import java.util.regex.Pattern;

/**
 * Nettoie les noms de zones/équipements/statuts/fichiers pour qu'ils soient
 * sûrs sur Windows, et confine toute résolution de chemin sous une racine donnée
 * (anti path-traversal). Le frontend ne fournit jamais de chemin : toute la
 * construction de chemin passe par ici côté backend.
 */
@Component
public class PathSanitizer {

    private static final Pattern ILLEGAL_CHARS = Pattern.compile("[\\\\/:*?\"<>|]");
    private static final Pattern MULTI_SPACE = Pattern.compile("\\s+");
    private static final Pattern TRAILING_DOT_SPACE = Pattern.compile("[.\\s]+$");
    private static final int MAX_LENGTH = 150;

    public String sanitize(String raw) {
        if (raw == null || raw.isBlank()) {
            return "_";
        }
        String noTraversal = raw.replace("..", "_");
        String cleaned = ILLEGAL_CHARS.matcher(noTraversal).replaceAll("_");
        cleaned = MULTI_SPACE.matcher(cleaned.trim()).replaceAll("_");
        cleaned = TRAILING_DOT_SPACE.matcher(cleaned).replaceAll("");
        if (cleaned.isBlank()) {
            return "_";
        }
        return cleaned.length() > MAX_LENGTH ? cleaned.substring(0, MAX_LENGTH) : cleaned;
    }

    /** Résout des segments (chacun sanitizé) sous base, et garantit que le résultat reste bien sous base. */
    public Path resolveSafe(Path base, String... segments) {
        Path result = base;
        for (String segment : segments) {
            result = result.resolve(sanitize(segment));
        }
        Path normalizedBase = base.normalize();
        Path normalizedResult = result.normalize();
        if (!normalizedResult.startsWith(normalizedBase)) {
            throw new BackupException("Chemin de backup invalide (hors de la racine autorisée) : " + result);
        }
        return normalizedResult;
    }
}
