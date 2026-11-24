package com.kikitraiteur.b2b.entreprise.data.repository;

import com.kikitraiteur.b2b.entreprise.data.entity.InvitationAdminEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InvitationAdminRepository extends JpaRepository<InvitationAdminEntity, String> {
    List<InvitationAdminEntity> findByEntrepriseId(String entrepriseId);
}
