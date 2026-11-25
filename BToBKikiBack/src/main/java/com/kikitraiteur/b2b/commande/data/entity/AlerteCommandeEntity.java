package com.kikitraiteur.b2b.commande.data.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "b2b_alertes_commande")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlerteCommandeEntity {
    @Id
    private String id;

    private String entrepriseId;

    @Column(nullable = false)
    private String employeEmail;

    private String employeNom;
    private String expediteurNom;

    @Column(length = 1000, nullable = false)
    private String message;

    @Builder.Default
    private boolean lu = false;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
