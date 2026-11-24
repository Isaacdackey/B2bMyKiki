package com.kikitraiteur.b2b.entreprise.data.repository;

import com.kikitraiteur.b2b.entreprise.data.entity.EntrepriseEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EntrepriseRepository extends JpaRepository<EntrepriseEntity, String> {
    Optional<EntrepriseEntity> findByCodeEntreprise(String codeEntreprise);
}
