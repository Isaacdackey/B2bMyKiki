package com.kikitraiteur.b2b.client.web;

import com.kikitraiteur.b2b.commande.data.entity.CommandeSiteEntity;
import com.kikitraiteur.b2b.commande.service.CommandeService;
import com.kikitraiteur.b2b.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/b2b/commandes")
@RequiredArgsConstructor
@Tag(name = "Commandes & QR Retrait", description = "Prise de commande, validation cut-off, scan QR cantine et remise des repas")
public class CommandeController {

    private final CommandeService commandeService;

    @Operation(summary = "Lister les commandes d'une entreprise", description = "Retourne les commandes du site filtrées optionnellement par date.")
    @GetMapping
    public ApiResponse<List<CommandeSiteEntity>> getAll(
            @RequestParam(defaultValue = "ent-001") String entrepriseId,
            @RequestParam(required = false) String date) {
        return ApiResponse.ok(commandeService.findCommandes(entrepriseId, date));
    }

    @Operation(summary = "Créer ou mettre à jour une commande", description = "Enregistre une commande (valide le cut-off et les catégories autorisées côté serveur).")
    @PostMapping
    public ApiResponse<CommandeSiteEntity> create(@RequestBody CommandeSiteEntity cmd) {
        return ApiResponse.ok("Commande enregistrée", commandeService.createCommande(cmd));
    }

    @Operation(summary = "Scanner le QR Code d'une commande", description = "Passe le statut de la commande à SCANNE (À livrer au comptoir).")
    @PatchMapping("/{id}/scanner")
    public ApiResponse<CommandeSiteEntity> scanner(@PathVariable String id) {
        return ApiResponse.ok("QR Cantine scanné", commandeService.scannerCommande(id));
    }

    @Operation(summary = "Marquer une commande comme livrée", description = "Passe le statut de la commande de SCANNE à LIVRE.")
    @PatchMapping("/{id}/livrer")
    public ApiResponse<CommandeSiteEntity> livrer(@PathVariable String id) {
        return ApiResponse.ok("Commande marquée livrée", commandeService.marquerLivree(id));
    }
}
