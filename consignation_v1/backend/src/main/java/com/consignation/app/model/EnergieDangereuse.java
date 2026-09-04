package com.consignation.app.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "energies_dangereuses")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EnergieDangereuse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer ordre;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private PlanConsignation plan;

    /** Colonne 2 — Equipement / Organe à Consigner */
    private String equipementOrgane;

    /** Colonne 3 — Energie (type enum) */
    @Enumerated(EnumType.STRING)
    private TypeEnergie type;

    /** Colonne 3 — Energie Résiduelle (texte) */
    private String energieResiduelle;

    /** Colonne 4 — Repère et localisation du point de Cadenassage */
    private String repereLocalisation;

    /** Colonne 5 — Action (Ouvrir / Fermer / Purger...) */
    private String action;

    /** Colonne 6 — Dispositif de cadenassage (master data) */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "dispositif_id")
    private DispositifIsolation dispositif;

    /** Colonne 7 — Point et Valeur VAE / Try-Out */
    private String pointValeurVAE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "saisi_par_id")
    private Utilisateur saisiePar;
}
