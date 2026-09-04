package com.consignation.app.service;

import com.consignation.app.dto.EquipementDTO;
import com.consignation.app.model.Equipement;
import com.consignation.app.repository.EquipementRepository;
import com.consignation.app.repository.PlanConsignationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EquipementService {

    private final EquipementRepository equipementRepository;
    private final PlanConsignationRepository planRepository;

    public List<EquipementDTO> findByZone(Long zoneId) {
        return toDTOs(equipementRepository.findByZoneId(zoneId));
    }

    /**
     * Retourne l'équipement parent lui-même + tous ses enfants directs.
     * Cela correspond au comportement : "sélectionner un niveau affiche le parent + ses sous-équipements".
     */
    public List<EquipementDTO> findByParent(Long parentId) {
        Equipement parent = equipementRepository.findById(parentId)
                .orElseThrow(() -> new RuntimeException("Équipement non trouvé : " + parentId));

        List<Equipement> tous = new ArrayList<>();
        tous.add(parent);
        tous.addAll(equipementRepository.findByParentId(parentId));

        return toDTOs(tous);
    }

    public List<EquipementDTO> findRootEquipements() {
        return toDTOs(equipementRepository.findByParentIsNull());
    }

    public List<EquipementDTO> findRootEquipementsByZone(Long zoneId) {
        return toDTOs(equipementRepository.findRootEquipementsByZone(zoneId));
    }

    public EquipementDTO findById(Long id) {
        Equipement e = equipementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Équipement non trouvé : " + id));
        return toDTOs(List.of(e)).get(0);
    }

    /**
     * Convertit un lot d'équipements en DTO sans jamais toucher les collections lazy
     * sousEquipements/plans (qui déclencheraient une requête par équipement) : le nombre
     * de sous-équipements et de plans est calculé via deux requêtes agrégées pour tout le lot.
     */
    private List<EquipementDTO> toDTOs(List<Equipement> equipements) {
        if (equipements.isEmpty()) return List.of();

        List<Long> ids = equipements.stream().map(Equipement::getId).distinct().collect(Collectors.toList());
        Map<Long, Long> childrenCounts = groupCounts(equipementRepository.countChildrenGroupedByParentIds(ids));
        Map<Long, Long> planCounts = groupCounts(planRepository.countGroupedByEquipementIds(ids));

        return equipements.stream()
                .map(e -> EquipementDTO.builder()
                        .id(e.getId())
                        .code(e.getCode())
                        .description(e.getDescription())
                        .parentId(e.getParent() != null ? e.getParent().getId() : null)
                        .parentCode(e.getParent() != null ? e.getParent().getCode() : null)
                        .zoneId(e.getZone().getId())
                        .zoneCode(e.getZone().getCode())
                        .hasSousEquipements(childrenCounts.getOrDefault(e.getId(), 0L) > 0)
                        .nombrePlans(planCounts.getOrDefault(e.getId(), 0L).intValue())
                        .build())
                .collect(Collectors.toList());
    }

    private Map<Long, Long> groupCounts(List<Object[]> rows) {
        Map<Long, Long> map = new HashMap<>();
        for (Object[] row : rows) {
            map.put((Long) row[0], (Long) row[1]);
        }
        return map;
    }

    public EquipementDTO toDTO(Equipement e) {
        return toDTOs(List.of(e)).get(0);
    }
}
