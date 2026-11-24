package com.kikitraiteur.b2b.entreprise.data.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "b2b_sites")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SiteEntity {
    @Id
    private String id;

    @Column(nullable = false)
    private String nom;

    private String adresse;
    private String heureCutOff;
    private String contactReferent;
    private String telephoneReferent;
    private String typePrestation;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "b2b_site_creneaux", joinColumns = @JoinColumn(name = "site_id"))
    @Column(name = "creneau")
    @Builder.Default
    private List<String> creneauxDisponibles = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id")
    @JsonIgnore
    private EntrepriseEntity entreprise;
}
