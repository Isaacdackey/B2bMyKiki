package com.kikitraiteur.b2b.paiement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "b2b_paiements_wave")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaiementWaveEntity {
    @Id
    private String id;

    private String commandeId;
    private String entrepriseId;
    private String employeMatricule;
    private String employeNom;

    private Integer montantTotal;
    private Integer partEntreprise;
    private Integer partEmploye;

    @Column(nullable = false)
    private String statut; // EN_ATTENTE_PAIEMENT, PAYEE, ECHOUE

    @Column(nullable = false)
    private String mode; // SIMULATION, LIVE

    private String waveSessionId;
    private String waveLaunchUrl;
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;
}
