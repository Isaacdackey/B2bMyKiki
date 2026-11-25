package com.kikitraiteur.b2b.client.web;

import com.kikitraiteur.b2b.paiement.entity.PaiementWaveEntity;
import com.kikitraiteur.b2b.paiement.service.WavePaymentService;
import com.kikitraiteur.b2b.shared.response.ApiResponse;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/b2b/paiements/wave")
@RequiredArgsConstructor
public class PaiementController {

    private final WavePaymentService wavePaymentService;

    @Data
    public static class WaveCheckoutRequest {
        private String commandeId;
        private String entrepriseId;
        private String employeMatricule;
        private String employeNom;
        private Integer montantTotal;
        private Integer partEntreprise;
        private Integer partEmploye;
    }

    @GetMapping("/mode")
    public ApiResponse<Map<String, String>> getMode() {
        return ApiResponse.ok(Map.of("mode", wavePaymentService.getMode()));
    }

    @PostMapping("/checkout")
    public ApiResponse<PaiementWaveEntity> initierCheckout(@RequestBody WaveCheckoutRequest req) {
        PaiementWaveEntity p = wavePaymentService.initierCheckout(
                req.getCommandeId(),
                req.getEntrepriseId(),
                req.getEmployeMatricule(),
                req.getEmployeNom(),
                req.getMontantTotal(),
                req.getPartEntreprise(),
                req.getPartEmploye()
        );
        return ApiResponse.ok("Session de paiement Wave initialisée (" + p.getMode() + ")", p);
    }

    @PostMapping("/{id}/simulate-confirm")
    public ApiResponse<PaiementWaveEntity> confirmerSimulation(@PathVariable String id) {
        return ApiResponse.ok("Paiement simulé confirmé", wavePaymentService.confirmerSimulation(id));
    }

    @PostMapping("/webhook")
    public ApiResponse<Void> webhook(
            @RequestHeader(value = "Wave-Signature", required = false) String signature,
            @RequestBody Map<String, Object> payload
    ) {
        wavePaymentService.traiterWebhook(signature, payload);
        return ApiResponse.ok("Webhook traité", null);
    }
}
