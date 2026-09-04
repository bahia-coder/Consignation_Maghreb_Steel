package com.consignation.app.repository;

import com.consignation.app.model.PlanConsignation;
import com.consignation.app.model.StatutPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface PlanConsignationRepository extends JpaRepository<PlanConsignation, Long> {

    // LEFT JOIN FETCH sur demandeur (peut être null) + JOIN FETCH sur equipement (jamais
    // nul) : évite le N+1 déclenché par plan.getDemandeur()/.getEquipement() en DTO.
    @Query("SELECT p FROM PlanConsignation p LEFT JOIN FETCH p.demandeur JOIN FETCH p.equipement WHERE p.equipement.id = :equipementId")
    List<PlanConsignation> findByEquipementId(@Param("equipementId") Long equipementId);

    long countByEquipementId(Long equipementId);

    List<PlanConsignation> findByEquipementIdAndStatut(Long equipementId, StatutPlan statut);

    List<PlanConsignation> findByStatut(StatutPlan statut);

    long countByStatut(StatutPlan statut);
    long countByEquipement_ZoneId(Long zoneId);

    @Query("SELECT p FROM PlanConsignation p LEFT JOIN FETCH p.demandeur JOIN FETCH p.equipement WHERE p.equipement.zone.id = :zoneId")
    List<PlanConsignation> findByEquipement_ZoneId(@Param("zoneId") Long zoneId);

    long countByEquipement_ZoneIdAndStatut(Long zoneId, StatutPlan statut);

    // Nombre de plans par équipement, en une seule requête agrégée — remplace l'accès
    // à equipement.getPlans().size() par équipement (N+1).
    @Query("SELECT p.equipement.id, COUNT(p) FROM PlanConsignation p WHERE p.equipement.id IN :equipementIds GROUP BY p.equipement.id")
    List<Object[]> countGroupedByEquipementIds(@Param("equipementIds") List<Long> equipementIds);

    List<PlanConsignation> findTop10ByOrderByDateCreationDesc();
    List<PlanConsignation> findTop10ByEquipement_ZoneIdOrderByDateCreationDesc(Long zoneId);

    // Plans créés entre deux dates (tous)
    List<PlanConsignation> findByDateCreationBetween(LocalDateTime from, LocalDateTime to);

    // Plans créés entre deux dates pour une zone
    List<PlanConsignation> findByEquipement_ZoneIdAndDateCreationBetween(
            @Param("zoneId") Long zoneId,
            LocalDateTime from, LocalDateTime to);
}
