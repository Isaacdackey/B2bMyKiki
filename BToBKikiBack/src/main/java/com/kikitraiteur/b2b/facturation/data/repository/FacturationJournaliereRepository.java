package com.kikitraiteur.b2b.facturation.data.repository;

import com.kikitraiteur.b2b.facturation.data.entity.FacturationJournaliereEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FacturationJournaliereRepository extends JpaRepository<FacturationJournaliereEntity, String> {
    List<FacturationJournaliereEntity> findByEntrepriseIdOrderByDateDesc(String entrepriseId);
}
