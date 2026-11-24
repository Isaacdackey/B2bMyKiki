package com.kikitraiteur.b2b.entreprise.data.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "b2b_employes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeEntity {
    @Id
    private String id;

    @Column(nullable = false, unique = true)
    private String matricule;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String prenom;

    private String email;
    private String telephone;
    private String entrepriseId;
    private String siteId;
    private String siteNom;
    private String departement;

    private String type; // SUBVENTIONNE, AUTONOME
    private Integer tauxSubvention; // 0..100

    @Builder.Default
    private boolean actif = true;

    @Builder.Default
    private Integer repasConsommesMois = 0;

    @Builder.Default
    private Integer montantPrisEnChargeMois = 0;
}
