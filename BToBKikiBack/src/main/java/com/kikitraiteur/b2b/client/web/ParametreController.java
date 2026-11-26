package com.kikitraiteur.b2b.client.web;

import com.kikitraiteur.b2b.entreprise.data.entity.CategoriePlatEntity;
import com.kikitraiteur.b2b.entreprise.data.entity.TypePrestationEntity;
import com.kikitraiteur.b2b.entreprise.data.repository.CategoriePlatRepository;
import com.kikitraiteur.b2b.entreprise.data.repository.TypePrestationRepository;
import com.kikitraiteur.b2b.shared.exceptions.ResourceNotFoundException;
import com.kikitraiteur.b2b.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/b2b/parametres")
@RequiredArgsConstructor
@Tag(name = "Paramètres Prestations & Catégories", description = "Configuration des types de prestation (cut-offs, règles, jours) et catégories alimentaires")
public class ParametreController {

    private final TypePrestationRepository typePrestationRepository;
    private final CategoriePlatRepository categoriePlatRepository;

    @Operation(summary = "Lister les types de prestation", description = "Retourne tous les types de prestation avec leurs cut-offs, règles et jours disponibles.")
    @GetMapping("/prestations")
    public ApiResponse<List<TypePrestationEntity>> getPrestations() {
        return ApiResponse.ok(typePrestationRepository.findAll());
    }

    @Operation(summary = "Créer un type de prestation", description = "Ajoute un type de prestation configurable (Super Admin uniquement).")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @PostMapping("/prestations")
    public ApiResponse<TypePrestationEntity> createPrestation(@RequestBody TypePrestationEntity item) {
        return ApiResponse.ok("Type de prestation enregistré", typePrestationRepository.save(item));
    }

    @Operation(summary = "Lister les catégories de plats", description = "Retourne toutes les catégories alimentaires configurables.")
    @GetMapping("/categories")
    public ApiResponse<List<CategoriePlatEntity>> getCategories() {
        return ApiResponse.ok(categoriePlatRepository.findAll());
    }

    @Operation(summary = "Créer une catégorie de plat", description = "Ajoute une catégorie alimentaire (Super Admin uniquement).")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @PostMapping("/categories")
    public ApiResponse<CategoriePlatEntity> createCategorie(@RequestBody CategoriePlatEntity item) {
        return ApiResponse.ok("Catégorie enregistrée", categoriePlatRepository.save(item));
    }

    @Operation(summary = "Archiver / Désarchiver un type de prestation", description = "Bascule le statut d'archivage d'un type de prestation.")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @PatchMapping("/prestations/{code}/archive")
    public ApiResponse<TypePrestationEntity> toggleArchivePrestation(@PathVariable String code) {
        TypePrestationEntity entity = typePrestationRepository.findById(code)
                .orElseThrow(() -> new ResourceNotFoundException("Prestation introuvable : " + code));
        entity.setArchive(!entity.isArchive());
        return ApiResponse.ok("Statut archivage modifié", typePrestationRepository.save(entity));
    }

    @Operation(summary = "Archiver / Désarchiver une catégorie", description = "Bascule le statut d'archivage d'une catégorie alimentaire.")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @PatchMapping("/categories/{code}/archive")
    public ApiResponse<CategoriePlatEntity> toggleArchiveCategorie(@PathVariable String code) {
        CategoriePlatEntity entity = categoriePlatRepository.findById(code)
                .orElseThrow(() -> new ResourceNotFoundException("Catégorie introuvable : " + code));
        entity.setArchive(!entity.isArchive());
        return ApiResponse.ok("Statut archivage modifié", categoriePlatRepository.save(entity));
    }
}
