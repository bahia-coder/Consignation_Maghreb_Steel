package com.consignation.app.backup;

import com.consignation.app.model.StatutPlan;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Traduit les statuts RÉELS de StatutPlan (8 valeurs existantes, aucune inventée)
 * en noms de dossier sûrs. Les noms d'enum n'ont aucun caractère interdit ; la
 * sanitization reste appliquée par cohérence/robustesse si l'enum évolue un jour.
 */
@Component
@RequiredArgsConstructor
public class StatutFolderMapper {

    private final PathSanitizer sanitizer;

    public String folderFor(StatutPlan statut) {
        return sanitizer.sanitize(statut.name());
    }
}
