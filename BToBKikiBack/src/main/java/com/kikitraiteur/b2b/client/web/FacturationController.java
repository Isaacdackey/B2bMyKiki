package com.kikitraiteur.b2b.client.web;

import com.kikitraiteur.b2b.commande.data.entity.CommandeSiteEntity;
import com.kikitraiteur.b2b.facturation.data.entity.FacturationJournaliereEntity;
import com.kikitraiteur.b2b.facturation.service.FacturationService;
import com.kikitraiteur.b2b.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/b2b/facturation")
@RequiredArgsConstructor
@Tag(name = "Facturation & Relevés", description = "Relevés journaliers et détails nominatifs de facturation B2B")
public class FacturationController {

    private final FacturationService facturationService;

    @Operation(summary = "Relevé de facturation d'une entreprise", description = "Retourne les lignes journalières de facturation (part entreprise, part employé, total).")
    @GetMapping
    public ApiResponse<List<FacturationJournaliereEntity>> getByEntreprise(@RequestParam(defaultValue = "ent-001") String entrepriseId) {
        return ApiResponse.ok(facturationService.findByEntreprise(entrepriseId));
    }

    @Operation(summary = "Détail nominatif d'une journée", description = "Retourne le détail des commandes d'une entreprise pour une date donnée.")
    @GetMapping("/details")
    public ApiResponse<List<CommandeSiteEntity>> getDetailsJour(
            @RequestParam(defaultValue = "ent-001") String entrepriseId,
            @RequestParam String date) {
        return ApiResponse.ok(facturationService.findDetailsJour(entrepriseId, date));
    }
}
