package com.consignation.app.repository;

import com.consignation.app.model.Validation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ValidationRepository extends JpaRepository<Validation, Long> {
    Optional<Validation> findByPlanId(Long planId);
}
