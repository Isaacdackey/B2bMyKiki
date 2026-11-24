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

    private String cutOffType; // J_MOINS_1, JOUR_J
    private String cutOffHeure;

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
