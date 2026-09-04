package com.consignation.app.controller;

import com.consignation.app.dto.DispositifIsolationDTO;
import com.consignation.app.model.DispositifIsolation;
import com.consignation.app.repository.DispositifIsolationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dispositifs")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000","http://localhost:3001"})
public class DispositifIsolationController {

    private final DispositifIsolationRepository repository;

    private DispositifIsolationDTO toDTO(DispositifIsolation d) {
        return new DispositifIsolationDTO(d.getId(), d.getDesignation(), d.getReference(), d.getImageUrl());
    }

    @GetMapping
    public ResponseEntity<List<DispositifIsolationDTO>> findAll() {
        return ResponseEntity.ok(repository.findAll().stream().map(this::toDTO).collect(Collectors.toList()));
    }

    @PostMapping
    public ResponseEntity<DispositifIsolationDTO> create(@RequestBody DispositifIsolationDTO dto) {
        DispositifIsolation saved = repository.save(
                DispositifIsolation.builder()
                        .designation(dto.getDesignation())
                        .reference(dto.getReference())
                        .imageUrl(dto.getImageUrl())
                        .build()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(toDTO(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DispositifIsolationDTO> update(@PathVariable Long id, @RequestBody DispositifIsolationDTO dto) {
        return repository.findById(id).map(d -> {
            d.setDesignation(dto.getDesignation());
            if (dto.getReference() != null) d.setReference(dto.getReference());
            d.setImageUrl(dto.getImageUrl());
            return ResponseEntity.ok(toDTO(repository.save(d)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
