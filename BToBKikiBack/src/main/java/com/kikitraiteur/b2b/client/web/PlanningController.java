package com.kikitraiteur.b2b.client.web;

import com.kikitraiteur.b2b.planning.data.entity.LigneMenuPlanifieEntity;
import com.kikitraiteur.b2b.planning.data.entity.MenuPlanifieJourEntity;
import com.kikitraiteur.b2b.planning.service.PlanningService;
import com.kikitraiteur.b2b.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/b2b/planning")
@RequiredArgsConstructor
@Tag(name = "Planning & Menus Hebdomadaires", description = "Programmation des menus par jour, duplication, reconduction et déploiement multi-entreprises")
public class PlanningController {

    private final PlanningService planningService;

    @Operation(summary = "Consulter le planning des menus", description = "Retourne les menus planifiés pour une entreprise (ou toutes les entreprises si entrepriseId omis).")
    @GetMapping
    public ApiResponse<List<MenuPlanifieJourEntity>> getByEntreprise(@RequestParam(required = false) String entrepriseId) {
        return ApiResponse.ok(planningService.findByEntreprise(entrepriseId));
    }

    @Operation(summary = "Ajouter un plat à un jour du planning", description = "Ajoute un plat du catalogue à un jour donné avec une quantité prévue.")
    @PostMapping("/ajouter-plat")
    public ApiResponse<MenuPlanifieJourEntity> ajouterPlat(@RequestBody Map<String, Object> body) {
        String entrepriseId = (String) body.getOrDefault("entrepriseId", "ent-001");
        String jourNom = (String) body.get("jourNom");
        String platId = (String) body.get("platId");
        Integer quantite = body.get("quantitePrevue") != null ? ((Number) body.get("quantitePrevue")).intValue() : 0;
        return ApiResponse.ok("Plat ajouté au planning", planningService.ajouterPlatAuJour(entrepriseId, jourNom, platId, quantite));
    }

    @Operation(summary = "Dupliquer un menu vers un autre jour", description = "Copie l'ensemble des plats d'un jour source vers un jour cible.")
    @PostMapping("/dupliquer")
    public ApiResponse<MenuPlanifieJourEntity> dupliquer(@RequestBody Map<String, String> body) {
        return ApiResponse.ok("Menu dupliqué", planningService.dupliquerJour(
                body.getOrDefault("entrepriseId", "ent-001"),
                body.get("jourSource"),
                body.get("jourCible")
        ));
    }

    @Operation(summary = "Reconduire la semaine (+7 jours)", description = "Reconduit le planning actuel sur la semaine suivante.")
    @PostMapping("/reconduire-semaine")
    public ApiResponse<List<MenuPlanifieJourEntity>> reconduire(@RequestParam(defaultValue = "ent-001") String entrepriseId) {
        return ApiResponse.ok("Semaine reconduite (+7 jours)", planningService.reconduireSemaine(entrepriseId));
    }

    @Operation(summary = "Déployer le planning global vers toutes les entreprises", description = "Synchronise le planning modèle vers chaque entreprise selon les catégories autorisées par sa convention.")
    @PostMapping("/deployer")
    public ApiResponse<Integer> deployer(@RequestParam(defaultValue = "ent-001") String sourceEntrepriseId) {
        int nb = planningService.deployerVersToutesEntreprises(sourceEntrepriseId);
        return ApiResponse.ok("Menu déployé vers " + nb + " entreprise(s)", nb);
    }

    @Operation(summary = "Mettre à jour la quantité prévue d'une ligne", description = "Modifie le nombre de portions prévues pour un plat planifié.")
    @PatchMapping("/lignes/{ligneId}/quantite")
    public ApiResponse<LigneMenuPlanifieEntity> updateQuantite(@PathVariable String ligneId, @RequestBody Map<String, Integer> body) {
        return ApiResponse.ok("Quantité mise à jour", planningService.updateQuantite(ligneId, body.get("quantitePrevue")));
    }

    @Operation(summary = "Supprimer une ligne du planning", description = "Retire un plat d'un jour du planning.")
    @DeleteMapping("/lignes/{ligneId}")
    public ApiResponse<Void> deleteLigne(@PathVariable String ligneId) {
        planningService.deleteLigne(ligneId);
        return ApiResponse.ok("Ligne supprimée", null);
    }
}
