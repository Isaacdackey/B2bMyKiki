package com.kikitraiteur.b2b.entreprise.data.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "b2b_entreprises")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EntrepriseEntity {
    @Id
    private String id;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false, unique = true)
    private String codeEntreprise;

    private String ninea;
    private String rccm;
    private String adresse;
    private String emailContact;
    private String telephone;
    private String contactReferent;

    private Integer montantPriseEnChargeRepas;
    private Integer tauxPriseEnCharge;
    private Integer plafondJournalier;
    private Long budgetMensuelAlloue;
    private Integer tarifNegocieHtva;
    private String cadenceFacturation; // HEBDOMADAIRE, MENSUELLE, BIMESTRIELLE

    private String cutOffType; // JOUR_J (0), J_MOINS_1 (1), J_MOINS_2 (2), J_MOINS_N (N)...

    @Transient
    private Integer cutOffJoursAvant; // 0 = Jour J, 1 = 1 jour avant, 2 = 2 jours avant...

    private String cutOffHeure;

    @JsonProperty("cutOffJoursAvant")
    public Integer getCutOffJoursAvant() {
        return resolveCutOffJoursAvant();
    }

    @JsonProperty("cutOffJoursAvant")
    public void setCutOffJoursAvant(Integer jours) {
        this.cutOffJoursAvant = jours;
        if (jours != null && jours >= 0 && !"SANS_CUTOFF".equalsIgnoreCase(this.cutOffType)) {
            this.cutOffType = (jours == 0) ? "JOUR_J" : ("J_MOINS_" + jours);
        }
    }

    public int resolveCutOffJoursAvant() {
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

    private String typePrestation;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "b2b_entreprise_categories", joinColumns = @JoinColumn(name = "entreprise_id"))
    @Column(name = "categorie")
    @Builder.Default
    private List<String> categoriesAutorisees = new ArrayList<>();

    @Builder.Default
    @JsonProperty("isArchivee")
    private boolean isArchivee = false;

    @OneToMany(mappedBy = "entreprise", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<SiteEntity> sites = new ArrayList<>();
}
