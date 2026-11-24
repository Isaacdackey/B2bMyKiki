package com.kikitraiteur.b2b.entreprise.data.repository;

import com.kikitraiteur.b2b.entreprise.data.entity.InvitationAdminEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InvitationAdminRepository extends JpaRepository<InvitationAdminEntity, String> {
    List<InvitationAdminEntity> findByEntrepriseId(String entrepriseId);
    Optional<InvitationAdminEntity> findByTokenActivation(String tokenActivation);
}
