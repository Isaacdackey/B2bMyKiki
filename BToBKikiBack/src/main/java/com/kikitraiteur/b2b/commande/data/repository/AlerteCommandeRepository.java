package com.kikitraiteur.b2b.commande.data.repository;

import com.kikitraiteur.b2b.commande.data.entity.AlerteCommandeEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlerteCommandeRepository extends JpaRepository<AlerteCommandeEntity, String> {
    List<AlerteCommandeEntity> findByEmployeEmailIgnoreCaseOrderByCreatedAtDesc(String employeEmail);
    List<AlerteCommandeEntity> findByEntrepriseIdOrderByCreatedAtDesc(String entrepriseId);
}
