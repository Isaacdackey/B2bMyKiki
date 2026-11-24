package com.kikitraiteur.b2b.auth.web;

import com.kikitraiteur.b2b.auth.service.AuthService;
import com.kikitraiteur.b2b.auth.web.dto.AuthResponse;
import com.kikitraiteur.b2b.auth.web.dto.LoginRequest;
import com.kikitraiteur.b2b.auth.web.dto.RegisterAutonomeRequest;
import com.kikitraiteur.b2b.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

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
}
