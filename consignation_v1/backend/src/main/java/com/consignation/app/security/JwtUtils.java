package com.consignation.app.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;
import java.security.Key;
import java.util.Date;

@Component
public class JwtUtils {

    private static final long EXPIRATION_MS = 24 * 60 * 60 * 1000L; // 24h

    // Clé générée aléatoirement à chaque démarrage de l'application (et non lue
    // depuis application.properties) : un redémarrage du serveur invalide donc
    // automatiquement tous les tokens émis avant, sans registre de sessions à gérer.
    // ⚠️ Ne fonctionne que pour un déploiement à instance unique : plusieurs instances
    // du backend derrière un load-balancer auraient chacune leur propre clé et
    // rejetteraient les tokens émis par les autres.
    private final Key key = Keys.secretKeyFor(SignatureAlgorithm.HS256);

    private Key getKey() {
        return key;
    }

    public String generateToken(Long userId, String username, String role, Long zoneId, String zoneCode) {
        return Jwts.builder()
                .setSubject(username)
                .claim("userId", userId)
                .claim("role", role)
                .claim("zoneId", zoneId)
                .claim("zoneCode", zoneCode)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_MS))
                .signWith(getKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public boolean validateToken(String token) {
        try {
            parseToken(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
