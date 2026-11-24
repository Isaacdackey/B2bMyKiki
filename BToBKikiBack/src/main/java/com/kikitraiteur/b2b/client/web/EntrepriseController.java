package com.kikitraiteur.b2b.client.web;

import com.kikitraiteur.b2b.entreprise.data.entity.EntrepriseEntity;
import com.kikitraiteur.b2b.entreprise.data.entity.InvitationAdminEntity;
import com.kikitraiteur.b2b.entreprise.data.entity.SiteEntity;
import com.kikitraiteur.b2b.entreprise.service.EntrepriseService;
import com.kikitraiteur.b2b.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/b2b/entreprises")
@RequiredArgsConstructor
public class EntrepriseController {

    private final EntrepriseService entrepriseService;

    @GetMapping
    public ApiResponse<List<EntrepriseEntity>> getAll() {
        return ApiResponse.ok(entrepriseService.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<EntrepriseEntity> getById(@PathVariable String id) {
        return ApiResponse.ok(entrepriseService.findById(id));
    }

    @PostMapping
    public ApiResponse<EntrepriseEntity> create(@RequestBody EntrepriseEntity ent) {
        return ApiResponse.ok("Entreprise créée", entrepriseService.create(ent));
    }

    @PutMapping("/{id}")
    public ApiResponse<EntrepriseEntity> update(@PathVariable String id, @RequestBody EntrepriseEntity ent) {
        return ApiResponse.ok("Entreprise mise à jour", entrepriseService.update(id, ent));
    }

    @PatchMapping("/{id}/archive")
    public ApiResponse<EntrepriseEntity> toggleArchive(@PathVariable String id) {
        return ApiResponse.ok("Statut archivage modifié", entrepriseService.toggleArchive(id));
    }

    @PostMapping("/{id}/sites")
    public ApiResponse<SiteEntity> addSite(@PathVariable String id, @RequestBody SiteEntity site) {
        return ApiResponse.ok("Site ajouté", entrepriseService.addSite(id, site));
    }

    @GetMapping("/invitations")
    public ApiResponse<List<InvitationAdminEntity>> getAllInvitations() {
        return ApiResponse.ok(entrepriseService.getAllInvitations());
    }

    @GetMapping("/{id}/invitations")
    public ApiResponse<List<InvitationAdminEntity>> getInvitations(@PathVariable String id) {
        return ApiResponse.ok(entrepriseService.getInvitations(id));
    }

    @PostMapping("/{id}/invitations")
    public ApiResponse<InvitationAdminEntity> createInvitation(@PathVariable String id, @RequestBody InvitationAdminEntity inv) {
        return ApiResponse.ok("Invitation générée et envoyée par email", entrepriseService.createInvitation(id, inv));
    }

    @PostMapping("/{id}/invitations/{invitationId}/resend")
    public ApiResponse<InvitationAdminEntity> resendInvitation(
            @PathVariable String id,
            @PathVariable String invitationId
    ) {
        return ApiResponse.ok("Invitation renvoyée par email", entrepriseService.resendInvitation(id, invitationId));
    }
}
