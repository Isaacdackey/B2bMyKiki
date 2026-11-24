package com.kikitraiteur.b2b.entreprise.data.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "b2b_categories_plat")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoriePlatEntity {
    @Id
    private String code;

    @Column(nullable = false)
    private String libelle;

    private String icone;
    private String couleur;
}
