package com.kikitraiteur.b2b.entreprise.data.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
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

    private String cutOffType; // J_MOINS_1, JOUR_J, J_MOINS_2, SANS_CUTOFF
    private String cutOffHeure; // ex: 18:00, 10:30

    @Column(length = 500)
    private String reglesCutOff;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "b2b_prestation_jours_dispo", joinColumns = @JoinColumn(name = "prestation_code"))
    @Column(name = "jour")
    @Builder.Default
    private List<String> joursDisponibles = new ArrayList<>();

    @Builder.Default
    @JsonProperty("isArchive")
    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean isArchive = false;
}
