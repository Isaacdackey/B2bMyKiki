package com.kikitraiteur.b2b.auth.bootstrap;

import com.kikitraiteur.b2b.auth.entity.RoleName;
import com.kikitraiteur.b2b.auth.entity.UserEntity;
import com.kikitraiteur.b2b.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Initialise uniquement le compte Super Admin si absent de la base de données.
 * Aucune autre donnée (entreprises, employés, plats) n'est insérée automatiquement.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SuperAdminBootstrap implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.bootstrap.super-admin.email:admin@kikitraiteur.sn}")
    private String superAdminEmail;

    @Value("${app.bootstrap.super-admin.password:}")
    private String superAdminPassword;

    @Value("${app.bootstrap.super-admin.nom:Direction Kiki Traiteur}")
    private String superAdminNom;

    @Override
    public void run(ApplicationArguments args) {
        if (superAdminEmail == null || superAdminEmail.isBlank()) {
            return;
        }
        String email = superAdminEmail.trim().toLowerCase();
        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            log.info("Bootstrap Super Admin : compte {} déjà présent.", email);
            return;
        }
        if (superAdminPassword == null || superAdminPassword.isBlank()) {
            log.warn("Bootstrap Super Admin ignoré : APP_BOOTSTRAP_ADMIN_PASSWORD non défini.");
            return;
        }

        UserEntity admin = UserEntity.builder()
                .email(email)
                .password(passwordEncoder.encode(superAdminPassword.trim()))
                .nomComplet(superAdminNom != null && !superAdminNom.isBlank() ? superAdminNom.trim() : "Direction Kiki Traiteur")
                .titrePoste("Super Admin Kiki (Global)")
                .entite("Kiki Traiteur B2B")
                .siteId("site-1")
                .siteNom("Siège Plateau - Dakar")
                .role(RoleName.SUPER_ADMIN)
                .badge("Direction Générale")
                .badgeColor("#721513")
                .actif(true)
                .build();

        userRepository.save(admin);
        log.info("Bootstrap Super Admin créé avec succès pour {}", email);
    }
}
