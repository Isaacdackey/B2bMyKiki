package com.kikitraiteur.b2b.auth.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterAutonomeRequest {
    @NotBlank
    private String prenom;
    @NotBlank
    private String nom;
    @NotBlank
    private String telephone;
    @Email
    private String email;
    @NotBlank
    private String siteId;
    @NotBlank
    private String password;
}
