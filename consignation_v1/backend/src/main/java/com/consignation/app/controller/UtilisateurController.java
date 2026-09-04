package com.consignation.app.controller;

import com.consignation.app.dto.UtilisateurDTO;
import com.consignation.app.model.Role;
import com.consignation.app.model.Utilisateur;
import com.consignation.app.model.Zone;
import com.consignation.app.repository.UtilisateurRepository;
import com.consignation.app.repository.ZoneRepository;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/utilisateurs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UtilisateurController {

    private final UtilisateurRepository utilisateurRepository;
    private final ZoneRepository zoneRepository;
    private final PasswordEncoder passwordEncoder;

    /* ── Endpoint accessible au MANAGER pour voir son équipe ── */
    @GetMapping("/mon-equipe")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public List<UtilisateurDTO> getMonEquipe(Authentication auth) {
        Claims claims = (Claims) auth.getDetails();
        Long zoneId = claims.get("zoneId", Long.class);
        if (zoneId == null) return List.of();
        return utilisateurRepository.findByRoleAndZoneId(Role.CHARGE, zoneId)
                .stream().map(this::toDTO).toList();
    }

    @GetMapping
    public List<UtilisateurDTO> findAll() {
        return utilisateurRepository.findAll().stream()
                .map(this::toDTO)
                .toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<UtilisateurDTO> findById(@PathVariable Long id) {
        return utilisateurRepository.findById(id)
                .map(u -> ResponseEntity.ok(toDTO(u)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody UtilisateurDTO dto) {
        if (utilisateurRepository.existsByUsername(dto.getUsername())) {
            return ResponseEntity.badRequest().body(errorBody("Ce nom d'utilisateur est déjà utilisé."));
        }
        if (utilisateurRepository.existsByMatricule(dto.getMatricule())) {
            return ResponseEntity.badRequest().body(errorBody("Ce matricule est déjà utilisé."));
        }
        Role role = Role.valueOf(dto.getRole());
        if (role == Role.MANAGER && dto.getZoneId() != null
                && utilisateurRepository.existsByRoleAndZoneId(Role.MANAGER, dto.getZoneId())) {
            return ResponseEntity.badRequest().body(errorBody(
                    "Cette zone a déjà un manager. Une zone ne peut avoir qu'un seul manager."));
        }
        Utilisateur user = Utilisateur.builder()
                .matricule(dto.getMatricule())
                .username(dto.getUsername())
                .password(passwordEncoder.encode(dto.getPassword()))
                .nom(dto.getNom())
                .prenom(dto.getPrenom())
                .role(role)
                .zone(dto.getZoneId() != null ? zoneRepository.findById(dto.getZoneId()).orElse(null) : null)
                .build();
        return ResponseEntity.ok(toDTO(utilisateurRepository.save(user)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody UtilisateurDTO dto) {
        return utilisateurRepository.findById(id).<ResponseEntity<?>>map(user -> {
            Role role = Role.valueOf(dto.getRole());
            if (role == Role.MANAGER && dto.getZoneId() != null) {
                boolean zoneADejaUnAutreManager = utilisateurRepository
                        .findByRoleAndZoneId(Role.MANAGER, dto.getZoneId())
                        .stream().anyMatch(m -> !m.getId().equals(id));
                if (zoneADejaUnAutreManager) {
                    return ResponseEntity.badRequest().body(errorBody(
                            "Cette zone a déjà un manager. Une zone ne peut avoir qu'un seul manager."));
                }
            }
            user.setNom(dto.getNom());
            user.setPrenom(dto.getPrenom());
            user.setRole(role);
            user.setZone(dto.getZoneId() != null ? zoneRepository.findById(dto.getZoneId()).orElse(null) : null);
            if (dto.getMatricule() != null && !dto.getMatricule().isBlank()) {
                user.setMatricule(dto.getMatricule());
            }
            if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
                user.setPassword(passwordEncoder.encode(dto.getPassword()));
            }
            return ResponseEntity.ok(toDTO(utilisateurRepository.save(user)));
        }).orElse(ResponseEntity.notFound().build());
    }

    private Map<String, String> errorBody(String message) {
        return Map.of("message", message);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!utilisateurRepository.existsById(id)) return ResponseEntity.notFound().build();
        utilisateurRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private UtilisateurDTO toDTO(Utilisateur u) {
        UtilisateurDTO dto = new UtilisateurDTO();
        dto.setId(u.getId());
        dto.setMatricule(u.getMatricule());
        dto.setUsername(u.getUsername());
        dto.setNom(u.getNom());
        dto.setPrenom(u.getPrenom());
        dto.setRole(u.getRole().name());
        if (u.getZone() != null) {
            dto.setZoneId(u.getZone().getId());
            dto.setZoneCode(u.getZone().getCode());
            dto.setZoneNom(u.getZone().getNom());
        }
        return dto;
    }
}
