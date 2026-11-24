package com.kikitraiteur.b2b.commande.service;

import com.kikitraiteur.b2b.commande.data.entity.CommandeSiteEntity;
import com.kikitraiteur.b2b.commande.data.entity.ReclamationCutOffEntity;
import com.kikitraiteur.b2b.commande.data.repository.CommandeSiteRepository;
import com.kikitraiteur.b2b.commande.data.repository.ReclamationCutOffRepository;
import com.kikitraiteur.b2b.shared.exceptions.BusinessException;
import com.kikitraiteur.b2b.shared.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CommandeService {

    private final CommandeSiteRepository commandeRepository;
    private final ReclamationCutOffRepository reclamationRepository;

    public List<CommandeSiteEntity> findCommandes(String entrepriseId, String date) {
        if (date != null && !date.isBlank()) {
            return commandeRepository.findByEntrepriseIdAndDate(entrepriseId, date);
        }
        return commandeRepository.findByEntrepriseId(entrepriseId);
    }

    public CommandeSiteEntity createCommande(CommandeSiteEntity cmd) {
        if (cmd.getId() == null || cmd.getId().isBlank()) {
            cmd.setId("cmd-" + System.currentTimeMillis());
        }
        if (cmd.getCodeCommande() == null || cmd.getCodeCommande().isBlank()) {
            cmd.setCodeCommande("CMD-" + (System.currentTimeMillis() % 100000));
        }
        if (cmd.getDate() == null) cmd.setDate(LocalDate.now().toString());
        if (cmd.getHeure() == null) cmd.setHeure(LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm")));
        if (cmd.getStatut() == null) cmd.setStatut("EN_COURS");
        return commandeRepository.save(cmd);
    }

    public CommandeSiteEntity scannerCommande(String id) {
        CommandeSiteEntity cmd = commandeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Commande introuvable : " + id));
        cmd.setStatut("SCANNE");
        cmd.setScanneAt(LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm")));
        return commandeRepository.save(cmd);
    }

    public CommandeSiteEntity marquerLivree(String id) {
        CommandeSiteEntity cmd = commandeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Commande introuvable : " + id));
        if (!"SCANNE".equals(cmd.getStatut())) {
            throw new BusinessException("La commande doit d'abord être scannée au réfectoire avant d'être marquée livrée.");
        }
        cmd.setStatut("LIVRE");
        cmd.setLivreAt(LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm")));
        return commandeRepository.save(cmd);
    }

    public List<ReclamationCutOffEntity> findReclamations(String entrepriseId) {
        return reclamationRepository.findByEntrepriseId(entrepriseId);
    }

    public ReclamationCutOffEntity createReclamation(ReclamationCutOffEntity rec) {
        if (rec.getId() == null || rec.getId().isBlank()) {
            rec.setId("rec-" + System.currentTimeMillis());
        }
        if (rec.getDate() == null) rec.setDate(LocalDate.now().toString());
        if (rec.getHeureDemande() == null) rec.setHeureDemande(LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm")));
        rec.setStatut("EN_ATTENTE");
        return reclamationRepository.save(rec);
    }

    public ReclamationCutOffEntity debloquerReclamation(String id, String responsable) {
        ReclamationCutOffEntity rec = reclamationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Réclamation introuvable : " + id));
        rec.setStatut("DEBLOQUE");
        rec.setDebloquePar(responsable != null ? responsable : "Responsable Site Kiki");
        rec.setDebloqueAt(LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm")));
        return reclamationRepository.save(rec);
    }
}
