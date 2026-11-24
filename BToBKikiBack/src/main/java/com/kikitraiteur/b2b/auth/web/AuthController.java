package com.kikitraiteur.b2b.auth.web;

import com.kikitraiteur.b2b.auth.service.AuthService;
import com.kikitraiteur.b2b.auth.web.dto.*;
import com.kikitraiteur.b2b.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok("Connexion réussie", authService.login(request));
    }

    @PostMapping("/register-autonome")
    public ApiResponse<AuthResponse> registerAutonome(@Valid @RequestBody RegisterAutonomeRequest request) {
        return ApiResponse.ok("Compte autonome créé", authService.registerAutonome(request));
    }

    @GetMapping("/invitation/verify")
    public ApiResponse<InvitationDetailsResponse> verifyInvitation(@RequestParam String token) {
        return ApiResponse.ok(authService.verifyInvitation(token));
    }

    @PostMapping("/invitation/activate")
    public ApiResponse<AuthResponse> activateInvitation(@Valid @RequestBody ActivateInvitationRequest request) {
        return ApiResponse.ok("Compte administrateur activé", authService.activateInvitation(request));
    }

    @PostMapping("/forgot-password")
    public ApiResponse<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ApiResponse.ok("Si un compte existe avec cette adresse email, un lien de réinitialisation vient d'être envoyé.", null);
    }

    @GetMapping("/reset-password/verify")
    public ApiResponse<Map<String, String>> verifyResetToken(@RequestParam String token) {
        return ApiResponse.ok(authService.verifyResetToken(token));
    }

    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ApiResponse.ok("Mot de passe réinitialisé avec succès.", null);
    }
}
