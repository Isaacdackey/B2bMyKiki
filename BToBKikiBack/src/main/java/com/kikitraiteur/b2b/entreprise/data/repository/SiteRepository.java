package com.kikitraiteur.b2b.entreprise.data.repository;

import com.kikitraiteur.b2b.entreprise.data.entity.SiteEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SiteRepository extends JpaRepository<SiteEntity, String> {
    List<SiteEntity> findByEntrepriseId(String entrepriseId);
}
