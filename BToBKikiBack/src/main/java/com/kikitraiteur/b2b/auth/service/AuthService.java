package com.kikitraiteur.b2b.auth.service;

import com.kikitraiteur.b2b.auth.entity.PasswordResetTokenEntity;
import com.kikitraiteur.b2b.auth.entity.RoleName;
import com.kikitraiteur.b2b.auth.entity.UserEntity;
import com.kikitraiteur.b2b.auth.jwt.JwtTokenService;
import com.kikitraiteur.b2b.auth.repository.PasswordResetTokenRepository;
import com.kikitraiteur.b2b.auth.repository.UserRepository;
import com.kikitraiteur.b2b.auth.web.dto.*;
import com.kikitraiteur.b2b.entreprise.data.entity.InvitationAdminEntity;
import com.kikitraiteur.b2b.entreprise.data.repository.InvitationAdminRepository;
import com.kikitraiteur.b2b.shared.exceptions.BusinessException;
import com.kikitraiteur.b2b.shared.exceptions.ResourceNotFoundException;
import com.kikitraiteur.b2b.shared.mail.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final InvitationAdminRepository invitationRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokenService;
    private final EmailService emailService;

    @Value("${app.frontend.url:https://btob-kiki.vercel.app}")
    private String frontendUrl;

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

    public InvitationDetailsResponse verifyInvitation(String token) {
        if (token == null || token.isBlank()) {
            throw new BusinessException("Token d'activation manquant.");
        }
        InvitationAdminEntity inv = invitationRepository.findByTokenActivation(token.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Lien d'activation invalide ou expiré."));

        if ("ACTIVE".equalsIgnoreCase(inv.getStatut())) {
            throw new BusinessException("Ce compte administrateur a déjà été activé. Connectez-vous avec vos identifiants.");
        }

        return InvitationDetailsResponse.builder()
                .email(inv.getEmail())
                .nomComplet(inv.getNomComplet())
                .role(inv.getRole())
                .roleLibelle(inv.getRoleLibelle())
                .entrepriseId(inv.getEntrepriseId())
                .entrepriseNom(inv.getEntrepriseNom())
                .statut(inv.getStatut())
                .build();
    }

    @Transactional
    public AuthResponse activateInvitation(ActivateInvitationRequest request) {
        InvitationAdminEntity inv = invitationRepository.findByTokenActivation(request.getToken().trim())
                .orElseThrow(() -> new ResourceNotFoundException("Lien d'activation invalide ou expiré."));

        if ("ACTIVE".equalsIgnoreCase(inv.getStatut())) {
            throw new BusinessException("Ce compte administrateur a déjà été activé.");
        }

        RoleName roleName;
        String badge;
        String badgeColor;
        String titrePoste;
        if ("RESPONSABLE_SITE_KIKI".equalsIgnoreCase(inv.getRole())) {
            roleName = RoleName.RESPONSABLE_SITE_KIKI;
            badge = "Exploitation & Cantine";
            badgeColor = "#C05621";
            titrePoste = "Responsable de Site Kiki";
        } else if ("SALARIE_CONVENTIONNE".equalsIgnoreCase(inv.getRole())) {
            roleName = RoleName.SALARIE_CONVENTIONNE;
            badge = "Subventionné";
            badgeColor = "#2E7D32";
            titrePoste = "Salarié Conventionné";
        } else if ("SALARIE_AUTONOME".equalsIgnoreCase(inv.getRole())) {
            roleName = RoleName.SALARIE_AUTONOME;
            badge = "Autonome 0%";
            badgeColor = "#1D4ED8";
            titrePoste = "Salarié Autonome";
        } else {
            roleName = RoleName.RESPONSABLE_ENTREPRISE;
            badge = "Admin RH";
            badgeColor = "#721513";
            titrePoste = "Responsable de l'Entreprise (RH)";
        }

        String nomComplet = (request.getNomComplet() != null && !request.getNomComplet().isBlank())
                ? request.getNomComplet().trim()
                : inv.getNomComplet();

        UserEntity user = userRepository.findByEmailIgnoreCase(inv.getEmail())
                .orElseGet(UserEntity::new);

        user.setEmail(inv.getEmail().trim().toLowerCase());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setNomComplet(nomComplet);
        user.setTitrePoste(titrePoste);
        user.setEntite(inv.getEntrepriseNom());
        user.setEntrepriseId(inv.getEntrepriseId());
        user.setSiteId("site-" + inv.getEntrepriseId());
        user.setSiteNom(inv.getEntrepriseNom());
        if (user.getMatricule() == null || user.getMatricule().isBlank()) {
            user.setMatricule((roleName == RoleName.RESPONSABLE_SITE_KIKI ? "KIKI-" : "RH-") + (System.currentTimeMillis() % 10000));
        }
        user.setRole(roleName);
        user.setBadge(badge);
        user.setBadgeColor(badgeColor);
        user.setActif(true);

        UserEntity savedUser = userRepository.save(user);

        inv.setStatut("ACTIVE");
        inv.setNomComplet(nomComplet);
        invitationRepository.save(inv);

        return buildAuthResponse(savedUser);
    }

    public void forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        userRepository.findByEmailIgnoreCase(email).ifPresent(user -> {
            if (!user.isActif()) {
                return;
            }
            String token = UUID.randomUUID().toString().replace("-", "");
            PasswordResetTokenEntity resetToken = PasswordResetTokenEntity.builder()
                    .token(token)
                    .email(user.getEmail())
                    .expiresAt(LocalDateTime.now().plusMinutes(30))
                    .used(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            passwordResetTokenRepository.save(resetToken);

            String base = (frontendUrl != null && !frontendUrl.isBlank() && !frontendUrl.contains("localhost"))
                    ? frontendUrl.replaceAll("/+$", "")
                    : "https://btob-kiki.vercel.app";
            String resetUrl = base + "/b2b/reset-password?token=" + URLEncoder.encode(token, StandardCharsets.UTF_8);
            emailService.sendPasswordResetEmail(user.getEmail(), user.getNomComplet(), resetUrl);
        });
    }

    public Map<String, String> verifyResetToken(String token) {
        if (token == null || token.isBlank()) {
            throw new BusinessException("Token de réinitialisation manquant.");
        }
        PasswordResetTokenEntity resetToken = passwordResetTokenRepository.findByToken(token.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Lien de réinitialisation invalide."));

        if (resetToken.isUsed() || resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Ce lien de réinitialisation a expiré ou a déjà été utilisé.");
        }

        return Map.of("email", resetToken.getEmail());
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetTokenEntity resetToken = passwordResetTokenRepository.findByToken(request.getToken().trim())
                .orElseThrow(() -> new ResourceNotFoundException("Lien de réinitialisation invalide."));

        if (resetToken.isUsed() || resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Ce lien de réinitialisation a expiré ou a déjà été utilisé.");
        }

        UserEntity user = userRepository.findByEmailIgnoreCase(resetToken.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Compte utilisateur introuvable."));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);
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
