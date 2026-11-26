package com.kikitraiteur.b2b.client.web;

import com.kikitraiteur.b2b.commande.data.entity.AlerteCommandeEntity;
import com.kikitraiteur.b2b.commande.data.repository.AlerteCommandeRepository;
import com.kikitraiteur.b2b.shared.exceptions.BusinessException;
import com.kikitraiteur.b2b.shared.exceptions.ResourceNotFoundException;
import com.kikitraiteur.b2b.shared.mail.EmailService;
import com.kikitraiteur.b2b.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/b2b/alertes")
@RequiredArgsConstructor
@Tag(name = "Alertes & Relances RH", description = "Envoi d'alertes plateforme et emails de rappel de commande via Brevo")
public class AlerteController {

    private final AlerteCommandeRepository alerteRepository;
    private final EmailService emailService;

    @Value("${app.frontend.url:https://btob-kiki.vercel.app}")
    private String frontendUrl;

    @Data
    public static class DestinataireRelance {
        private String email;
        private String nomComplet;
    }

    @Data
    public static class RelanceCommandeRequest {
        private String entrepriseId;
        private String entrepriseNom;
        private String expediteurNom;
        private String message;
        private List<DestinataireRelance> destinataires;
    }

    @PreAuthorize("hasAnyRole('RESPONSABLE_ENTREPRISE', 'SUPER_ADMIN')")
    @PostMapping("/relance")
    public ApiResponse<List<AlerteCommandeEntity>> envoyerRelance(@RequestBody RelanceCommandeRequest req) {
        if (req.getDestinataires() == null || req.getDestinataires().isEmpty()) {
            throw new BusinessException("Veuillez sélectionner au moins un collaborateur à relancer.");
        }
        String msg = (req.getMessage() != null && !req.getMessage().isBlank())
                ? req.getMessage().trim()
                : "Bonjour, n'oubliez pas de passer votre commande de repas avant la clôture du service.";
        String exp = (req.getExpediteurNom() != null && !req.getExpediteurNom().isBlank())
                ? req.getExpediteurNom().trim()
                : "Service RH";
        String base = (frontendUrl != null && !frontendUrl.isBlank() && !frontendUrl.contains("localhost"))
                ? frontendUrl.replaceAll("/+$", "")
                : "https://btob-kiki.vercel.app";
        String orderUrl = base + "/b2b/employe/menu";

        List<AlerteCommandeEntity> savedAll = new ArrayList<>();
        int emailsEnvoyes = 0;
        for (DestinataireRelance dest : req.getDestinataires()) {
            if (dest.getEmail() == null || dest.getEmail().isBlank()) {
                continue;
            }
            String email = dest.getEmail().trim().toLowerCase();
            String nom = (dest.getNomComplet() != null && !dest.getNomComplet().isBlank())
                    ? dest.getNomComplet().trim()
                    : email;

            AlerteCommandeEntity alerte = AlerteCommandeEntity.builder()
                    .id("alt-" + UUID.randomUUID().toString().substring(0, 10))
                    .entrepriseId(req.getEntrepriseId())
                    .employeEmail(email)
                    .employeNom(nom)
                    .expediteurNom(exp)
                    .message(msg)
                    .lu(false)
                    .createdAt(LocalDateTime.now())
                    .build();

            savedAll.add(alerteRepository.save(alerte));
            if (emailService.sendOrderReminderEmail(email, nom, req.getEntrepriseNom(), exp, msg, orderUrl)) {
                emailsEnvoyes++;
            }
        }

        return ApiResponse.ok(savedAll.size() + " alerte(s) créée(s) et " + emailsEnvoyes + " email(s) envoyé(s)", savedAll);
    }

    @GetMapping
    public ApiResponse<List<AlerteCommandeEntity>> getAlertes(
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String entrepriseId
    ) {
        if (email != null && !email.isBlank()) {
            return ApiResponse.ok(alerteRepository.findByEmployeEmailIgnoreCaseOrderByCreatedAtDesc(email.trim()));
        }
        if (entrepriseId != null && !entrepriseId.isBlank()) {
            return ApiResponse.ok(alerteRepository.findByEntrepriseIdOrderByCreatedAtDesc(entrepriseId.trim()));
        }
        return ApiResponse.ok(alerteRepository.findAll());
    }

    @PatchMapping("/{id}/lire")
    public ApiResponse<AlerteCommandeEntity> marquerLue(@PathVariable String id) {
        AlerteCommandeEntity alerte = alerteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alerte introuvable : " + id));
        alerte.setLu(true);
        return ApiResponse.ok(alerteRepository.save(alerte));
    }
}
