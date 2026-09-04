package com.consignation.app.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "historique_plans")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class HistoriquePlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private PlanConsignation plan;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(35)")
    private TypeAction typeAction;

    @Column(nullable = false)
    private LocalDateTime dateAction;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "realise_par_id")
    private Utilisateur realiseePar;
}
