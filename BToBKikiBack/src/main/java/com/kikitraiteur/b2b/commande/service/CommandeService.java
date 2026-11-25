package com.kikitraiteur.b2b.commande.service;

import com.kikitraiteur.b2b.commande.data.entity.CommandeSiteEntity;
import com.kikitraiteur.b2b.commande.data.entity.ReclamationCutOffEntity;
import com.kikitraiteur.b2b.commande.data.repository.CommandeSiteRepository;
import com.kikitraiteur.b2b.commande.data.repository.ReclamationCutOffRepository;
import com.kikitraiteur.b2b.entreprise.data.entity.EntrepriseEntity;
import com.kikitraiteur.b2b.entreprise.data.repository.EntrepriseRepository;
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
    private final EntrepriseRepository entrepriseRepository;

    public List<CommandeSiteEntity> findCommandes(String entrepriseId, String date) {
        if (date != null && !date.isBlank()) {
            return commandeRepository.findByEntrepriseIdAndDate(entrepriseId, date);
        }
        return commandeRepository.findByEntrepriseId(entrepriseId);
    }

    public CommandeSiteEntity createCommande(CommandeSiteEntity cmd) {
        if (cmd.getDate() == null || cmd.getDate().isBlank()) cmd.setDate(LocalDate.now().toString());
        if (cmd.getHeure() == null || cmd.getHeure().isBlank()) cmd.setHeure(LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm")));

        boolean isProxyOrGroup = cmd.getCodeCommande() != null
                && (cmd.getCodeCommande().startsWith("CMD-SITE-") || cmd.getCodeCommande().startsWith("GRP-"));

        if (!isProxyOrGroup && cmd.getEntrepriseId() != null) {
            entrepriseRepository.findById(cmd.getEntrepriseId()).ifPresent(ent -> {
                validerReglesConvention(ent, cmd);
            });
        }

        if (cmd.getCodeCommande() != null && !cmd.getCodeCommande().isBlank()) {
            var existingOpt = commandeRepository.findByCodeCommande(cmd.getCodeCommande());
            if (existingOpt.isPresent()) {
                CommandeSiteEntity existing = existingOpt.get();
                existing.setPlatNom(cmd.getPlatNom());
                existing.setCategorie(cmd.getCategorie());
                existing.setMontantTotal(cmd.getMontantTotal());
                existing.setPartEntreprise(cmd.getPartEntreprise());
                existing.setPartEmploye(cmd.getPartEmploye());
                existing.setHeure(cmd.getHeure());
                return commandeRepository.save(existing);
            }
        }

        if (cmd.getId() == null || cmd.getId().isBlank()) {
            cmd.setId("cmd-" + System.currentTimeMillis());
        }
        if (cmd.getCodeCommande() == null || cmd.getCodeCommande().isBlank()) {
            cmd.setCodeCommande("CMD-" + (System.currentTimeMillis() % 100000));
        }
        if (cmd.getStatut() == null) cmd.setStatut("EN_COURS");
        return commandeRepository.save(cmd);
    }

    private void validerReglesConvention(EntrepriseEntity ent, CommandeSiteEntity cmd) {
        if (ent.getCategoriesAutorisees() != null && !ent.getCategoriesAutorisees().isEmpty()
                && cmd.getCategorie() != null && !"GARNITURE".equalsIgnoreCase(cmd.getCategorie())) {
            boolean autorise = ent.getCategoriesAutorisees().stream()
                    .anyMatch(c -> c.equalsIgnoreCase(cmd.getCategorie()));
            if (!autorise) {
                throw new BusinessException("Catégorie non autorisée par la convention de votre entreprise : " + cmd.getCategorie());
            }
        }

        if ("SANS_CUTOFF".equalsIgnoreCase(ent.getCutOffType())) {
            return;
        }

        String todayStr = LocalDate.now().toString();
        if (todayStr.equals(cmd.getDate()) && ent.getCutOffHeure() != null && !ent.getCutOffHeure().isBlank()) {
            try {
                LocalTime cutOff = LocalTime.parse(ent.getCutOffHeure().trim());
                if (LocalTime.now().isAfter(cutOff)) {
                    boolean debloque = reclamationRepository.findByEntrepriseId(ent.getId()).stream()
                            .anyMatch(r -> "DEBLOQUE".equalsIgnoreCase(r.getStatut())
                                    && todayStr.equals(r.getDate())
                                    && ((cmd.getMatricule() != null && cmd.getMatricule().equalsIgnoreCase(r.getMatricule()))
                                        || (cmd.getEmployeNom() != null && cmd.getEmployeNom().equalsIgnoreCase(r.getEmployeNom()))));
                    if (!debloque) {
                        throw new BusinessException("L'heure limite de commande (" + ent.getCutOffHeure() + ") est dépassée pour aujourd'hui.");
                    }
                }
            } catch (BusinessException ex) {
                throw ex;
            } catch (Exception ignored) {
            }
        }
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
