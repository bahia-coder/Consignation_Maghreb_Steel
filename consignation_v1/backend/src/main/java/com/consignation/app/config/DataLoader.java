package com.consignation.app.config;

import com.consignation.app.model.*;
import com.consignation.app.repository.*;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {

    private final ZoneRepository zoneRepository;
    private final EquipementRepository equipementRepository;
    private final PlanConsignationRepository planRepository;
    private final DispositifIsolationRepository dispositifRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;
    private final EntityManager entityManager;

    @Override
    @Transactional
    public void run(String... args) {
        migrerAncienStatuts();
        if (zoneRepository.count() == 0) {
            chargerZoneTSSC();
            chargerZoneBAUX();
        }
        if (dispositifRepository.count() == 0) {
            chargerDispositifs();
        }
        if (utilisateurRepository.count() == 0) {
            chargerUtilisateurs();
        }
        ajouterUtilisateurSiAbsent();
    }

    private void migrerAncienStatuts() {
        // ── plans_consignation.statut ──
        entityManager.createNativeQuery(
            "ALTER TABLE plans_consignation MODIFY COLUMN statut VARCHAR(35) NOT NULL").executeUpdate();
        entityManager.createNativeQuery(
            "UPDATE plans_consignation SET statut = 'PLAN_VALIDE'                WHERE statut = 'VALIDE'").executeUpdate();
        entityManager.createNativeQuery(
            "UPDATE plans_consignation SET statut = 'PLAN_REJETE'                WHERE statut = 'REJETE'").executeUpdate();
        entityManager.createNativeQuery(
            "UPDATE plans_consignation SET statut = 'PLAN_EN_COURS'              WHERE statut = 'EN_TRAITEMENT'").executeUpdate();
        entityManager.createNativeQuery(
            "UPDATE plans_consignation SET statut = 'PLAN_EN_ATTENTE_VALIDATION' WHERE statut = 'EN_ATTENTE_VALIDATION'").executeUpdate();
        entityManager.createNativeQuery(
            "UPDATE plans_consignation SET statut = 'DEMANDE_EN_COURS'           WHERE statut = 'DEMANDE'").executeUpdate();

        // ── historique_plans.type_action ──
        // Élargir la colonne pour les nouveaux noms d'enum
        entityManager.createNativeQuery(
            "ALTER TABLE historique_plans MODIFY COLUMN type_action VARCHAR(35) NOT NULL").executeUpdate();
        // Supprimer les lignes dont le type_action ne correspond plus à l'enum actuel
        // (anciens enregistrements créés avant la refonte des statuts)
        entityManager.createNativeQuery(
            "DELETE FROM historique_plans WHERE type_action NOT IN (" +
            "'DEMANDE_CREEE','DEMANDE_ACCEPTEE','DEMANDE_REJETEE','PLAN_EN_COURS'," +
            "'ENERGIE_AJOUTEE','ENERGIE_MODIFIEE','ENERGIE_SUPPRIMEE','ORDRE_MODIFIE'," +
            "'SOUMIS_VALIDATION','PLAN_VALIDE','PLAN_REJETE','PLAN_TESTE'" +
            ")").executeUpdate();
    }

    private void chargerDispositifs() {
        String[] dispositifs = {
            "Disjoncteur",
            "Sectionneur",
            "Interrupteur général",
            "Contacteur",
            "Relais",
            "Vanne manuelle",
            "Vanne pneumatique",
            "Vanne hydraulique",
            "Robinet d'arrêt",
            "Vanne à boisseau sphérique",
            "Vanne papillon",
            "Clapet anti-retour",
            "Obturateur",
            "Cadenas de consignation",
            "Verrou mécanique",
            "Cales de blocage",
            "Béquille de sécurité",
            "Court-circuit de terre"
        };
        for (String d : dispositifs) {
            dispositifRepository.save(DispositifIsolation.builder().designation(d).build());
        }
    }

    private void chargerZoneTSSC() {
        Zone tssc = zoneRepository.save(Zone.builder().code("TSSC").nom("Steel Service Center TM").build());

        Equipement rf8 = save(eq("TSSC-RF8", "Ligne Refendage R8", null, tssc));

        Equipement arel = save(eq("TSSC-RF8-AREL", "Armoires Électrique", rf8, tssc));
        Equipement sece = save(eq("TSSC-RF8-SECE", "Section d'Entrée Ligne R8", rf8, tssc));
        Equipement drel = save(eq("TSSC-RF8-DREL", "Dérouleur", rf8, tssc));

        Equipement pupc = save(eq("TSSC-RF8-SECE-PUPC", "Pupitre de Commande", sece, tssc));
        Equipement chre = save(eq("TSSC-RF8-SECE-CHRE", "Chariot d'Entrée", sece, tssc));

        save(eq("TSSC-RF8-SECE-CHRE-MORE", "Motoréducteur", chre, tssc));
        save(eq("TSSC-RF8-SECE-CHRE-VEHY", "Vérin Hydraulique", chre, tssc));
        save(eq("TSSC-RF8-SECE-CHRE-GALT", "Galets", chre, tssc));
        save(eq("TSSC-RF8-SECE-CHRE-PGCR", "Pignon Crémaillère", chre, tssc));
        save(eq("TSSC-RF8-SECE-CHRE-PGCH", "Pignon Chaîne", chre, tssc));
        save(eq("TSSC-RF8-SECE-CHRE-RAIL", "Rails", chre, tssc));
        save(eq("TSSC-RF8-SECE-CHRE-COVT", "Couverture Télescopique Fossé", chre, tssc));
        save(eq("TSSC-RF8-SECE-CHRE-INST", "Instrumentation", chre, tssc));

        Equipement drelCfel = save(eq("TSSC-RF8-DREL-CFEL", "Coffret Électrique", drel, tssc));
        save(eq("TSSC-RF8-DREL-MOTR", "Moteur", drel, tssc));
        save(eq("TSSC-RF8-DREL-REDC", "Réducteur Mandrin", drel, tssc));
        save(eq("TSSC-RF8-DREL-VEHY", "Vérin Hydraulique", drel, tssc));
        save(eq("TSSC-RF8-DREL-FRPN", "Frein Pneumatique", drel, tssc));
        save(eq("TSSC-RF8-DREL-ACCO", "Accouplement", drel, tssc));

        creerPlanExemple(chre, StatutPlan.PLAN_VALIDE);
        creerPlanExemple(sece, StatutPlan.PLAN_EN_COURS);
    }

    private void chargerZoneBAUX() {
        Zone baux = zoneRepository.save(Zone.builder().code("BAUX").nom("Zone Bassin Auxiliaire").build());

        Equipement hf1 = save(eq("BAUX-HF1", "Haut Fourneau 1", null, baux));
        Equipement cbt = save(eq("BAUX-HF1-CBT", "Circuit de Bassins de Traitement", hf1, baux));
        save(eq("BAUX-HF1-CBT-PMP", "Pompes de Circulation", cbt, baux));
        save(eq("BAUX-HF1-CBT-VAN", "Vannes de Régulation", cbt, baux));
        save(eq("BAUX-HF1-CBT-ECH", "Échangeurs Thermiques", cbt, baux));
    }

    private void chargerUtilisateurs() {
        Zone tssc = zoneRepository.findAll().stream()
                .filter(z -> "TSSC".equals(z.getCode())).findFirst().orElse(null);
        Zone baux = zoneRepository.findAll().stream()
                .filter(z -> "BAUX".equals(z.getCode())).findFirst().orElse(null);

        utilisateurRepository.save(Utilisateur.builder()
                .matricule("MS-ADM-001")
                .username("admin")
                .password(passwordEncoder.encode("admin123"))
                .nom("Administrateur")
                .prenom("Système")
                .role(Role.ADMIN)
                .zone(null)
                .build());

        utilisateurRepository.save(Utilisateur.builder()
                .matricule("MS-MGR-001")
                .username("manager.tssc")
                .password(passwordEncoder.encode("pass123"))
                .nom("BENALI")
                .prenom("Karim")
                .role(Role.MANAGER)
                .zone(tssc)
                .build());

        utilisateurRepository.save(Utilisateur.builder()
                .matricule("MS-MGR-002")
                .username("manager.baux")
                .password(passwordEncoder.encode("pass123"))
                .nom("AMRANI")
                .prenom("Youssef")
                .role(Role.MANAGER)
                .zone(baux)
                .build());

        utilisateurRepository.save(Utilisateur.builder()
                .matricule("MS-CHG-001")
                .username("charge.tssc")
                .password(passwordEncoder.encode("pass123"))
                .nom("CHERKAOUI")
                .prenom("Omar")
                .role(Role.CHARGE)
                .zone(tssc)
                .build());

        utilisateurRepository.save(Utilisateur.builder()
                .matricule("MS-CHG-002")
                .username("charge.baux")
                .password(passwordEncoder.encode("pass123"))
                .nom("TAZI")
                .prenom("Rachid")
                .role(Role.CHARGE)
                .zone(baux)
                .build());
    }

    private void ajouterUtilisateurSiAbsent() {
        Zone tssc = zoneRepository.findAll().stream()
                .filter(z -> "TSSC".equals(z.getCode())).findFirst().orElse(null);

        if (!utilisateurRepository.existsByMatricule("8080")) {
            utilisateurRepository.save(Utilisateur.builder()
                    .matricule("8080")
                    .username("manager.elbahia")
                    .password(passwordEncoder.encode("bahia"))
                    .nom("El Bahia")
                    .prenom("")
                    .role(Role.MANAGER)
                    .zone(tssc)
                    .build());
        }

        if (!utilisateurRepository.existsByMatricule("7070")) {
            utilisateurRepository.save(Utilisateur.builder()
                    .matricule("7070")
                    .username("charge.nadie")
                    .password(passwordEncoder.encode("nadia"))
                    .nom("Nadie")
                    .prenom("")
                    .role(Role.CHARGE)
                    .zone(tssc)
                    .build());
        }

        if (!utilisateurRepository.existsByMatricule("4040")) {
            utilisateurRepository.save(Utilisateur.builder()
                    .matricule("4040")
                    .username("charge.salwa")
                    .password(passwordEncoder.encode("salwa"))
                    .nom("Salwa")
                    .prenom("")
                    .role(Role.CHARGE)
                    .zone(tssc)
                    .build());
        }

        if (!utilisateurRepository.existsByMatricule("1111")) {
            utilisateurRepository.save(Utilisateur.builder()
                    .matricule("1111")
                    .username("admin.1111")
                    .password(passwordEncoder.encode("1111"))
                    .nom("Admin")
                    .prenom("")
                    .role(Role.ADMIN)
                    .zone(null)
                    .build());
        }

        if (!utilisateurRepository.existsByMatricule("8888")) {
            utilisateurRepository.save(Utilisateur.builder()
                    .matricule("8888")
                    .username("charge.travaux.bahia")
                    .password(passwordEncoder.encode("bahia"))
                    .nom("Bahia")
                    .prenom("")
                    .role(Role.CHARGE_TRAVAUX)
                    .zone(tssc)
                    .build());
        }
    }

    private Equipement eq(String code, String desc, Equipement parent, Zone zone) {
        return Equipement.builder().code(code).description(desc).parent(parent).zone(zone).build();
    }

    private Equipement save(Equipement e) {
        return equipementRepository.save(e);
    }

    private void creerPlanExemple(Equipement equipement, StatutPlan statut) {
        PlanConsignation plan = PlanConsignation.builder()
                .reference("CONS-" + equipement.getCode() + "-DEMO")
                .dateCreation(LocalDateTime.now().minusDays(5))
                .dateValidation(statut == StatutPlan.PLAN_VALIDE ? LocalDateTime.now().minusDays(1) : null)
                .descriptionIntervention("Maintenance préventive annuelle - " + equipement.getDescription())
                .responsableIntervention("BENALI Karim")
                .statut(statut)
                .equipement(equipement)
                .build();
        planRepository.save(plan);
    }
}
