package com.kikitraiteur.b2b.commande.data.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "b2b_commandes_site")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommandeSiteEntity {
    @Id
    private String id;

    @Column(nullable = false)
    private String codeCommande;

    @Column(nullable = false)
    private String entrepriseId;

    private String entrepriseNom;
    private String siteId;
    private String siteNom;
    private String matricule;
    private String employeNom;
    private String categorie; // ENTREE, PLAT, GARNITURE, DESSERT, BOISSON
    private String platNom;
    private String date; // YYYY-MM-DD
    private String heure; // HH:mm
    private Integer montantTotal;
    private Integer partEntreprise;
    private Integer partEmploye;
    private Integer tauxSubventionApplique; // Taux historique a la date T

    @Builder.Default
    private String statut = "EN_COURS"; // EN_COURS, SCANNE, LIVRE

    private String scanneAt;
    private String livreAt;
    private String qrCode;
}
