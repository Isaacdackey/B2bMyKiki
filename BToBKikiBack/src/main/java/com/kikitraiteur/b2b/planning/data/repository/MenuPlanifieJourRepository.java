package com.kikitraiteur.b2b.planning.data.repository;

import com.kikitraiteur.b2b.planning.data.entity.MenuPlanifieJourEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MenuPlanifieJourRepository extends JpaRepository<MenuPlanifieJourEntity, String> {
    List<MenuPlanifieJourEntity> findByEntrepriseId(String entrepriseId);
    Optional<MenuPlanifieJourEntity> findByEntrepriseIdAndJourNom(String entrepriseId, String jourNom);
}
