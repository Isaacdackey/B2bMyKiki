package com.kikitraiteur.b2b.client.web;

import com.kikitraiteur.b2b.commande.data.entity.CommandeSiteEntity;
import com.kikitraiteur.b2b.facturation.data.entity.FacturationJournaliereEntity;
import com.kikitraiteur.b2b.facturation.service.FacturationService;
import com.kikitraiteur.b2b.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/b2b/facturation")
@RequiredArgsConstructor
public class FacturationController {

    private final FacturationService facturationService;

    @GetMapping
    public ApiResponse<List<FacturationJournaliereEntity>> getByEntreprise(@RequestParam(defaultValue = "ent-001") String entrepriseId) {
        return ApiResponse.ok(facturationService.findByEntreprise(entrepriseId));
    }

    @GetMapping("/details")
    public ApiResponse<List<CommandeSiteEntity>> getDetailsJour(
            @RequestParam(defaultValue = "ent-001") String entrepriseId,
            @RequestParam String date) {
        return ApiResponse.ok(facturationService.findDetailsJour(entrepriseId, date));
    }
}
