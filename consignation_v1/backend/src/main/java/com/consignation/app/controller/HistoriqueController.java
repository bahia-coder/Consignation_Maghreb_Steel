package com.consignation.app.controller;

import com.consignation.app.dto.HistoriquePlanDTO;
import com.consignation.app.service.HistoriqueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/historique")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000","http://localhost:3001"})
public class HistoriqueController {

    private final HistoriqueService historiqueService;

    @GetMapping("/plan/{planId}")
    public ResponseEntity<List<HistoriquePlanDTO>> findByPlan(@PathVariable Long planId) {
        return ResponseEntity.ok(historiqueService.findByPlan(planId));
    }
}
