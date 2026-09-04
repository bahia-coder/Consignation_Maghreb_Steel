package com.consignation.app.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "plans_consignation")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PlanConsignation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String reference;

    @Column(nullable = false)
    private LocalDateTime dateCreation;

    private LocalDateTime dateEnvoi;

    private LocalDateTime dateValidation;

    @Column(nullable = false)
    private String descriptionIntervention;

    private String responsableIntervention;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "demandeur_id")
    private Utilisateur demandeur;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(35)")
    private StatutPlan statut;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipement_id", nullable = false)
    private Equipement equipement;

    @OneToMany(mappedBy = "plan", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @OrderBy("ordre ASC")
    private List<EnergieDangereuse> energies;

    @OneToOne(mappedBy = "plan", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Validation validation;
}
