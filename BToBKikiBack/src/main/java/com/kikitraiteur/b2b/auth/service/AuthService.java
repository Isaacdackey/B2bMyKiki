package com.kikitraiteur.b2b.auth.service;

import com.kikitraiteur.b2b.auth.entity.RoleName;
import com.kikitraiteur.b2b.auth.entity.UserEntity;
import com.kikitraiteur.b2b.auth.jwt.JwtTokenService;
import com.kikitraiteur.b2b.auth.repository.UserRepository;
import com.kikitraiteur.b2b.auth.web.dto.AuthResponse;
import com.kikitraiteur.b2b.auth.web.dto.LoginRequest;
import com.kikitraiteur.b2b.auth.web.dto.RegisterAutonomeRequest;
import com.kikitraiteur.b2b.shared.exceptions.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokenService;

    public AuthResponse login(LoginRequest request) {
        UserEntity user = userRepository.findByEmailIgnoreCase(request.getEmail())
                .orElseThrow(() -> new BusinessException("Identifiants invalides"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException("Identifiants invalides");
        }

        return buildAuthResponse(user);
    }

    public AuthResponse registerAutonome(RegisterAutonomeRequest request) {
        String email = (request.getEmail() != null && !request.getEmail().isBlank())
                ? request.getEmail()
                : request.getTelephone().replaceAll("\\s+", "") + "@autonome.kiki.sn";

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new BusinessException("Un compte existe déjà avec cet email.");
        }

        UserEntity user = UserEntity.builder()
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .nomComplet(request.getPrenom() + " " + request.getNom())
                .titrePoste("Collaborateur Autonome (Paiement Wave)")
                .entite("TotalEnergies Sénégal")
                .entrepriseId("ent-001")
                .siteId(request.getSiteId())
                .siteNom("Siège Plateau - Dakar")
                .matricule("AUTO-" + (System.currentTimeMillis() % 10000))
                .role(RoleName.SALARIE_AUTONOME)
                .badge("Autonome 0%")
                .badgeColor("#1D4ED8")
                .actif(true)
                .build();

        userRepository.save(user);
        return buildAuthResponse(user);
    }

    private AuthResponse buildAuthResponse(UserEntity user) {
        String token = jwtTokenService.generateToken(
                user.getEmail(),
                Map.of("role", user.getRole().name(), "userId", user.getId())
        );

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .role(user.getRole())
                .nomComplet(user.getNomComplet())
                .titrePoste(user.getTitrePoste())
                .entite(user.getEntite())
                .entrepriseId(user.getEntrepriseId())
                .siteId(user.getSiteId())
                .siteNom(user.getSiteNom())
                .matricule(user.getMatricule())
                .badge(user.getBadge())
                .badgeColor(user.getBadgeColor())
                .build();
    }
}
