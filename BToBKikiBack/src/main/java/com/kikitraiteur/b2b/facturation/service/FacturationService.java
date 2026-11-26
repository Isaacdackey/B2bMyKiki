package com.kikitraiteur.b2b.facturation.service;

import com.kikitraiteur.b2b.commande.data.entity.CommandeSiteEntity;
import com.kikitraiteur.b2b.commande.data.repository.CommandeSiteRepository;
import com.kikitraiteur.b2b.facturation.data.entity.FacturationJournaliereEntity;
import com.kikitraiteur.b2b.facturation.data.repository.FacturationJournaliereRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FacturationService {

    private final FacturationJournaliereRepository facturationRepository;
    private final CommandeSiteRepository commandeRepository;

    public List<FacturationJournaliereEntity> findByEntreprise(String entrepriseId) {
        boolean allEnt = (entrepriseId == null || entrepriseId.isBlank() || "ALL".equalsIgnoreCase(entrepriseId));
        List<FacturationJournaliereEntity> stored = allEnt
                ? facturationRepository.findAll()
                : facturationRepository.findByEntrepriseIdOrderByDateDesc(entrepriseId);
        List<CommandeSiteEntity> commandes = allEnt
                ? commandeRepository.findAll()
                : commandeRepository.findByEntrepriseId(entrepriseId);

        Map<String, FacturationJournaliereEntity> byDateAndEnt = new LinkedHashMap<>();
        for (FacturationJournaliereEntity f : stored) {
            String key = (f.getEntrepriseId() != null ? f.getEntrepriseId() : "ent-001") + "|" + f.getDate();
            byDateAndEnt.put(key, f);
        }

        Map<String, List<CommandeSiteEntity>> grouped = new LinkedHashMap<>();
        for (CommandeSiteEntity c : commandes) {
            if (c.getDate() == null || c.getDate().isBlank()) continue;
            String entKey = c.getEntrepriseId() != null ? c.getEntrepriseId() : "ent-001";
            String key = entKey + "|" + c.getDate();
            grouped.computeIfAbsent(key, k -> new ArrayList<>()).add(c);
        }

        for (Map.Entry<String, List<CommandeSiteEntity>> entry : grouped.entrySet()) {
            String key = entry.getKey();
            List<CommandeSiteEntity> cmds = entry.getValue();
            if (cmds.isEmpty()) continue;
            CommandeSiteEntity sample = cmds.get(0);
            int nbLivres = (int) cmds.stream().filter(c -> "LIVRE".equalsIgnoreCase(c.getStatut())).count();
            int nbTotal = cmds.size();
            int montantTotal = cmds.stream().mapToInt(c -> c.getMontantTotal() != null ? c.getMontantTotal() : 0).sum();
            int partEnt = cmds.stream().mapToInt(c -> c.getPartEntreprise() != null ? c.getPartEntreprise() : 0).sum();
            int partEmp = cmds.stream().mapToInt(c -> c.getPartEmploye() != null ? c.getPartEmploye() : 0).sum();

            FacturationJournaliereEntity existing = byDateAndEnt.get(key);
            if (existing != null) {
                existing.setNbPlatsLivres(Math.max(existing.getNbPlatsLivres() != null ? existing.getNbPlatsLivres() : 0, nbLivres > 0 ? nbLivres : nbTotal));
                existing.setNbPresents(Math.max(existing.getNbPresents() != null ? existing.getNbPresents() : 0, nbTotal));
                existing.setMontantTotal(Math.max(existing.getMontantTotal() != null ? existing.getMontantTotal() : 0, montantTotal));
                existing.setMontantPartEntreprise(Math.max(existing.getMontantPartEntreprise() != null ? existing.getMontantPartEntreprise() : 0, partEnt));
                existing.setMontantPartEmploye(Math.max(existing.getMontantPartEmploye() != null ? existing.getMontantPartEmploye() : 0, partEmp));
            } else {
                byDateAndEnt.put(key, FacturationJournaliereEntity.builder()
                        .id("fact-" + sample.getEntrepriseId() + "-" + sample.getDate())
                        .entrepriseId(sample.getEntrepriseId() != null ? sample.getEntrepriseId() : "ent-001")
                        .date(sample.getDate())
                        .dateAffichee(sample.getDate())
                        .nbPlatsLivres(nbLivres > 0 ? nbLivres : nbTotal)
                        .nbPresents(nbTotal)
                        .montantTotal(montantTotal)
                        .montantPartEntreprise(partEnt)
                        .montantPartEmploye(partEmp)
                        .statut(nbLivres == nbTotal && nbTotal > 0 ? "VALIDE" : "EN_COURS")
                        .build());
            }
        }

        return byDateAndEnt.values().stream()
                .sorted(Comparator.comparing(FacturationJournaliereEntity::getDate, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    public List<CommandeSiteEntity> findDetailsJour(String entrepriseId, String date) {
        boolean allEnt = (entrepriseId == null || entrepriseId.isBlank() || "ALL".equalsIgnoreCase(entrepriseId));
        List<CommandeSiteEntity> list = allEnt
                ? commandeRepository.findAll().stream().filter(c -> date.equals(c.getDate())).toList()
                : commandeRepository.findByEntrepriseIdAndDate(entrepriseId, date);
        return list;
    }
}
