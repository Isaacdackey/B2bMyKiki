package com.kikitraiteur.b2b.facturation.service;

import com.kikitraiteur.b2b.commande.data.entity.CommandeSiteEntity;
import com.kikitraiteur.b2b.commande.data.repository.CommandeSiteRepository;
import com.kikitraiteur.b2b.facturation.data.entity.FacturationJournaliereEntity;
import com.kikitraiteur.b2b.facturation.data.repository.FacturationJournaliereRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FacturationService {

    private final FacturationJournaliereRepository facturationRepository;
    private final CommandeSiteRepository commandeRepository;

    public List<FacturationJournaliereEntity> findByEntreprise(String entrepriseId) {
        return facturationRepository.findByEntrepriseIdOrderByDateDesc(entrepriseId);
    }

    public List<CommandeSiteEntity> findDetailsJour(String entrepriseId, String date) {
        return commandeRepository.findByEntrepriseIdAndDate(entrepriseId, date).stream()
                .filter(c -> "LIVRE".equals(c.getStatut()))
                .toList();
    }
}
