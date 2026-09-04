package com.consignation.app.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "signatures_numeriques")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SignatureNumerique {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String signataire;

    @Column(nullable = false)
    private String fonction;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String donneesSignature;

    @Column(nullable = false)
    private LocalDateTime dateSignature;

    @OneToOne(mappedBy = "signature", fetch = FetchType.LAZY)
    private Validation validation;
}
