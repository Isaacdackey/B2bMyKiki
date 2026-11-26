package com.kikitraiteur.b2b.client.web;

import com.kikitraiteur.b2b.entreprise.data.entity.EmployeEntity;
import com.kikitraiteur.b2b.entreprise.service.EmployeService;
import com.kikitraiteur.b2b.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/b2b/employes")
@RequiredArgsConstructor
@Tag(name = "Employés & Subventions", description = "Annuaire des collaborateurs, import massif CSV/Excel et gestion des taux de prise en charge")
public class EmployeController {

    private final EmployeService employeService;

    @Operation(summary = "Lister les employés", description = "Retourne les collaborateurs (filtrés optionnellement par entrepriseId).")
    @GetMapping
    public ApiResponse<List<EmployeEntity>> getAll(@RequestParam(required = false) String entrepriseId) {
        return ApiResponse.ok(employeService.findAll(entrepriseId));
    }

    @Operation(summary = "Créer un employé", description = "Ajoute un nouveau collaborateur à l'annuaire B2B.")
    @PostMapping
    public ApiResponse<EmployeEntity> create(@RequestBody EmployeEntity emp) {
        return ApiResponse.ok("Employé enregistré", employeService.create(emp));
    }

    @Operation(summary = "Importer des employés en masse", description = "Enregistre un lot de collaborateurs importés depuis un fichier CSV/Excel.")
    @PostMapping("/import")
    public ApiResponse<List<EmployeEntity>> importBatch(@RequestBody List<EmployeEntity> employes) {
        List<EmployeEntity> saved = employeService.importBatch(employes);
        return ApiResponse.ok(saved.size() + " employé(s) importé(s)", saved);
    }

    @Operation(summary = "Modifier le taux de subvention", description = "Met à jour le taux de prise en charge (0 à 100%) d'un employé.")
    @PatchMapping("/{id}/taux")
    public ApiResponse<EmployeEntity> updateTaux(@PathVariable String id, @RequestBody Map<String, Integer> body) {
        return ApiResponse.ok("Taux mis à jour", employeService.updateTauxSubvention(id, body.get("tauxSubvention")));
    }

    @Operation(summary = "Activer / Désactiver un employé", description = "Bascule le statut actif/inactif d'un collaborateur.")
    @PatchMapping("/{id}/toggle-actif")
    public ApiResponse<EmployeEntity> toggleActif(@PathVariable String id) {
        return ApiResponse.ok("Statut employé modifié", employeService.toggleActif(id));
    }
}
