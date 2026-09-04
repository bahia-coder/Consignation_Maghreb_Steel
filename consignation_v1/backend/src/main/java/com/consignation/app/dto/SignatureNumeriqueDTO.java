package com.consignation.app.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SignatureNumeriqueDTO {
    private Long id;
    private String signataire;
    private String fonction;
    private String donneesSignature;
    private LocalDateTime dateSignature;
}
