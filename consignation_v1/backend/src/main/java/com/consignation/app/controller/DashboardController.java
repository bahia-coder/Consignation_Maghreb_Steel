package com.consignation.app.controller;

import com.consignation.app.dto.DashboardStatsDTO;
import com.consignation.app.security.JwtUtils;
import com.consignation.app.service.DashboardService;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDTO> getStats(Authentication auth) {
        Claims claims = (Claims) auth.getDetails();
        String role = claims.get("role", String.class);

        if ("ADMIN".equals(role)) {
            return ResponseEntity.ok(dashboardService.getStatsAdmin());
        }

        Long zoneId = extractLong(claims, "zoneId");
        if (zoneId == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(dashboardService.getStatsZone(zoneId));
    }

    @GetMapping("/stats/zone/{zoneId}")
    public ResponseEntity<DashboardStatsDTO> getStatsByZone(
            @PathVariable Long zoneId,
            Authentication auth) {
        Claims claims = (Claims) auth.getDetails();
        String role = claims.get("role", String.class);

        // Admin : accès à toutes les zones. Manager/Chargé : seulement leur zone.
        if (!"ADMIN".equals(role)) {
            Long tokenZoneId = extractLong(claims, "zoneId");
            if (tokenZoneId == null || !tokenZoneId.equals(zoneId)) {
                return ResponseEntity.status(403).build();
            }
        }
        return ResponseEntity.ok(dashboardService.getStatsZone(zoneId));
    }

    /** Extrait un Long d'un claim JWT quel que soit son type numérique stocké (Integer ou Long). */
    private Long extractLong(Claims claims, String key) {
        Object val = claims.get(key);
        if (val == null) return null;
        if (val instanceof Long l) return l;
        if (val instanceof Integer i) return i.longValue();
        if (val instanceof Number n) return n.longValue();
        return null;
    }
}
