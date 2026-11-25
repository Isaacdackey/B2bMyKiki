package com.kikitraiteur.b2b.paiement.service;

import com.kikitraiteur.b2b.paiement.entity.PaiementWaveEntity;
import com.kikitraiteur.b2b.paiement.repository.PaiementWaveRepository;
import com.kikitraiteur.b2b.shared.exceptions.BusinessException;
import com.kikitraiteur.b2b.shared.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class WavePaymentService {

    private static final String WAVE_CHECKOUT_URL = "https://api.wave.com/v1/checkout/sessions";

    private final PaiementWaveRepository paiementRepository;

    @Value("${app.wave.mode:SIMULATION}")
    private String waveMode;

    @Value("${app.wave.api-key:}")
    private String waveApiKey;

    @Value("${app.wave.webhook-secret:}")
    private String waveWebhookSecret;

    @Value("${app.frontend.url:https://btob-kiki.vercel.app}")
    private String frontendUrl;

    public String getMode() {
        return "LIVE".equalsIgnoreCase(waveMode) ? "LIVE" : "SIMULATION";
    }

    public PaiementWaveEntity initierCheckout(
            String commandeId,
            String entrepriseId,
            String employeMatricule,
            String employeNom,
            Integer montantTotal,
            Integer partEntreprise,
            Integer partEmploye
    ) {
        int reste = partEmploye != null ? Math.max(0, partEmploye) : 0;
        String id = "pay-" + UUID.randomUUID().toString().substring(0, 10);
        String mode = getMode();

        if (reste == 0) {
            return paiementRepository.save(PaiementWaveEntity.builder()
                    .id(id)
                    .commandeId(commandeId)
                    .entrepriseId(entrepriseId)
                    .employeMatricule(employeMatricule)
                    .employeNom(employeNom)
                    .montantTotal(montantTotal)
                    .partEntreprise(partEntreprise)
                    .partEmploye(0)
                    .statut("PAYEE")
                    .mode(mode)
                    .createdAt(LocalDateTime.now())
                    .paidAt(LocalDateTime.now())
                    .build());
        }

        if ("LIVE".equals(mode)) {
            if (waveApiKey == null || waveApiKey.isBlank()) {
                throw new BusinessException("WAVE_API_KEY manquante pour le mode LIVE.");
            }
            String base = frontendUrl.replaceAll("/+$", "");
            Map<String, Object> body = Map.of(
                    "amount", String.valueOf(reste),
                    "currency", "XOF",
                    "client_reference", commandeId != null ? commandeId : id,
                    "success_url", base + "/b2b/employe/commandes?wave=success&ref=" + id,
                    "error_url", base + "/b2b/employe/menu?wave=error&ref=" + id
            );
            @SuppressWarnings("unchecked")
            Map<String, Object> waveRes = RestClient.create().post()
                    .uri(WAVE_CHECKOUT_URL)
                    .header("Authorization", "Bearer " + waveApiKey.trim())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            String sessionId = waveRes != null ? String.valueOf(waveRes.get("id")) : id;
            String launchUrl = waveRes != null ? String.valueOf(waveRes.get("wave_launch_url")) : "";

            return paiementRepository.save(PaiementWaveEntity.builder()
                    .id(id)
                    .commandeId(commandeId)
                    .entrepriseId(entrepriseId)
                    .employeMatricule(employeMatricule)
                    .employeNom(employeNom)
                    .montantTotal(montantTotal)
                    .partEntreprise(partEntreprise)
                    .partEmploye(reste)
                    .statut("EN_ATTENTE_PAIEMENT")
                    .mode("LIVE")
                    .waveSessionId(sessionId)
                    .waveLaunchUrl(launchUrl)
                    .createdAt(LocalDateTime.now())
                    .build());
        }

        // Mode SIMULATION (Standby)
        String simSessionId = "sim-wave-" + UUID.randomUUID().toString().substring(0, 8);
        String base = frontendUrl.replaceAll("/+$", "");
        return paiementRepository.save(PaiementWaveEntity.builder()
                .id(id)
                .commandeId(commandeId)
                .entrepriseId(entrepriseId)
                .employeMatricule(employeMatricule)
                .employeNom(employeNom)
                .montantTotal(montantTotal)
                .partEntreprise(partEntreprise)
                .partEmploye(reste)
                .statut("EN_ATTENTE_PAIEMENT")
                .mode("SIMULATION")
                .waveSessionId(simSessionId)
                .waveLaunchUrl(base + "/b2b/employe/menu?waveSim=" + id)
                .createdAt(LocalDateTime.now())
                .build());
    }

    public PaiementWaveEntity confirmerSimulation(String paiementId) {
        if (!"SIMULATION".equals(getMode())) {
            throw new BusinessException("Confirmation simulée désactivée en mode LIVE.");
        }
        PaiementWaveEntity p = paiementRepository.findById(paiementId)
                .orElseThrow(() -> new ResourceNotFoundException("Paiement introuvable : " + paiementId));
        p.setStatut("PAYEE");
        p.setPaidAt(LocalDateTime.now());
        return paiementRepository.save(p);
    }

    public void traiterWebhook(String signatureHeader, Map<String, Object> payload) {
        if ("LIVE".equals(getMode()) && waveWebhookSecret != null && !waveWebhookSecret.isBlank()) {
            if (signatureHeader == null || signatureHeader.isBlank()) {
                throw new BusinessException("Signature Wave manquante.");
            }
        }
        Object dataObj = payload.get("data");
        if (dataObj instanceof Map<?, ?> dataMap) {
            Object sessionObj = dataMap.get("id");
            if (sessionObj != null) {
                paiementRepository.findByWaveSessionId(String.valueOf(sessionObj)).ifPresent(p -> {
                    p.setStatut("PAYEE");
                    p.setPaidAt(LocalDateTime.now());
                    paiementRepository.save(p);
                    log.info("Paiement Wave {} confirmé via webhook.", p.getId());
                });
            }
        }
    }
}
