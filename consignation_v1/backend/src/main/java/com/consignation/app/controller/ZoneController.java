package com.consignation.app.controller;

import com.consignation.app.dto.ZoneDTO;
import com.consignation.app.service.ZoneService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/zones")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000","http://localhost:3001"})
public class ZoneController {

    private final ZoneService zoneService;

    @GetMapping
    public ResponseEntity<List<ZoneDTO>> findAll() {
        return ResponseEntity.ok(zoneService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ZoneDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(zoneService.findById(id));
    }
}
