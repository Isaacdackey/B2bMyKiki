package com.kikitraiteur.b2b.client.web;

import com.kikitraiteur.b2b.commande.data.entity.ReclamationCutOffEntity;
import com.kikitraiteur.b2b.commande.service.CommandeService;
import com.kikitraiteur.b2b.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/b2b/reclamations")
@RequiredArgsConstructor
public class ReclamationController {

    private final CommandeService commandeService;

    @GetMapping
    public ApiResponse<List<ReclamationCutOffEntity>> getAll(@RequestParam(defaultValue = "ent-001") String entrepriseId) {
        return ApiResponse.ok(commandeService.findReclamations(entrepriseId));
    }

    @PostMapping
    public ApiResponse<ReclamationCutOffEntity> create(@RequestBody ReclamationCutOffEntity rec) {
        return ApiResponse.ok("Réclamation transmise", commandeService.createReclamation(rec));
    }

    @PatchMapping("/{id}/debloquer")
    public ApiResponse<ReclamationCutOffEntity> debloquer(@PathVariable String id, @RequestBody(required = false) Map<String, String> body) {
        String responsable = body != null ? body.get("responsable") : null;
        return ApiResponse.ok("Employé débloqué pour aujourd'hui", commandeService.debloquerReclamation(id, responsable));
    }
}
