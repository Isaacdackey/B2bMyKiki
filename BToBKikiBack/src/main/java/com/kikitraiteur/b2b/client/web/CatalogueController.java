package com.kikitraiteur.b2b.client.web;

import com.kikitraiteur.b2b.catalogue.data.entity.PlatEntity;
import com.kikitraiteur.b2b.catalogue.service.CatalogueService;
import com.kikitraiteur.b2b.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/b2b/catalogue")
@RequiredArgsConstructor
public class CatalogueController {

    private final CatalogueService catalogueService;

    @GetMapping
    public ApiResponse<List<PlatEntity>> getAll(@RequestParam(defaultValue = "false") boolean includeArchived) {
        return ApiResponse.ok(catalogueService.findAll(includeArchived));
    }

    @PostMapping
    public ApiResponse<PlatEntity> create(@RequestBody PlatEntity plat) {
        return ApiResponse.ok("Plat ajouté au catalogue", catalogueService.create(plat));
    }

    @PutMapping("/{id}")
    public ApiResponse<PlatEntity> update(@PathVariable String id, @RequestBody PlatEntity plat) {
        return ApiResponse.ok("Plat mis à jour", catalogueService.update(id, plat));
    }

    @PatchMapping("/{id}/archive")
    public ApiResponse<PlatEntity> toggleArchive(@PathVariable String id) {
        return ApiResponse.ok("Statut archivage modifié", catalogueService.toggleArchive(id));
    }

    @PatchMapping("/{id}/disponibilite")
    public ApiResponse<PlatEntity> toggleDisponibilite(@PathVariable String id) {
        return ApiResponse.ok("Disponibilité modifiée", catalogueService.toggleDisponibilite(id));
    }
}
