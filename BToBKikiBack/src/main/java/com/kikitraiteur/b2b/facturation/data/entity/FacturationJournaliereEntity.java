package com.kikitraiteur.b2b.facturation.data.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "b2b_facturation_journaliere")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FacturationJournaliereEntity {
    @Id
    private String id;

    private String entrepriseId;
    private String date; // YYYY-MM-DD
    private String dateAffichee;
    private Integer nbPlatsLivres;
    private Integer nbPresents;
    private Integer montantTotal;
    private Integer montantPartEntreprise;
    private Integer montantPartEmploye;

    @Builder.Default
    private String statut = "EN_COURS"; // FACTURE, EN_COURS, VALIDE
}
