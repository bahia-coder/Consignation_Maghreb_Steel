package com.consignation.app.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ZoneDTO {
    private Long id;
    private String code;
    private String nom;
}
