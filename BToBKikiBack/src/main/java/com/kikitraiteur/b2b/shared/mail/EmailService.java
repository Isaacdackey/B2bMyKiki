package com.kikitraiteur.b2b.shared.mail;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private static final String BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${app.brevo.api-key:}")
    private String brevoApiKey;

    @Value("${app.brevo.sender-email:noreply@kikitraiteur.sn}")
    private String senderEmail;

    @Value("${app.brevo.sender-name:Kiki Traiteur B2B}")
    private String senderName;

    @Value("${spring.mail.username:}")
    private String smtpUsername;

    public boolean sendAdminInvitationEmail(
            String toEmail,
            String nomComplet,
            String roleLibelle,
            String entrepriseNom,
            String activationUrl
    ) {
        String subject = "Invitation Kiki Traiteur B2B — Activez votre accès " + roleLibelle;
        String safeName = escapeHtml(nomComplet);
        String safeRole = escapeHtml(roleLibelle);
        String safeEntreprise = escapeHtml(entrepriseNom);

        String roleLower = roleLibelle != null ? roleLibelle.toLowerCase() : "";
        String ctaLabel = (roleLower.contains("admin") || roleLower.contains("rh") || roleLower.contains("responsable"))
                ? "Activer mon compte administrateur"
                : "Activer mon compte salarié";

        String html = buildEmailLayout(
                "Bienvenue sur Kiki Traiteur B2B",
                "<p>Bonjour <strong>" + safeName + "</strong>,</p>"
                        + "<p>Vous avez été désigné(e) en tant que <strong>" + safeRole + "</strong> "
                        + "pour l'entreprise <strong>" + safeEntreprise + "</strong> sur le portail Kiki Traiteur B2B.</p>"
                        + "<p>Cliquez sur le bouton ci-dessous pour définir votre mot de passe et activer votre espace :</p>"
                        + buildCtaButton(activationUrl, ctaLabel)
                        + "<p style=\"font-size:13px;color:#6E5A56;margin-top:20px;\">"
                        + "Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>"
                        + "<a href=\"" + escapeHtml(activationUrl) + "\" style=\"color:#721513;word-break:break-all;\">"
                        + escapeHtml(activationUrl) + "</a></p>"
        );

        return sendHtmlEmail(toEmail, nomComplet, subject, html);
    }

    public boolean sendOrderReminderEmail(
            String toEmail,
            String nomComplet,
            String entrepriseNom,
            String expediteurNom,
            String message,
            String orderUrl
    ) {
        String subject = "Rappel commande repas — " + (entrepriseNom != null && !entrepriseNom.isBlank() ? entrepriseNom : "Kiki Traiteur B2B");
        String safeName = escapeHtml(nomComplet != null && !nomComplet.isBlank() ? nomComplet : toEmail);
        String safeExp = escapeHtml(expediteurNom != null && !expediteurNom.isBlank() ? expediteurNom : "Votre service RH");
        String safeMsg = escapeHtml(message != null && !message.isBlank() ? message : "N'oubliez pas de passer votre commande de repas avant l'heure limite.");

        String html = buildEmailLayout(
                "Alerte de commande repas",
                "<p>Bonjour <strong>" + safeName + "</strong>,</p>"
                        + "<p>Vous avez reçu un message de relance de la part de <strong>" + safeExp + "</strong> :</p>"
                        + "<div style=\"background:#FAF8F4;border-left:4px solid #721513;padding:14px 16px;border-radius:8px;margin:16px 0;color:#332724;\">"
                        + safeMsg.replace("\n", "<br>")
                        + "</div>"
                        + "<p>Cliquez sur le bouton ci-dessous pour rejoindre la plateforme et effectuer votre commande :</p>"
                        + buildCtaButton(orderUrl, "Rejoindre la plateforme et commander")
                        + "<p style=\"font-size:12px;color:#6E5A56;margin-top:16px;\">"
                        + "Lien direct : <a href=\"" + escapeHtml(orderUrl) + "\" style=\"color:#721513;word-break:break-all;\">"
                        + escapeHtml(orderUrl) + "</a></p>"
        );

        return sendHtmlEmail(toEmail, nomComplet, subject, html);
    }

    public boolean sendPasswordResetEmail(String toEmail, String nomComplet, String resetUrl) {
        String subject = "Réinitialisation de votre mot de passe — Kiki Traiteur B2B";
        String safeName = escapeHtml(nomComplet != null && !nomComplet.isBlank() ? nomComplet : toEmail);

        String html = buildEmailLayout(
                "Réinitialisation de mot de passe",
                "<p>Bonjour <strong>" + safeName + "</strong>,</p>"
                        + "<p>Nous avons reçu une demande de réinitialisation du mot de passe de votre compte Kiki Traiteur B2B.</p>"
                        + "<p>Ce lien est valable pendant <strong>30 minutes</strong> :</p>"
                        + buildCtaButton(resetUrl, "Réinitialiser mon mot de passe")
                        + "<p style=\"font-size:13px;color:#6E5A56;margin-top:20px;\">"
                        + "Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité.</p>"
                        + "<p style=\"font-size:12px;color:#6E5A56;\">"
                        + "Lien direct : <a href=\"" + escapeHtml(resetUrl) + "\" style=\"color:#721513;word-break:break-all;\">"
                        + escapeHtml(resetUrl) + "</a></p>"
        );

        return sendHtmlEmail(toEmail, nomComplet, subject, html);
    }

    public boolean sendHtmlEmail(String toEmail, String toName, String subject, String htmlContent) {
        String apiKey = brevoApiKey != null ? brevoApiKey.trim() : "";
        String fromEmail = (senderEmail != null && !senderEmail.isBlank()) ? senderEmail.trim() : "noreply@kikitraiteur.sn";
        String fromName = (senderName != null && !senderName.isBlank()) ? senderName.trim() : "Kiki Traiteur B2B";

        if (!apiKey.isEmpty()) {
            try {
                RestClient restClient = RestClient.create();
                Map<String, Object> payload = Map.of(
                        "sender", Map.of("name", fromName, "email", fromEmail),
                        "to", List.of(Map.of(
                                "email", toEmail.trim(),
                                "name", (toName != null && !toName.isBlank()) ? toName.trim() : toEmail.trim()
                        )),
                        "subject", subject,
                        "htmlContent", htmlContent
                );

                restClient.post()
                        .uri(BREVO_API_URL)
                        .header("api-key", apiKey)
                        .header("accept", MediaType.APPLICATION_JSON_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(payload)
                        .retrieve()
                        .toBodilessEntity();

                log.info("Email Brevo envoye avec succes a {} ({})", toEmail, subject);
                return true;
            } catch (RestClientResponseException ex) {
                log.error("Echec envoi email via API Brevo pour {} [HTTP {}]: {}", toEmail, ex.getStatusCode(), ex.getResponseBodyAsString());
            } catch (Exception ex) {
                log.error("Echec envoi email via API Brevo pour {}: {}", toEmail, ex.getMessage());
            }
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender != null && smtpUsername != null && !smtpUsername.isBlank()) {
            try {
                MimeMessage mimeMessage = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, StandardCharsets.UTF_8.name());
                helper.setFrom(senderEmail, senderName);
                helper.setTo(toEmail);
                helper.setSubject(subject);
                helper.setText(htmlContent, true);
                mailSender.send(mimeMessage);
                log.info("Email SMTP envoye avec succes a {} ({})", toEmail, subject);
                return true;
            } catch (Exception ex) {
                log.error("Echec envoi email via SMTP pour {}: {}", toEmail, ex.getMessage());
            }
        }

        log.warn("Aucun transport email configure (BREVO_API_KEY / SMTP). Email non envoye a {} ({})", toEmail, subject);
        return false;
    }

    private String buildEmailLayout(String title, String bodyHtml) {
        return "<div style=\"background-color:#FAF8F4;padding:32px 16px;font-family:'Segoe UI',Arial,sans-serif;color:#1E293B;\">"
                + "<div style=\"max-width:560px;margin:0 auto;background:#FFFFFF;border:1.5px solid #EDE7DC;border-radius:18px;overflow:hidden;\">"
                + "<div style=\"background:#721513;padding:24px 28px;text-align:center;\">"
                + "<h1 style=\"margin:0;color:#FFFFFF;font-size:22px;letter-spacing:0.3px;\">Kiki Traiteur B2B</h1>"
                + "<p style=\"margin:6px 0 0;color:#F6E7D8;font-size:13px;\">" + escapeHtml(title) + "</p>"
                + "</div>"
                + "<div style=\"padding:28px;font-size:15px;line-height:1.6;\">"
                + bodyHtml
                + "</div>"
                + "<div style=\"background:#FAF8F4;padding:16px 28px;border-top:1px solid #EDE7DC;font-size:12px;color:#6E5A56;text-align:center;\">"
                + "Kiki Traiteur • Restauration d'Entreprise &amp; Conventions Salariés — Dakar, Sénégal"
                + "</div>"
                + "</div>"
                + "</div>";
    }

    private String buildCtaButton(String url, String label) {
        return "<div style=\"text-align:center;margin:24px 0;\">"
                + "<a href=\"" + escapeHtml(url) + "\" "
                + "style=\"display:inline-block;background:#721513;color:#FFFFFF;text-decoration:none;"
                + "font-weight:700;font-size:14px;padding:13px 26px;border-radius:9999px;\">"
                + escapeHtml(label)
                + "</a></div>";
    }

    private String escapeHtml(String input) {
        if (input == null) return "";
        return input
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
