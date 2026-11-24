package com.kikitraiteur.b2b.entreprise.service;

import com.kikitraiteur.b2b.entreprise.data.entity.EntrepriseEntity;
import com.kikitraiteur.b2b.entreprise.data.entity.InvitationAdminEntity;
import com.kikitraiteur.b2b.entreprise.data.entity.SiteEntity;
import com.kikitraiteur.b2b.entreprise.data.repository.EntrepriseRepository;
import com.kikitraiteur.b2b.entreprise.data.repository.InvitationAdminRepository;
import com.kikitraiteur.b2b.entreprise.data.repository.SiteRepository;
import com.kikitraiteur.b2b.shared.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class EntrepriseService {

    private final EntrepriseRepository entrepriseRepository;
    private final SiteRepository siteRepository;
    private final InvitationAdminRepository invitationRepository;
    private final JavaMailSender mailSender;

    public List<EntrepriseEntity> findAll() {
        return entrepriseRepository.findAll();
    }

    public EntrepriseEntity findById(String id) {
        return entrepriseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Entreprise introuvable : " + id));
    }

    public EntrepriseEntity create(EntrepriseEntity ent) {
        if (ent.getId() == null || ent.getId().isBlank()) {
            ent.setId("ent-" + System.currentTimeMillis());
        }
        return entrepriseRepository.save(ent);
    }

    public EntrepriseEntity update(String id, EntrepriseEntity updates) {
        EntrepriseEntity existing = findById(id);
        if (updates.getNom() != null) existing.setNom(updates.getNom());
        if (updates.getCodeEntreprise() != null) existing.setCodeEntreprise(updates.getCodeEntreprise());
        if (updates.getNinea() != null) existing.setNinea(updates.getNinea());
        if (updates.getRccm() != null) existing.setRccm(updates.getRccm());
        if (updates.getAdresse() != null) existing.setAdresse(updates.getAdresse());
        if (updates.getEmailContact() != null) existing.setEmailContact(updates.getEmailContact());
        if (updates.getTelephone() != null) existing.setTelephone(updates.getTelephone());
        if (updates.getMontantPriseEnChargeRepas() != null) existing.setMontantPriseEnChargeRepas(updates.getMontantPriseEnChargeRepas());
        if (updates.getCadenceFacturation() != null) existing.setCadenceFacturation(updates.getCadenceFacturation());
        if (updates.getCutOffType() != null) existing.setCutOffType(updates.getCutOffType());
        if (updates.getCutOffHeure() != null) existing.setCutOffHeure(updates.getCutOffHeure());
        if (updates.getTypePrestation() != null) existing.setTypePrestation(updates.getTypePrestation());
        if (updates.getCategoriesAutorisees() != null && !updates.getCategoriesAutorisees().isEmpty()) {
            existing.setCategoriesAutorisees(updates.getCategoriesAutorisees());
        }
        return entrepriseRepository.save(existing);
    }

    public EntrepriseEntity toggleArchive(String id) {
        EntrepriseEntity existing = findById(id);
        existing.setArchivee(!existing.isArchivee());
        return entrepriseRepository.save(existing);
    }

    public SiteEntity addSite(String entrepriseId, SiteEntity site) {
        EntrepriseEntity ent = findById(entrepriseId);
        if (site.getId() == null || site.getId().isBlank()) {
            site.setId("site-" + System.currentTimeMillis());
        }
        site.setEntreprise(ent);
        return siteRepository.save(site);
    }

    public List<InvitationAdminEntity> getInvitations(String entrepriseId) {
        return invitationRepository.findByEntrepriseId(entrepriseId);
    }

    public InvitationAdminEntity createInvitation(String entrepriseId, InvitationAdminEntity inv) {
        EntrepriseEntity ent = findById(entrepriseId);
        inv.setId("inv-" + System.currentTimeMillis());
        inv.setEntrepriseId(ent.getId());
        inv.setEntrepriseNom(ent.getNom());
        inv.setDateEnvoi(LocalDate.now().toString());
        inv.setTokenActivation("KIKI-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        inv.setStatut("EN_ATTENTE");
        InvitationAdminEntity saved = invitationRepository.save(inv);

        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(saved.getEmail());
            msg.setSubject("Activation de votre compte Administrateur Kiki Traiteur B2B");
            msg.setText("Bonjour " + saved.getNomComplet() + ",\n\n"
                    + "Votre accès " + saved.getRoleLibelle() + " pour " + ent.getNom() + " est prêt.\n"
                    + "Lien d'activation : https://kikitraiteur.sn/b2b/activation?token=" + saved.getTokenActivation()
                    + "&email=" + saved.getEmail() + "\n\nCordialement,\nKiki Traiteur B2B");
            mailSender.send(msg);
        } catch (Exception e) {
            log.warn("Envoi email non effectue (SMTP non configure) pour {}: {}", saved.getEmail(), e.getMessage());
        }
        return saved;
    }
}
