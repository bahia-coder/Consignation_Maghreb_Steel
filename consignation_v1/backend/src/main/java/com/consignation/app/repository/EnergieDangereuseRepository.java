package com.consignation.app.repository;

import com.consignation.app.model.EnergieDangereuse;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EnergieDangereuseRepository extends JpaRepository<EnergieDangereuse, Long> {
    List<EnergieDangereuse> findByPlanIdOrderByOrdreAsc(Long planId);
}
