package com.kikitraiteur.b2b.client.web;

import com.kikitraiteur.b2b.commande.data.entity.CommandeSiteEntity;
import com.kikitraiteur.b2b.commande.service.CommandeService;
import com.kikitraiteur.b2b.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/b2b/commandes")
@RequiredArgsConstructor
public class CommandeController {

    private final CommandeService commandeService;

    @GetMapping
    public ApiResponse<List<CommandeSiteEntity>> getAll(
            @RequestParam(defaultValue = "ent-001") String entrepriseId,
            @RequestParam(required = false) String date) {
        return ApiResponse.ok(commandeService.findCommandes(entrepriseId, date));
    }

    @PostMapping
    public ApiResponse<CommandeSiteEntity> create(@RequestBody CommandeSiteEntity cmd) {
        return ApiResponse.ok("Commande enregistrée", commandeService.createCommande(cmd));
    }

    @PatchMapping("/{id}/scanner")
    public ApiResponse<CommandeSiteEntity> scanner(@PathVariable String id) {
        return ApiResponse.ok("QR Cantine scanné", commandeService.scannerCommande(id));
    }

    @PatchMapping("/{id}/livrer")
    public ApiResponse<CommandeSiteEntity> livrer(@PathVariable String id) {
        return ApiResponse.ok("Commande marquée livrée", commandeService.marquerLivree(id));
    }
}
