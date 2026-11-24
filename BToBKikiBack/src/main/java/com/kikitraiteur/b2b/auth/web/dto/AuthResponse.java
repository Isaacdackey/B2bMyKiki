package com.kikitraiteur.b2b.auth.web.dto;

import com.kikitraiteur.b2b.auth.entity.RoleName;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private String token;
    private String userId;
    private String email;
    private RoleName role;
    private String nomComplet;
    private String titrePoste;
    private String entite;
    private String entrepriseId;
    private String siteId;
    private String siteNom;
    private String matricule;
    private String badge;
    private String badgeColor;
}
