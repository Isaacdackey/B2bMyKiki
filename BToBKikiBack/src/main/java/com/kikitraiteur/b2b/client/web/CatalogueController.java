package com.kikitraiteur.b2b.client.web;

import com.kikitraiteur.b2b.catalogue.data.entity.PlatEntity;
import com.kikitraiteur.b2b.catalogue.service.CatalogueService;
import com.kikitraiteur.b2b.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/b2b/catalogue")
@RequiredArgsConstructor
@Tag(name = "Catalogue des Chefs", description = "Gestion des plats, entrées, garnitures, desserts et boissons du catalogue global")
public class CatalogueController {

    private final CatalogueService catalogueService;

    @Operation(summary = "Lister les plats du catalogue", description = "Retourne tous les plats actifs (ou incluant les archivés si includeArchived=true).")
    @GetMapping
    public ApiResponse<List<PlatEntity>> getAll(@RequestParam(defaultValue = "false") boolean includeArchived) {
        return ApiResponse.ok(catalogueService.findAll(includeArchived));
    }

    @Operation(summary = "Ajouter un plat au catalogue", description = "Crée un nouveau plat dans le catalogue global (Super Admin ou Admin Site).")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'RESPONSABLE_SITE_KIKI')")
    @PostMapping
    public ApiResponse<PlatEntity> create(@RequestBody PlatEntity plat) {
        return ApiResponse.ok("Plat ajouté au catalogue", catalogueService.create(plat));
    }

    @Operation(summary = "Modifier un plat", description = "Met à jour les informations d'un plat existant.")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'RESPONSABLE_SITE_KIKI')")
    @PutMapping("/{id}")
    public ApiResponse<PlatEntity> update(@PathVariable String id, @RequestBody PlatEntity plat) {
        return ApiResponse.ok("Plat mis à jour", catalogueService.update(id, plat));
    }

    @Operation(summary = "Archiver / Désarchiver un plat", description = "Bascule le statut d'archivage d'un plat.")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'RESPONSABLE_SITE_KIKI')")
    @PatchMapping("/{id}/archive")
    public ApiResponse<PlatEntity> toggleArchive(@PathVariable String id) {
        return ApiResponse.ok("Statut archivage modifié", catalogueService.toggleArchive(id));
    }

    @Operation(summary = "Changer la disponibilité d'un plat", description = "Active ou désactive la disponibilité d'un plat sur le menu.")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'RESPONSABLE_SITE_KIKI')")
    @PatchMapping("/{id}/disponibilite")
    public ApiResponse<PlatEntity> toggleDisponibilite(@PathVariable String id) {
        return ApiResponse.ok("Disponibilité modifiée", catalogueService.toggleDisponibilite(id));
    }
}
