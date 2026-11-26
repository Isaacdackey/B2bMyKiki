package com.kikitraiteur.b2b.client.web;

import com.kikitraiteur.b2b.commande.data.entity.ReclamationCutOffEntity;
import com.kikitraiteur.b2b.commande.service.CommandeService;
import com.kikitraiteur.b2b.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/b2b/reclamations")
@RequiredArgsConstructor
@Tag(name = "Réclamations Cut-Off", description = "Demandes de déblocage après dépassement d'heure limite et validation par l'Admin Site")
public class ReclamationController {

    private final CommandeService commandeService;

    @Operation(summary = "Lister les réclamations", description = "Retourne les réclamations cut-off d'une entreprise ou de toutes les entreprises.")
    @GetMapping
    public ApiResponse<List<ReclamationCutOffEntity>> getAll(@RequestParam(required = false) String entrepriseId) {
        return ApiResponse.ok(commandeService.findReclamations(entrepriseId));
    }

    @Operation(summary = "Soumettre une réclamation cut-off", description = "Permet à un employé de demander un déblocage exceptionnel après l'heure limite.")
    @PostMapping
    public ApiResponse<ReclamationCutOffEntity> create(@RequestBody ReclamationCutOffEntity rec) {
        return ApiResponse.ok("Réclamation transmise", commandeService.createReclamation(rec));
    }

    @Operation(summary = "Débloquer un employé", description = "Approuve une réclamation cut-off pour autoriser la commande du jour.")
    @PatchMapping("/{id}/debloquer")
    public ApiResponse<ReclamationCutOffEntity> debloquer(@PathVariable String id, @RequestBody(required = false) Map<String, String> body) {
        String responsable = body != null ? body.get("responsable") : null;
        return ApiResponse.ok("Employé débloqué pour aujourd'hui", commandeService.debloquerReclamation(id, responsable));
    }
}
