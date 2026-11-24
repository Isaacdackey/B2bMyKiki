package com.kikitraiteur.b2b.auth.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ForgotPasswordRequest {
    @NotBlank(message = "L'adresse email est obligatoire")
    @Email(message = "Adresse email invalide")
    private String email;
}
