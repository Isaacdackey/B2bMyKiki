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

    @Transient
    private Integer cutOffJoursAvant; // 0 = Jour J, 1 = J-1, 2 = J-2...

    private String cutOffHeure; // ex: 18:00, 10:30

    @JsonProperty("cutOffJoursAvant")
    public Integer getCutOffJoursAvant() {
        if (cutOffJoursAvant != null && cutOffJoursAvant >= 0) {
            return cutOffJoursAvant;
        }
        if (cutOffType == null || cutOffType.isBlank()) {
            return 1;
        }
        String t = cutOffType.trim().toUpperCase();
        if ("JOUR_J".equals(t) || "0".equals(t)) return 0;
        if (t.startsWith("J_MOINS_")) {
            try {
                return Math.max(0, Integer.parseInt(t.substring("J_MOINS_".length()).trim()));
            } catch (NumberFormatException ignored) {
                return 1;
            }
        }
        try {
            return Math.max(0, Integer.parseInt(t));
        } catch (NumberFormatException ignored) {
            return 1;
        }
    }

    @JsonProperty("cutOffJoursAvant")
    public void setCutOffJoursAvant(Integer jours) {
        this.cutOffJoursAvant = jours;
        if (jours != null && jours >= 0 && !"SANS_CUTOFF".equalsIgnoreCase(this.cutOffType)) {
            this.cutOffType = (jours == 0) ? "JOUR_J" : ("J_MOINS_" + jours);
        }
    }

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
    private Boolean isArchive = false;

    public boolean isArchive() {
        return Boolean.TRUE.equals(isArchive);
    }

    public void setArchive(Boolean isArchive) {
        this.isArchive = Boolean.TRUE.equals(isArchive);
    }
}
