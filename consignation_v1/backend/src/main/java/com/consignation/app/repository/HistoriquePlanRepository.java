package com.consignation.app.repository;

import com.consignation.app.model.HistoriquePlan;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HistoriquePlanRepository extends JpaRepository<HistoriquePlan, Long> {
    List<HistoriquePlan> findByPlanIdOrderByDateActionAsc(Long planId);
    List<HistoriquePlan> findTop10ByOrderByDateActionDesc();
    List<HistoriquePlan> findTop10ByPlan_Equipement_ZoneIdOrderByDateActionDesc(Long zoneId);
    void deleteByPlanId(Long planId);
}
