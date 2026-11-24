package com.kikitraiteur.b2b.auth.web.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class InvitationDetailsResponse {
    private String email;
    private String nomComplet;
    private String role;
    private String roleLibelle;
    private String entrepriseId;
    private String entrepriseNom;
    private String statut;
}
