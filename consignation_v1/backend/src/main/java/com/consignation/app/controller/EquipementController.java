package com.consignation.app.controller;

import com.consignation.app.dto.EquipementDTO;
import com.consignation.app.service.EquipementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/equipements")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000","http://localhost:3001"})
public class EquipementController {

    private final EquipementService equipementService;

    @GetMapping("/racines")
    public ResponseEntity<List<EquipementDTO>> findRacines() {
        return ResponseEntity.ok(equipementService.findRootEquipements());
    }

    @GetMapping("/zone/{zoneId}/racines")
    public ResponseEntity<List<EquipementDTO>> findRacinesParZone(@PathVariable Long zoneId) {
        return ResponseEntity.ok(equipementService.findRootEquipementsByZone(zoneId));
    }

    @GetMapping("/zone/{zoneId}")
    public ResponseEntity<List<EquipementDTO>> findByZone(@PathVariable Long zoneId) {
        return ResponseEntity.ok(equipementService.findByZone(zoneId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EquipementDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(equipementService.findById(id));
    }

    @GetMapping("/{id}/niveau")
    public ResponseEntity<List<EquipementDTO>> findNiveau(@PathVariable Long id) {
        return ResponseEntity.ok(equipementService.findByParent(id));
    }
}
