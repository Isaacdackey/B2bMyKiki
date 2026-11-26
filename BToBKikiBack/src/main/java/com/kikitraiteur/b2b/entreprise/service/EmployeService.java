package com.kikitraiteur.b2b.entreprise.service;

import com.kikitraiteur.b2b.entreprise.data.entity.EmployeEntity;
import com.kikitraiteur.b2b.entreprise.data.entity.InvitationAdminEntity;
import com.kikitraiteur.b2b.entreprise.data.repository.EmployeRepository;
import com.kikitraiteur.b2b.entreprise.data.repository.InvitationAdminRepository;
import com.kikitraiteur.b2b.shared.exceptions.BusinessException;
import com.kikitraiteur.b2b.shared.exceptions.ResourceNotFoundException;
import com.kikitraiteur.b2b.shared.mail.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EmployeService {

    private final EmployeRepository employeRepository;
    private final InvitationAdminRepository invitationRepository;
    private final EmailService emailService;

    @Value("${app.frontend.url:https://btob-kiki.vercel.app}")
    private String frontendUrl;

    public List<EmployeEntity> findAll(String entrepriseId) {
        if (entrepriseId != null && !entrepriseId.isBlank()) {
            return employeRepository.findByEntrepriseId(entrepriseId);
        }
        return employeRepository.findAll();
    }

    private static final String REGEX_TEL_SN = "^(?:\\+221|00221)?[\\s.-]?(?:7[05678]|3[03])(?:[\\s.-]?\\d){7}$";
    private static final String REGEX_EMAIL = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$";
    private static final String REGEX_MATRICULE = "^[A-Z0-9-]{3,20}$";

    public EmployeEntity create(EmployeEntity emp) {
        if (emp.getEmail() != null && !emp.getEmail().isBlank() && !emp.getEmail().trim().matches(REGEX_EMAIL)) {
            throw new BusinessException("Adresse email invalide.");
        }
        if (emp.getTelephone() == null || emp.getTelephone().isBlank()
                || "+221".equals(emp.getTelephone().trim())
                || !emp.getTelephone().trim().matches(REGEX_TEL_SN)) {
            throw new BusinessException("Numéro de téléphone sénégalais invalide (ex: +221 77 123 45 67).");
        }
        if (emp.getMatricule() != null && !emp.getMatricule().isBlank()
                && !emp.getMatricule().trim().toUpperCase().matches(REGEX_MATRICULE)) {
            throw new BusinessException("Format de matricule invalide (ex: TOT-1042).");
        }
        if (emp.getId() == null || emp.getId().isBlank()) {
            emp.setId("emp-" + System.currentTimeMillis());
        }
        if (emp.getMatricule() == null || emp.getMatricule().isBlank()) {
            emp.setMatricule("EMP-" + (System.currentTimeMillis() % 10000));
        }
        emp.setType(emp.getTauxSubvention() != null && emp.getTauxSubvention() > 0 ? "SUBVENTIONNE" : "AUTONOME");
        EmployeEntity saved = employeRepository.save(emp);
        if (saved.getEmail() != null && !saved.getEmail().isBlank()) {
            envoyerInvitationActivationEmploye(saved);
        }
        return saved;
    }

    private void envoyerInvitationActivationEmploye(EmployeEntity emp) {
        try {
            InvitationAdminEntity inv = new InvitationAdminEntity();
            inv.setId("inv-" + System.currentTimeMillis());
            inv.setEntrepriseId(emp.getEntrepriseId() != null && !emp.getEntrepriseId().isBlank() ? emp.getEntrepriseId() : "ent-001");
            inv.setEmail(emp.getEmail().trim().toLowerCase());
            inv.setNomComplet(((emp.getPrenom() != null ? emp.getPrenom() : "") + " " + (emp.getNom() != null ? emp.getNom() : "")).trim());
            boolean subv = "SUBVENTIONNE".equals(emp.getType());
            inv.setRole(subv ? "SALARIE_CONVENTIONNE" : "SALARIE_AUTONOME");
            inv.setRoleLibelle(subv ? "Salarié Conventionné" : "Salarié Autonome");
            inv.setTokenActivation("KIKI-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase());
            inv.setStatut("EN_ATTENTE");
            inv.setDateEnvoi(LocalDate.now().toString());
            invitationRepository.save(inv);

            String base = (frontendUrl != null && !frontendUrl.isBlank() && !frontendUrl.contains("localhost"))
                    ? frontendUrl.replaceAll("/+$", "")
                    : "https://btob-kiki.vercel.app";
            String activationUrl = base + "/b2b/activation?token="
                    + URLEncoder.encode(inv.getTokenActivation(), StandardCharsets.UTF_8)
                    + "&email=" + URLEncoder.encode(inv.getEmail(), StandardCharsets.UTF_8);

            emailService.sendAdminInvitationEmail(
                    inv.getEmail(),
                    inv.getNomComplet(),
                    inv.getRoleLibelle(),
                    emp.getSiteNom() != null && !emp.getSiteNom().isBlank() ? emp.getSiteNom() : "Votre entreprise",
                    activationUrl
            );
        } catch (Exception ignored) {
            // Ne pas bloquer la création de l'employé si l'envoi d'email échoue
        }
    }

    public List<EmployeEntity> importBatch(List<EmployeEntity> employes) {
        for (EmployeEntity emp : employes) {
            if (emp.getId() == null || emp.getId().isBlank()) {
                emp.setId("emp-" + System.nanoTime());
            }
            if (emp.getMatricule() == null || emp.getMatricule().isBlank()) {
                emp.setMatricule("EMP-" + (System.nanoTime() % 100000));
            }
            emp.setType(emp.getTauxSubvention() != null && emp.getTauxSubvention() > 0 ? "SUBVENTIONNE" : "AUTONOME");
        }
        return employeRepository.saveAll(employes);
    }

    public EmployeEntity updateTauxSubvention(String id, Integer taux) {
        EmployeEntity emp = employeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employé introuvable : " + id));
        emp.setTauxSubvention(taux);
        emp.setType(taux != null && taux > 0 ? "SUBVENTIONNE" : "AUTONOME");
        return employeRepository.save(emp);
    }

    public EmployeEntity toggleActif(String id) {
        EmployeEntity emp = employeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employé introuvable : " + id));
        boolean nextActif = !emp.isActif();
        emp.setActif(nextActif);
        if (!nextActif) {
            emp.setTauxSubvention(0);
            emp.setType("AUTONOME");
        }
        return employeRepository.save(emp);
    }
}
