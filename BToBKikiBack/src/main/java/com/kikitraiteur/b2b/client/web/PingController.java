package com.kikitraiteur.b2b.client.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@Tag(name = "Healthcheck & Keep-Alive", description = "Endpoints légers de santé pour Render et Neon")
public class PingController {

    private final JdbcTemplate jdbcTemplate;

    @Operation(summary = "Ping applicatif (Render)", description = "Vérifie que l'instance Spring Boot répond sans interroger la base.")
    @GetMapping("/api/ping")
    public String ping() {
        return "ok";
    }

    @Operation(summary = "Ping base de données (Neon)", description = "Exécute SELECT 1 pour vérifier la connectivité PostgreSQL Neon.")
    @GetMapping("/api/ping/db")
    public String pingDb() {
        Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
        return (result != null && result == 1) ? "db-ok" : "db-error";
    }
}
