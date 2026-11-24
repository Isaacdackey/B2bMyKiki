package com.kikitraiteur.b2b.auth.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "b2b_users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String nomComplet;

    private String titrePoste;
    private String entite;
    private String entrepriseId;
    private String siteId;
    private String siteNom;
    private String matricule;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoleName role;

    private String badge;
    private String badgeColor;

    @Builder.Default
    private boolean actif = true;
}
