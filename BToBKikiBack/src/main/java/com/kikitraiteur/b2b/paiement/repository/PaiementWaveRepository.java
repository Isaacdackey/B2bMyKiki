package com.kikitraiteur.b2b.paiement.repository;

import com.kikitraiteur.b2b.paiement.entity.PaiementWaveEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaiementWaveRepository extends JpaRepository<PaiementWaveEntity, String> {
    Optional<PaiementWaveEntity> findByWaveSessionId(String waveSessionId);
    Optional<PaiementWaveEntity> findByCommandeId(String commandeId);
}
