package com.kikitraiteur.b2b.commande.data.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "b2b_reclamations_cutoff")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReclamationCutOffEntity {
    @Id
    private String id;

    @Column(nullable = false)
    private String entrepriseId;

    private String siteId;
    private String employeId;
    private String employeNom;
    private String matricule;
    private String departement;
    private String date; // YYYY-MM-DD
    private String heureDemande; // HH:mm

    @Column(length = 1000)
    private String motif;

    @Builder.Default
    private String statut = "EN_ATTENTE"; // EN_ATTENTE, DEBLOQUE, REFUSE

    private String debloquePar;
    private String debloqueAt;
}
