package com.consignation.app.controller;

import com.consignation.app.dto.EnergieDangereuseDTO;
import com.consignation.app.service.EnergieDangereuseService;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/energies")
@RequiredArgsConstructor
public class EnergieDangereuseController {

    private final EnergieDangereuseService energieService;

    @GetMapping("/plan/{planId}")
    public ResponseEntity<List<EnergieDangereuseDTO>> findByPlan(@PathVariable Long planId) {
        return ResponseEntity.ok(energieService.findByPlan(planId));
    }

    @PostMapping("/batch/{planId}")
    public ResponseEntity<List<EnergieDangereuseDTO>> ajouterBatch(
            @PathVariable Long planId,
            @RequestBody List<EnergieDangereuseDTO> items,
            Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(energieService.ajouterBatch(planId, items, getUserId(auth)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EnergieDangereuseDTO> modifier(
            @PathVariable Long id,
            @RequestBody EnergieDangereuseDTO dto,
            Authentication auth) {
        return ResponseEntity.ok(energieService.modifier(id, dto, getUserId(auth)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable Long id, Authentication auth) {
        energieService.supprimer(id, getUserId(auth));
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/sync/{planId}")
    public ResponseEntity<List<EnergieDangereuseDTO>> synchroniser(
            @PathVariable Long planId,
            @RequestBody List<EnergieDangereuseDTO> items,
            Authentication auth) {
        return ResponseEntity.ok(energieService.synchroniser(planId, items, getUserId(auth)));
    }

    @PatchMapping("/{id}/monter")
    public ResponseEntity<List<EnergieDangereuseDTO>> monter(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(energieService.deplacerVersHaut(id, getUserId(auth)));
    }

    @PatchMapping("/{id}/descendre")
    public ResponseEntity<List<EnergieDangereuseDTO>> descendre(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(energieService.deplacerVersBas(id, getUserId(auth)));
    }

    private Long getUserId(Authentication auth) {
        if (auth != null && auth.getDetails() instanceof Claims claims) {
            return claims.get("userId", Long.class);
        }
        return null;
    }
}
