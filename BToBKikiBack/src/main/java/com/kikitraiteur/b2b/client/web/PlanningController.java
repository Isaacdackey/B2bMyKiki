package com.kikitraiteur.b2b.client.web;

import com.kikitraiteur.b2b.planning.data.entity.LigneMenuPlanifieEntity;
import com.kikitraiteur.b2b.planning.data.entity.MenuPlanifieJourEntity;
import com.kikitraiteur.b2b.planning.service.PlanningService;
import com.kikitraiteur.b2b.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/b2b/planning")
@RequiredArgsConstructor
public class PlanningController {

    private final PlanningService planningService;

    @GetMapping
    public ApiResponse<List<MenuPlanifieJourEntity>> getByEntreprise(@RequestParam(required = false) String entrepriseId) {
        return ApiResponse.ok(planningService.findByEntreprise(entrepriseId));
    }

    @PostMapping("/ajouter-plat")
    public ApiResponse<MenuPlanifieJourEntity> ajouterPlat(@RequestBody Map<String, Object> body) {
        String entrepriseId = (String) body.getOrDefault("entrepriseId", "ent-001");
        String jourNom = (String) body.get("jourNom");
        String platId = (String) body.get("platId");
        Integer quantite = body.get("quantitePrevue") != null ? ((Number) body.get("quantitePrevue")).intValue() : 0;
        return ApiResponse.ok("Plat ajouté au planning", planningService.ajouterPlatAuJour(entrepriseId, jourNom, platId, quantite));
    }

    @PostMapping("/dupliquer")
    public ApiResponse<MenuPlanifieJourEntity> dupliquer(@RequestBody Map<String, String> body) {
        return ApiResponse.ok("Menu dupliqué", planningService.dupliquerJour(
                body.getOrDefault("entrepriseId", "ent-001"),
                body.get("jourSource"),
                body.get("jourCible")
        ));
    }

    @PostMapping("/reconduire-semaine")
    public ApiResponse<List<MenuPlanifieJourEntity>> reconduire(@RequestParam(defaultValue = "ent-001") String entrepriseId) {
        return ApiResponse.ok("Semaine reconduite (+7 jours)", planningService.reconduireSemaine(entrepriseId));
    }

    @PostMapping("/deployer")
    public ApiResponse<Integer> deployer(@RequestParam(defaultValue = "ent-001") String sourceEntrepriseId) {
        int nb = planningService.deployerVersToutesEntreprises(sourceEntrepriseId);
        return ApiResponse.ok("Menu déployé vers " + nb + " entreprise(s)", nb);
    }

    @PatchMapping("/lignes/{ligneId}/quantite")
    public ApiResponse<LigneMenuPlanifieEntity> updateQuantite(@PathVariable String ligneId, @RequestBody Map<String, Integer> body) {
        return ApiResponse.ok("Quantité mise à jour", planningService.updateQuantite(ligneId, body.get("quantitePrevue")));
    }

    @DeleteMapping("/lignes/{ligneId}")
    public ApiResponse<Void> deleteLigne(@PathVariable String ligneId) {
        planningService.deleteLigne(ligneId);
        return ApiResponse.ok("Ligne supprimée", null);
    }
}
