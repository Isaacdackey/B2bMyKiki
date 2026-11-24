package com.kikitraiteur.b2b.commande.data.repository;

import com.kikitraiteur.b2b.commande.data.entity.CommandeSiteEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommandeSiteRepository extends JpaRepository<CommandeSiteEntity, String> {
    List<CommandeSiteEntity> findByEntrepriseId(String entrepriseId);
    List<CommandeSiteEntity> findByEntrepriseIdAndDate(String entrepriseId, String date);
}
