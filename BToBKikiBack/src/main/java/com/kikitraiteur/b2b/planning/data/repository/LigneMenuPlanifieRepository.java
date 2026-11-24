package com.kikitraiteur.b2b.planning.data.repository;

import com.kikitraiteur.b2b.planning.data.entity.LigneMenuPlanifieEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LigneMenuPlanifieRepository extends JpaRepository<LigneMenuPlanifieEntity, String> {
    List<LigneMenuPlanifieEntity> findByPlatId(String platId);
}
