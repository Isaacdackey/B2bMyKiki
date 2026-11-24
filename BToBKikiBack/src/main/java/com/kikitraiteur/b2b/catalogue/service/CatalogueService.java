package com.kikitraiteur.b2b.catalogue.service;

import com.kikitraiteur.b2b.catalogue.data.entity.PlatEntity;
import com.kikitraiteur.b2b.catalogue.data.repository.PlatRepository;
import com.kikitraiteur.b2b.shared.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CatalogueService {

    private final PlatRepository platRepository;

    public List<PlatEntity> findAll(boolean includeArchived) {
        return includeArchived ? platRepository.findAll() : platRepository.findByIsArchiveFalse();
    }

    public PlatEntity create(PlatEntity plat) {
        if (plat.getId() == null || plat.getId().isBlank()) {
            plat.setId("plat-" + System.currentTimeMillis());
        }
        return platRepository.save(plat);
    }

    public PlatEntity update(String id, PlatEntity updates) {
        PlatEntity existing = platRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Plat introuvable : " + id));
        if (updates.getNom() != null) existing.setNom(updates.getNom());
        if (updates.getDescription() != null) existing.setDescription(updates.getDescription());
        if (updates.getCategorie() != null) existing.setCategorie(updates.getCategorie());
        if (updates.getPrixUnitaire() != null) existing.setPrixUnitaire(updates.getPrixUnitaire());
        if (updates.getImage() != null) existing.setImage(updates.getImage());
        if (updates.getAllergene() != null) existing.setAllergene(updates.getAllergene());
        if (updates.getCalories() != null) existing.setCalories(updates.getCalories());
        return platRepository.save(existing);
    }

    public PlatEntity toggleArchive(String id) {
        PlatEntity existing = platRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Plat introuvable : " + id));
        existing.setArchive(!existing.isArchive());
        return platRepository.save(existing);
    }
}
