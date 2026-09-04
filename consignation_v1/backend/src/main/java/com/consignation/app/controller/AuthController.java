package com.consignation.app.controller;

import com.consignation.app.dto.LoginRequest;
import com.consignation.app.dto.LoginResponse;
import com.consignation.app.model.Utilisateur;
import com.consignation.app.repository.UtilisateurRepository;
import com.consignation.app.security.JwtUtils;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authManager;
    private final UtilisateurRepository utilisateurRepository;
    private final JwtUtils jwtUtils;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        authManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getMatricule(), request.getPassword())
        );

        Utilisateur user = utilisateurRepository.findByMatricule(request.getMatricule()).orElseThrow();

        Long zoneId = user.getZone() != null ? user.getZone().getId() : null;
        String zoneCode = user.getZone() != null ? user.getZone().getCode() : null;

        String token = jwtUtils.generateToken(user.getId(), user.getMatricule(),
                user.getRole().name(), zoneId, zoneCode);

        return ResponseEntity.ok(LoginResponse.builder()
                .token(token)
                .userId(user.getId())
                .matricule(user.getMatricule())
                .username(user.getUsername())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .role(user.getRole().name())
                .zoneId(zoneId)
                .zoneCode(zoneCode)
                .zoneNom(user.getZone() != null ? user.getZone().getNom() : null)
                .build());
    }

    /**
     * Revalide la session courante : le JWT peut être syntaxiquement valide (signature OK, non expiré)
     * mais correspondre à un utilisateur supprimé entre-temps. Le frontend appelle cet endpoint au
     * démarrage avant d'afficher toute page protégée ; toute réponse autre que 200 doit être traitée
     * comme une session invalide (nettoyage + redirection /login côté client).
     */
    @GetMapping("/me")
    public ResponseEntity<LoginResponse> me(Authentication auth) {
        Claims claims = (Claims) auth.getDetails();
        Long userId = extractLong(claims, "userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return utilisateurRepository.findById(userId)
                .map(user -> {
                    Long zoneId = user.getZone() != null ? user.getZone().getId() : null;
                    String zoneCode = user.getZone() != null ? user.getZone().getCode() : null;
                    return ResponseEntity.ok(LoginResponse.builder()
                            .userId(user.getId())
                            .matricule(user.getMatricule())
                            .username(user.getUsername())
                            .nom(user.getNom())
                            .prenom(user.getPrenom())
                            .role(user.getRole().name())
                            .zoneId(zoneId)
                            .zoneCode(zoneCode)
                            .zoneNom(user.getZone() != null ? user.getZone().getNom() : null)
                            .build());
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
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
