package com.kikitraiteur.b2b.client.web;

import com.kikitraiteur.b2b.paiement.entity.PaiementWaveEntity;
import com.kikitraiteur.b2b.paiement.service.WavePaymentService;
import com.kikitraiteur.b2b.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/b2b/paiements/wave")
@RequiredArgsConstructor
@Tag(name = "Paiements Wave", description = "Checkout Wave (mode SIMULATION en standby ou LIVE), confirmation simulée et webhook")
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

    @Operation(summary = "Consulter le mode Wave actif", description = "Indique si le backend est en mode SIMULATION (standby) ou LIVE.")
    @GetMapping("/mode")
    public ApiResponse<Map<String, String>> getMode() {
        return ApiResponse.ok(Map.of("mode", wavePaymentService.getMode()));
    }

    @Operation(summary = "Initier un paiement Wave", description = "Crée une session de paiement Wave pour le reste à charge employé (ou marque PAYEE si 0 FCFA).")
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

    @Operation(summary = "Confirmer un paiement simulé", description = "Valide manuellement un paiement initié en mode SIMULATION (standby).")
    @PostMapping("/{id}/simulate-confirm")
    public ApiResponse<PaiementWaveEntity> confirmerSimulation(@PathVariable String id) {
        return ApiResponse.ok("Paiement simulé confirmé", wavePaymentService.confirmerSimulation(id));
    }

    @Operation(summary = "Webhook Wave Business", description = "Endpoint public recevant les callbacks de confirmation de paiement Wave.")
    @PostMapping("/webhook")
    public ApiResponse<Void> webhook(
            @RequestHeader(value = "Wave-Signature", required = false) String signature,
            @RequestBody Map<String, Object> payload
    ) {
        wavePaymentService.traiterWebhook(signature, payload);
        return ApiResponse.ok("Webhook traité", null);
    }
}
