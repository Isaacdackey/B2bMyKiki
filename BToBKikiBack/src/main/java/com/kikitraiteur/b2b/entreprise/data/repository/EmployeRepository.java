package com.kikitraiteur.b2b.entreprise.data.repository;

import com.kikitraiteur.b2b.entreprise.data.entity.EmployeEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EmployeRepository extends JpaRepository<EmployeEntity, String> {
    List<EmployeEntity> findByEntrepriseId(String entrepriseId);
    List<EmployeEntity> findBySiteId(String siteId);
}
