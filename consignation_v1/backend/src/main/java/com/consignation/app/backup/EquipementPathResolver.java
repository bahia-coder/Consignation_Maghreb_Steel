package com.consignation.app.backup;

import com.consignation.app.model.Equipement;
import com.consignation.app.model.Zone;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import java.nio.file.Path;
import java.util.LinkedList;
import java.util.List;

/**
 * Construit dynamiquement le chemin de backup d'un équipement à partir de la
 * hiérarchie parent/enfant réelle (Equipement.parent), récursive, sans limite
 * de profondeur codée en dur.
 */
@Component
@RequiredArgsConstructor
public class EquipementPathResolver {

    private final PathSanitizer sanitizer;

    /** Segments du chemin, de la zone jusqu'à l'équipement, dans l'ordre. */
    public List<String> segmentsFor(Equipement equipement) {
        LinkedList<String> segments = new LinkedList<>();
        Equipement current = equipement;
        while (current != null) {
            segments.addFirst(sanitizer.sanitize(current.getCode()));
            current = current.getParent();
        }
        Zone zone = equipement.getZone();
        segments.addFirst("Zone_" + sanitizer.sanitize(zone.getCode()));
        return segments;
    }

    public Path equipementDir(Path root, Equipement equipement) {
        List<String> segments = segmentsFor(equipement);
        return sanitizer.resolveSafe(root, segments.toArray(new String[0]));
    }
}
