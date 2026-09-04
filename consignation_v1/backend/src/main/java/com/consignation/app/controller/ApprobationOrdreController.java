package com.consignation.app.controller;

import com.consignation.app.dto.ApprobationOrdreDTO;
import com.consignation.app.service.ApprobationOrdreService;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/approbations")
@RequiredArgsConstructor
public class ApprobationOrdreController {

    private final ApprobationOrdreService approbationService;

    @GetMapping("/plan/{planId}")
    public ResponseEntity<List<ApprobationOrdreDTO>> findByPlan(@PathVariable Long planId) {
        return ResponseEntity.ok(approbationService.findByPlan(planId));
    }

    @PostMapping("/plan/{planId}/approuver")
    public ResponseEntity<ApprobationOrdreDTO> approuver(
            @PathVariable Long planId,
            Authentication auth) {
        Long userId = getUserId(auth);
        if (userId == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(approbationService.approuver(planId, userId));
    }

    private Long getUserId(Authentication auth) {
        if (auth != null && auth.getDetails() instanceof Claims claims) {
            return claims.get("userId", Long.class);
        }
        return null;
    }
}
