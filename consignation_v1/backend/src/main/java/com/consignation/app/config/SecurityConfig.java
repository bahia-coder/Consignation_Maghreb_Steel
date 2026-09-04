package com.consignation.app.config;

import com.consignation.app.security.JwtAuthFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;
import java.util.Map;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        // Config CORS pour les endpoints protégés (avec credentials)
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
            "http://localhost:3000",
            "http://localhost:3001"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        // Config CORS pour les endpoints publics /api/public/** (ngrok + tous origines)
        CorsConfiguration publicConfig = new CorsConfiguration();
        publicConfig.setAllowedOriginPatterns(List.of("*"));
        publicConfig.setAllowedMethods(List.of("GET", "OPTIONS"));
        publicConfig.setAllowedHeaders(List.of("*"));
        publicConfig.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/public/**", publicConfig);
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }

    /** Token absent/invalide/expiré → 401 (pas d'Authentication du tout). */
    @Bean
    public AuthenticationEntryPoint authenticationEntryPoint(ObjectMapper objectMapper) {
        return (request, response, authException) -> writeJsonError(response, objectMapper, 401, "Non authentifié");
    }

    /** Token valide mais rôle insuffisant → 403. */
    @Bean
    public AccessDeniedHandler accessDeniedHandler(ObjectMapper objectMapper) {
        return (request, response, accessDeniedException) -> writeJsonError(response, objectMapper, 403, "Accès refusé");
    }

    private void writeJsonError(jakarta.servlet.http.HttpServletResponse response, ObjectMapper objectMapper,
                                 int status, String message) throws java.io.IOException {
        response.setStatus(status);
        response.setCharacterEncoding("UTF-8");
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(objectMapper.writeValueAsString(Map.of("status", status, "message", message)));
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                            AuthenticationEntryPoint authenticationEntryPoint,
                                            AccessDeniedHandler accessDeniedHandler) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(authenticationEntryPoint)
                .accessDeniedHandler(accessDeniedHandler)
            )
            .authorizeHttpRequests(auth -> auth
                // Seul le login est public : /api/auth/me exige désormais un token valide
                .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                // Endpoints publics QR Code — sans authentification
                .requestMatchers(HttpMethod.GET, "/api/public/**").permitAll()
                // Accepter/rejeter demande : Manager et Admin uniquement
                .requestMatchers(HttpMethod.PATCH, "/api/plans/*/accepter-demande").hasAnyRole("MANAGER", "ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/api/plans/*/rejeter-demande").hasAnyRole("MANAGER", "ADMIN")
                // Soumettre pour validation : Chargé de Consignation et Admin uniquement
                .requestMatchers(HttpMethod.PATCH, "/api/plans/*/soumettre-validation").hasAnyRole("CHARGE", "ADMIN")
                // Valider/rejeter plan : Manager et Admin uniquement
                .requestMatchers(HttpMethod.POST, "/api/plans/*/valider").hasAnyRole("MANAGER", "ADMIN")
                // Tester plan : Chargé de Consignation et Admin uniquement
                .requestMatchers(HttpMethod.PATCH, "/api/plans/*/tester").hasAnyRole("CHARGE", "ADMIN")
                // Supprimer un plan : Manager et Admin uniquement
                .requestMatchers(HttpMethod.DELETE, "/api/plans/*").hasAnyRole("MANAGER", "ADMIN")
                // Administration du backup local des plans : Admin uniquement
                .requestMatchers("/api/admin/backup/**").hasRole("ADMIN")
                // Énergies écriture : Chargé de Consignation et Admin uniquement
                .requestMatchers(HttpMethod.POST, "/api/energies/**").hasAnyRole("CHARGE", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/energies/**").hasAnyRole("CHARGE", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/energies/**").hasAnyRole("CHARGE", "ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/api/energies/**").hasAnyRole("CHARGE", "ADMIN")
                // Équipe du manager : Manager et Admin
                .requestMatchers(HttpMethod.GET, "/api/utilisateurs/mon-equipe").hasAnyRole("MANAGER", "ADMIN")
                // Gestion utilisateurs : Admin seulement
                .requestMatchers("/api/utilisateurs/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
