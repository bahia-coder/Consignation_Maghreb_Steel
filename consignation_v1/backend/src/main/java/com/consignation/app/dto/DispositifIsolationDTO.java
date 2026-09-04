package com.consignation.app.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DispositifIsolationDTO {
    private Long id;
    private String designation;
    private String reference;
    private String imageUrl;
}
