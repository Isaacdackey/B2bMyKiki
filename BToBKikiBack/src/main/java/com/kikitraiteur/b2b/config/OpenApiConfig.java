package com.kikitraiteur.b2b.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "API Kiki Traiteur B2B",
                version = "1.0.0",
                description = "API REST de la plateforme de restauration d'entreprise Kiki Traiteur B2B : "
                        + "authentification JWT, conventions multi-sites, catalogue des chefs, planning hebdomadaire, "
                        + "commandes & QR codes de retrait, relances RH, facturation et paiement Wave.",
                contact = @Contact(name = "Équipe Technique Kiki Traiteur", email = "noreply@kikitraiteur.sn")
        ),
        servers = {
                @Server(url = "https://b2bmykiki.onrender.com", description = "Production Render"),
                @Server(url = "http://localhost:8080", description = "Développement Local")
        },
        security = @SecurityRequirement(name = "bearerAuth")
)
@SecurityScheme(
        name = "bearerAuth",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT",
        description = "Saisissez le token JWT retourné par POST /api/v1/auth/login (sans le préfixe 'Bearer ')."
)
public class OpenApiConfig {
}
