package com.kikitraiteur.b2b.catalogue.data.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "b2b_plats")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlatEntity {
    @Id
    private String id;

    @Column(nullable = false)
    private String nom;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    private String categorie; // ENTREE, PLAT, GARNITURE, DESSERT, BOISSON

    @Column(nullable = false)
    private Integer prixUnitaire;

    private String image;
    private String allergene;
    private Integer calories;

    @Builder.Default
    private boolean disponible = true;

    @Builder.Default
    private boolean isArchive = false;
}
