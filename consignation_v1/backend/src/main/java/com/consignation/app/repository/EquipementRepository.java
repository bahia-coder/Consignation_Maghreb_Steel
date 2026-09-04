package com.consignation.app.repository;

import com.consignation.app.model.Equipement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface EquipementRepository extends JpaRepository<Equipement, Long> {

    Optional<Equipement> findByCode(String code);

    // LEFT JOIN FETCH sur parent (peut être null pour un équipement racine) + JOIN FETCH sur
    // zone (jamais nulle) : charge tout en une seule requête au lieu de N requêtes lazy
    // déclenchées par equipement.getParent()/.getZone() lors de la conversion en DTO.
    @Query("SELECT e FROM Equipement e LEFT JOIN FETCH e.parent JOIN FETCH e.zone WHERE e.zone.id = :zoneId")
    List<Equipement> findByZoneId(@Param("zoneId") Long zoneId);

    @Query("SELECT e FROM Equipement e LEFT JOIN FETCH e.parent JOIN FETCH e.zone WHERE e.parent IS NULL")
    List<Equipement> findByParentIsNull();

    @Query("SELECT e FROM Equipement e LEFT JOIN FETCH e.parent JOIN FETCH e.zone WHERE e.parent.id = :parentId")
    List<Equipement> findByParentId(@Param("parentId") Long parentId);

    @Query("SELECT e FROM Equipement e LEFT JOIN FETCH e.parent JOIN FETCH e.zone WHERE e.zone.id = :zoneId AND e.parent IS NULL")
    List<Equipement> findRootEquipementsByZone(@Param("zoneId") Long zoneId);

    long countByZoneId(Long zoneId);

    // Nombre de sous-équipements directs par parent, en une seule requête agrégée —
    // remplace l'accès à equipement.getSousEquipements().isEmpty() par équipement (N+1).
    @Query("SELECT e.parent.id, COUNT(e) FROM Equipement e WHERE e.parent.id IN :parentIds GROUP BY e.parent.id")
    List<Object[]> countChildrenGroupedByParentIds(@Param("parentIds") List<Long> parentIds);
}
