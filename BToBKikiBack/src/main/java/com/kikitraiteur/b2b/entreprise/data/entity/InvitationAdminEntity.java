package com.kikitraiteur.b2b.entreprise.data.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "b2b_invitations_admin")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvitationAdminEntity {
    @Id
    private String id;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String nomComplet;

    private String role; // RESPONSABLE_ENTREPRISE, RESPONSABLE_SITE_KIKI
    private String roleLibelle;
    private String entrepriseId;
    private String entrepriseNom;
    private String dateEnvoi;
    private String tokenActivation;
    private String statut; // EN_ATTENTE, ACTIVE
}
