package com.kikitraiteur.b2b.entreprise.data.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "b2b_types_prestation")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TypePrestationEntity {
    @Id
    private String code;

    @Column(nullable = false)
    private String libelle;

    @Column(name = "description_texte", length = 500)
    private String desc;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "b2b_prestation_categories_defaut", joinColumns = @JoinColumn(name = "prestation_code"))
    @Column(name = "categorie")
    @Builder.Default
    private List<String> categoriesDefaut = new ArrayList<>();
}
