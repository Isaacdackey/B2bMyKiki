package com.kikitraiteur.b2b.client.web;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class PingController {

    private final JdbcTemplate jdbcTemplate;

    @GetMapping("/api/ping")
    public String ping() {
        return "ok";
    }

    @GetMapping("/api/ping/db")
    public String pingDb() {
        Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
        return (result != null && result == 1) ? "db-ok" : "db-error";
    }
}
