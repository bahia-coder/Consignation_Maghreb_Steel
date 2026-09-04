package com.consignation.app.repository;

import com.consignation.app.model.ApprobationOrdre;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ApprobationOrdreRepository extends JpaRepository<ApprobationOrdre, Long> {

    List<ApprobationOrdre> findByPlanId(Long planId);

    Optional<ApprobationOrdre> findByPlanIdAndUtilisateurId(Long planId, Long utilisateurId);

    boolean existsByPlanIdAndUtilisateurId(Long planId, Long utilisateurId);

    boolean existsByPlanIdAndApprouveFalse(Long planId);

    void deleteByPlanId(Long planId);
}
