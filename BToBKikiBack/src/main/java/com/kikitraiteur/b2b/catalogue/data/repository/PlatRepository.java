package com.kikitraiteur.b2b.catalogue.data.repository;

import com.kikitraiteur.b2b.catalogue.data.entity.PlatEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlatRepository extends JpaRepository<PlatEntity, String> {
    List<PlatEntity> findByIsArchiveFalse();
    List<PlatEntity> findByCategorieAndIsArchiveFalse(String categorie);
}
