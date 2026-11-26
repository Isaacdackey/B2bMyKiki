package com.kikitraiteur.b2b.client.web;

import com.kikitraiteur.b2b.entreprise.data.entity.EntrepriseEntity;
import com.kikitraiteur.b2b.entreprise.data.entity.InvitationAdminEntity;
import com.kikitraiteur.b2b.entreprise.data.entity.SiteEntity;
import com.kikitraiteur.b2b.entreprise.service.EntrepriseService;
import com.kikitraiteur.b2b.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/b2b/entreprises")
@RequiredArgsConstructor
@Tag(name = "Entreprises & Conventions", description = "Gestion des entreprises clientes, sites de livraison, conventions et invitations administrateurs")
public class EntrepriseController {

    private final EntrepriseService entrepriseService;

    @Operation(summary = "Lister les entreprises", description = "Retourne la liste complète des entreprises clientes et leurs sites.")
    @GetMapping
    public ApiResponse<List<EntrepriseEntity>> getAll() {
        return ApiResponse.ok(entrepriseService.findAll());
    }

    @Operation(summary = "Détail d'une entreprise", description = "Retourne une entreprise par son identifiant.")
    @GetMapping("/{id}")
    public ApiResponse<EntrepriseEntity> getById(@PathVariable String id) {
        return ApiResponse.ok(entrepriseService.findById(id));
    }

    @Operation(summary = "Créer une entreprise", description = "Crée une nouvelle entreprise partenaire et sa convention (Super Admin uniquement).")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @PostMapping
    public ApiResponse<EntrepriseEntity> create(@RequestBody EntrepriseEntity ent) {
        return ApiResponse.ok("Entreprise créée", entrepriseService.create(ent));
    }

    @Operation(summary = "Modifier une entreprise", description = "Met à jour les informations, le cut-off, la prestation et les catégories autorisées d'une entreprise.")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @PutMapping("/{id}")
    public ApiResponse<EntrepriseEntity> update(@PathVariable String id, @RequestBody EntrepriseEntity ent) {
        return ApiResponse.ok("Entreprise mise à jour", entrepriseService.update(id, ent));
    }

    @Operation(summary = "Archiver / Désarchiver une entreprise", description = "Bascule le statut d'archivage d'une entreprise.")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @PatchMapping("/{id}/archive")
    public ApiResponse<EntrepriseEntity> toggleArchive(@PathVariable String id) {
        return ApiResponse.ok("Statut archivage modifié", entrepriseService.toggleArchive(id));
    }

    @Operation(summary = "Ajouter un site à une entreprise", description = "Crée un nouveau site de livraison rattaché à l'entreprise.")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @PostMapping("/{id}/sites")
    public ApiResponse<SiteEntity> addSite(@PathVariable String id, @RequestBody SiteEntity site) {
        return ApiResponse.ok("Site ajouté", entrepriseService.addSite(id, site));
    }

    @Operation(summary = "Lister toutes les invitations", description = "Retourne toutes les invitations administrateurs (RH & Site).")
    @GetMapping("/invitations")
    public ApiResponse<List<InvitationAdminEntity>> getAllInvitations() {
        return ApiResponse.ok(entrepriseService.getAllInvitations());
    }

    @Operation(summary = "Lister les invitations d'une entreprise", description = "Retourne les invitations administrateurs liées à une entreprise donnée.")
    @GetMapping("/{id}/invitations")
    public ApiResponse<List<InvitationAdminEntity>> getInvitations(@PathVariable String id) {
        return ApiResponse.ok(entrepriseService.getInvitations(id));
    }

    @Operation(summary = "Inviter un administrateur (RH ou Site)", description = "Crée une invitation et envoie un lien d'activation par email via Brevo.")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @PostMapping("/{id}/invitations")
    public ApiResponse<InvitationAdminEntity> createInvitation(@PathVariable String id, @RequestBody InvitationAdminEntity inv) {
        return ApiResponse.ok("Invitation générée et envoyée par email", entrepriseService.createInvitation(id, inv));
    }

    @Operation(summary = "Renvoyer une invitation par email", description = "Renvoie l'email d'activation Brevo pour une invitation encore en attente.")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @PostMapping("/{id}/invitations/{invitationId}/resend")
    public ApiResponse<InvitationAdminEntity> resendInvitation(
            @PathVariable String id,
            @PathVariable String invitationId
    ) {
        return ApiResponse.ok("Invitation renvoyée par email", entrepriseService.resendInvitation(id, invitationId));
    }
}
