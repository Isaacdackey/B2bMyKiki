package com.kikitraiteur.b2b.client.web;

import com.kikitraiteur.b2b.entreprise.data.entity.CategoriePlatEntity;
import com.kikitraiteur.b2b.entreprise.data.entity.TypePrestationEntity;
import com.kikitraiteur.b2b.entreprise.data.repository.CategoriePlatRepository;
import com.kikitraiteur.b2b.entreprise.data.repository.TypePrestationRepository;
import com.kikitraiteur.b2b.shared.exceptions.ResourceNotFoundException;
import com.kikitraiteur.b2b.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/b2b/parametres")
@RequiredArgsConstructor
public class ParametreController {

    private final TypePrestationRepository typePrestationRepository;
    private final CategoriePlatRepository categoriePlatRepository;

    @GetMapping("/prestations")
    public ApiResponse<List<TypePrestationEntity>> getPrestations() {
        return ApiResponse.ok(typePrestationRepository.findAll());
    }

    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @PostMapping("/prestations")
    public ApiResponse<TypePrestationEntity> createPrestation(@RequestBody TypePrestationEntity item) {
        return ApiResponse.ok("Type de prestation enregistré", typePrestationRepository.save(item));
    }

    @GetMapping("/categories")
    public ApiResponse<List<CategoriePlatEntity>> getCategories() {
        return ApiResponse.ok(categoriePlatRepository.findAll());
    }

    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @PostMapping("/categories")
    public ApiResponse<CategoriePlatEntity> createCategorie(@RequestBody CategoriePlatEntity item) {
        return ApiResponse.ok("Catégorie enregistrée", categoriePlatRepository.save(item));
    }

    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @PatchMapping("/prestations/{code}/archive")
    public ApiResponse<TypePrestationEntity> toggleArchivePrestation(@PathVariable String code) {
        TypePrestationEntity entity = typePrestationRepository.findById(code)
                .orElseThrow(() -> new ResourceNotFoundException("Prestation introuvable : " + code));
        entity.setArchive(!entity.isArchive());
        return ApiResponse.ok("Statut archivage modifié", typePrestationRepository.save(entity));
    }

    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @PatchMapping("/categories/{code}/archive")
    public ApiResponse<CategoriePlatEntity> toggleArchiveCategorie(@PathVariable String code) {
        CategoriePlatEntity entity = categoriePlatRepository.findById(code)
                .orElseThrow(() -> new ResourceNotFoundException("Catégorie introuvable : " + code));
        entity.setArchive(!entity.isArchive());
        return ApiResponse.ok("Statut archivage modifié", categoriePlatRepository.save(entity));
    }
}
