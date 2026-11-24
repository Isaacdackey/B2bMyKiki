package com.kikitraiteur.b2b.entreprise.data.repository;

import com.kikitraiteur.b2b.entreprise.data.entity.TypePrestationEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TypePrestationRepository extends JpaRepository<TypePrestationEntity, String> {
}
