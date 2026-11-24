package com.kikitraiteur.b2b.commande.data.repository;

import com.kikitraiteur.b2b.commande.data.entity.ReclamationCutOffEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReclamationCutOffRepository extends JpaRepository<ReclamationCutOffEntity, String> {
    List<ReclamationCutOffEntity> findByEntrepriseId(String entrepriseId);
}
