package com.consignation.app.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "dispositifs_isolation")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DispositifIsolation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String designation;

    private String reference;

    @Column(columnDefinition = "TEXT")
    private String imageUrl;
}
