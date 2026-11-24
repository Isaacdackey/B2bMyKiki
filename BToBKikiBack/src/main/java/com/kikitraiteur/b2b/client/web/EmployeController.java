package com.kikitraiteur.b2b.client.web;

import com.kikitraiteur.b2b.entreprise.data.entity.EmployeEntity;
import com.kikitraiteur.b2b.entreprise.service.EmployeService;
import com.kikitraiteur.b2b.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/b2b/employes")
@RequiredArgsConstructor
public class EmployeController {

    private final EmployeService employeService;

    @GetMapping
    public ApiResponse<List<EmployeEntity>> getAll(@RequestParam(required = false) String entrepriseId) {
        return ApiResponse.ok(employeService.findAll(entrepriseId));
    }

    @PostMapping
    public ApiResponse<EmployeEntity> create(@RequestBody EmployeEntity emp) {
        return ApiResponse.ok("Employé enregistré", employeService.create(emp));
    }

    @PostMapping("/import")
    public ApiResponse<List<EmployeEntity>> importBatch(@RequestBody List<EmployeEntity> employes) {
        List<EmployeEntity> saved = employeService.importBatch(employes);
        return ApiResponse.ok(saved.size() + " employé(s) importé(s)", saved);
    }

    @PatchMapping("/{id}/taux")
    public ApiResponse<EmployeEntity> updateTaux(@PathVariable String id, @RequestBody Map<String, Integer> body) {
        return ApiResponse.ok("Taux mis à jour", employeService.updateTauxSubvention(id, body.get("tauxSubvention")));
    }

    @PatchMapping("/{id}/toggle-actif")
    public ApiResponse<EmployeEntity> toggleActif(@PathVariable String id) {
        return ApiResponse.ok("Statut employé modifié", employeService.toggleActif(id));
    }
}
