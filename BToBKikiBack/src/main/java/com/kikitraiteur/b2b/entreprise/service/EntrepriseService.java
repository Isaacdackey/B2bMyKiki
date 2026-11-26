package com.kikitraiteur.b2b.entreprise.service;

import com.kikitraiteur.b2b.entreprise.data.entity.EntrepriseEntity;
import com.kikitraiteur.b2b.entreprise.data.entity.InvitationAdminEntity;
import com.kikitraiteur.b2b.entreprise.data.entity.SiteEntity;
import com.kikitraiteur.b2b.entreprise.data.repository.EntrepriseRepository;
import com.kikitraiteur.b2b.entreprise.data.repository.InvitationAdminRepository;
import com.kikitraiteur.b2b.entreprise.data.repository.SiteRepository;
import com.kikitraiteur.b2b.shared.exceptions.BusinessException;
import com.kikitraiteur.b2b.shared.exceptions.ResourceNotFoundException;
import com.kikitraiteur.b2b.shared.mail.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
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
    private final EmailService emailService;

    @Value("${app.frontend.url:https://btob-kiki.vercel.app}")
    private String frontendUrl;

    public List<EntrepriseEntity> findAll() {
        return entrepriseRepository.findAll();
    }

    public EntrepriseEntity findById(String id) {
        return entrepriseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Entreprise introuvable : " + id));
    }

    private static final String REGEX_TEL_SN = "^(?:\\+221|00221)?[\\s.-]?(?:7[05678]|3[03])(?:[\\s.-]?\\d){7}$";
    private static final String REGEX_EMAIL = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$";
    private static final String REGEX_NINEA = "^[0-9]{7,10}(?:\\s?[0-9A-Z]{2,3})?$";
    private static final String REGEX_RCCM = "^SN[-.\\s]?[A-Z]{2,4}[-.\\s]?(?:\\d{4}[-.\\s]?[A-Z][-.\\s]?)?\\d{2,6}$";

    private void validerEntreprise(EntrepriseEntity ent) {
        if (ent.getEmailContact() != null && !ent.getEmailContact().isBlank()
                && !ent.getEmailContact().trim().matches(REGEX_EMAIL)) {
            throw new BusinessException("Adresse email invalide (ex: rh@entreprise.sn).");
        }
        if (ent.getTelephone() != null && !ent.getTelephone().isBlank()
                && !"+221".equals(ent.getTelephone().trim())
                && !ent.getTelephone().trim().matches(REGEX_TEL_SN)) {
            throw new BusinessException("Numéro de téléphone sénégalais invalide (ex: +221 77 123 45 67).");
        }
        if (ent.getNinea() != null && !ent.getNinea().isBlank()
                && !ent.getNinea().trim().toUpperCase().matches(REGEX_NINEA)) {
            throw new BusinessException("Format NINEA invalide (ex: 001294829 2V1).");
        }
        if (ent.getRccm() != null && !ent.getRccm().isBlank()
                && !ent.getRccm().trim().toUpperCase().matches(REGEX_RCCM)) {
            throw new BusinessException("Format RCCM sénégalais invalide (ex: SN-DKR-2012-B-1428).");
        }
    }

    public EntrepriseEntity create(EntrepriseEntity ent) {
        validerEntreprise(ent);
        synchroniserCutOff(ent);
        if (ent.getId() == null || ent.getId().isBlank()) {
            ent.setId("ent-" + System.currentTimeMillis());
        }
        return entrepriseRepository.save(ent);
    }

    private void synchroniserCutOff(EntrepriseEntity ent) {
        if (ent.getCutOffJoursAvant() != null && ent.getCutOffJoursAvant() >= 0) {
            int j = ent.getCutOffJoursAvant();
            if (!"SANS_CUTOFF".equalsIgnoreCase(ent.getCutOffType())) {
                ent.setCutOffType(j == 0 ? "JOUR_J" : "J_MOINS_" + j);
            }
        } else {
            ent.setCutOffJoursAvant(ent.resolveCutOffJoursAvant());
        }
    }

    public EntrepriseEntity update(String id, EntrepriseEntity updates) {
        validerEntreprise(updates);
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
        if (updates.getCutOffJoursAvant() != null) {
            int j = Math.max(0, updates.getCutOffJoursAvant());
            existing.setCutOffJoursAvant(j);
            if (!"SANS_CUTOFF".equalsIgnoreCase(updates.getCutOffType())) {
                existing.setCutOffType(j == 0 ? "JOUR_J" : "J_MOINS_" + j);
            }
        } else if (updates.getCutOffType() != null) {
            existing.setCutOffJoursAvant(existing.resolveCutOffJoursAvant());
        }
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

    public List<InvitationAdminEntity> getAllInvitations() {
        return invitationRepository.findAll();
    }

    public List<InvitationAdminEntity> getInvitations(String entrepriseId) {
        return invitationRepository.findByEntrepriseId(entrepriseId);
    }

    public InvitationAdminEntity createInvitation(String entrepriseId, InvitationAdminEntity inv) {
        EntrepriseEntity ent = findById(entrepriseId);
        if (inv.getEmail() == null || inv.getEmail().isBlank() || !inv.getEmail().trim().matches(REGEX_EMAIL)) {
            throw new BusinessException("Adresse email invalide pour l'invitation.");
        }
        if (inv.getNomComplet() == null || inv.getNomComplet().isBlank()) {
            throw new BusinessException("Le nom complet du gestionnaire est obligatoire.");
        }

        String role = (inv.getRole() != null && !inv.getRole().isBlank())
                ? inv.getRole().trim()
                : "RESPONSABLE_ENTREPRISE";
        String roleLibelle = (inv.getRoleLibelle() != null && !inv.getRoleLibelle().isBlank())
                ? inv.getRoleLibelle().trim()
                : ("RESPONSABLE_SITE_KIKI".equals(role) ? "Responsable de Site Kiki" : "Admin Entreprise (RH)");

        inv.setId("inv-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 4));
        inv.setEmail(inv.getEmail().trim().toLowerCase());
        inv.setNomComplet(inv.getNomComplet().trim());
        inv.setRole(role);
        inv.setRoleLibelle(roleLibelle);
        inv.setEntrepriseId(ent.getId());
        inv.setEntrepriseNom(ent.getNom());
        inv.setDateEnvoi(LocalDate.now().toString());
        inv.setTokenActivation("KIKI-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase());
        inv.setStatut("EN_ATTENTE");
        InvitationAdminEntity saved = invitationRepository.save(inv);

        sendInvitationEmail(saved, ent.getNom());
        return saved;
    }

    public InvitationAdminEntity resendInvitation(String entrepriseId, String invitationId) {
        EntrepriseEntity ent = findById(entrepriseId);
        InvitationAdminEntity inv = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation introuvable : " + invitationId));
        if (!ent.getId().equals(inv.getEntrepriseId())) {
            throw new BusinessException("Cette invitation n'appartient pas à cette entreprise.");
        }
        if ("ACTIVE".equalsIgnoreCase(inv.getStatut())) {
            throw new BusinessException("Ce compte administrateur a déjà été activé.");
        }
        inv.setDateEnvoi(LocalDate.now().toString());
        InvitationAdminEntity saved = invitationRepository.save(inv);
        sendInvitationEmail(saved, ent.getNom());
        return saved;
    }

    private void sendInvitationEmail(InvitationAdminEntity inv, String entrepriseNom) {
        String base = (frontendUrl != null && !frontendUrl.isBlank() && !frontendUrl.contains("localhost"))
                ? frontendUrl.replaceAll("/+$", "")
                : "https://btob-kiki.vercel.app";
        String activationUrl = base + "/b2b/activation?token="
                + URLEncoder.encode(inv.getTokenActivation(), StandardCharsets.UTF_8)
                + "&email=" + URLEncoder.encode(inv.getEmail(), StandardCharsets.UTF_8);

        boolean sent = emailService.sendAdminInvitationEmail(
                inv.getEmail(),
                inv.getNomComplet(),
                inv.getRoleLibelle(),
                entrepriseNom,
                activationUrl
        );
        if (!sent) {
            throw new BusinessException("Invitation enregistrée mais échec d'envoi email Brevo/SMTP. Vérifiez BREVO_API_KEY et BREVO_SENDER_EMAIL.");
        }
    }
}
