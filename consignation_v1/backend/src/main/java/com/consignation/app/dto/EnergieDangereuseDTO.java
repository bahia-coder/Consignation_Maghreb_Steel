package com.consignation.app.dto;

import com.consignation.app.model.TypeEnergie;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EnergieDangereuseDTO {
    private Long id;
    private Integer ordre;
    private Long planId;

    private String equipementOrgane;
    private TypeEnergie type;
    private String energieResiduelle;
    private String repereLocalisation;
    private String action;
    private Long dispositifId;
    private String dispositifDesignation;
    private String pointValeurVAE;
    private Long saisieParId;
    private String saisieParNom;
    private String saisieParMatricule;
}
