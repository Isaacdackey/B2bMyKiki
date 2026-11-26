package com.kikitraiteur.b2b.auth.web;

import com.kikitraiteur.b2b.auth.service.AuthService;
import com.kikitraiteur.b2b.auth.web.dto.*;
import com.kikitraiteur.b2b.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentification & Comptes", description = "Connexion JWT, inscription autonome, activation d'invitation et réinitialisation de mot de passe")
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Connexion utilisateur", description = "Authentifie un utilisateur (Super Admin, RH, Admin Site ou Employé) et retourne un token JWT.")
    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok("Connexion réussie", authService.login(request));
    }

    @Operation(summary = "Inscription salarié autonome", description = "Crée un compte salarié autonome (paiement Wave direct) et retourne un JWT.")
    @PostMapping("/register-autonome")
    public ApiResponse<AuthResponse> registerAutonome(@Valid @RequestBody RegisterAutonomeRequest request) {
        return ApiResponse.ok("Compte autonome créé", authService.registerAutonome(request));
    }

    @Operation(summary = "Vérifier un jeton d'invitation", description = "Vérifie la validité du lien d'activation reçu par email par un Admin RH ou Admin Site.")
    @GetMapping("/invitation/verify")
    public ApiResponse<InvitationDetailsResponse> verifyInvitation(@RequestParam String token) {
        return ApiResponse.ok(authService.verifyInvitation(token));
    }

    @Operation(summary = "Activer un compte administrateur", description = "Définit le mot de passe d'un administrateur invité et retourne son token JWT.")
    @PostMapping("/invitation/activate")
    public ApiResponse<AuthResponse> activateInvitation(@Valid @RequestBody ActivateInvitationRequest request) {
        return ApiResponse.ok("Compte administrateur activé", authService.activateInvitation(request));
    }

    @Operation(summary = "Demander une réinitialisation de mot de passe", description = "Envoie un lien sécurisé par email via Brevo pour réinitialiser le mot de passe.")
    @PostMapping("/forgot-password")
    public ApiResponse<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ApiResponse.ok("Si un compte existe avec cette adresse email, un lien de réinitialisation vient d'être envoyé.", null);
    }

    @Operation(summary = "Vérifier un jeton de réinitialisation", description = "Vérifie si le token de réinitialisation de mot de passe est valide et non expiré.")
    @GetMapping("/reset-password/verify")
    public ApiResponse<Map<String, String>> verifyResetToken(@RequestParam String token) {
        return ApiResponse.ok(authService.verifyResetToken(token));
    }

    @Operation(summary = "Réinitialiser le mot de passe", description = "Met à jour le mot de passe à partir d'un jeton de réinitialisation valide.")
    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ApiResponse.ok("Mot de passe réinitialisé avec succès.", null);
    }
}
