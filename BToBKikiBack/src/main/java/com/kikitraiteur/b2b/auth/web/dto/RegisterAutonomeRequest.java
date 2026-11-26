package com.kikitraiteur.b2b.auth.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class RegisterAutonomeRequest {
    @NotBlank
    private String prenom;
    @NotBlank
    private String nom;
    @NotBlank
    @Pattern(
        regexp = "^(\\+221[\\s-]?)?(70|75|76|77|78)[\\s-]?\\d{3}[\\s-]?\\d{2}[\\s-]?\\d{2}$",
        message = "Numéro Téléphone / Wave invalide (ex: +221 77 123 45 67)"
    )
    private String telephone;
    @Email
    private String email;
    @NotBlank
    private String siteId;
    @NotBlank
    private String password;
}
