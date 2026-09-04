package com.consignation.app.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "approbations_ordre",
       uniqueConstraints = @UniqueConstraint(columnNames = {"plan_id", "utilisateur_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ApprobationOrdre {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private PlanConsignation plan;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @Column(nullable = false)
    private boolean approuve;

    private LocalDateTime dateApprobation;
}
