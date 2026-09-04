package com.consignation.app.repository;

import com.consignation.app.model.Role;
import com.consignation.app.model.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {
    Optional<Utilisateur> findByMatricule(String matricule);
    Optional<Utilisateur> findByUsername(String username);
    boolean existsByUsername(String username);
    boolean existsByMatricule(String matricule);
    long countByRole(Role role);
    List<Utilisateur> findByRole(Role role);
    List<Utilisateur> findByRoleAndZoneId(Role role, Long zoneId);
    boolean existsByRoleAndZoneId(Role role, Long zoneId);
}
