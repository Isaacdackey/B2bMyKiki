package com.kikitraiteur.b2b.planning.service;

import com.kikitraiteur.b2b.catalogue.data.entity.PlatEntity;
import com.kikitraiteur.b2b.catalogue.data.repository.PlatRepository;
import com.kikitraiteur.b2b.entreprise.data.entity.EntrepriseEntity;
import com.kikitraiteur.b2b.entreprise.data.repository.EmployeRepository;
import com.kikitraiteur.b2b.entreprise.data.repository.EntrepriseRepository;
import com.kikitraiteur.b2b.planning.data.entity.LigneMenuPlanifieEntity;
import com.kikitraiteur.b2b.planning.data.entity.MenuPlanifieJourEntity;
import com.kikitraiteur.b2b.planning.data.repository.LigneMenuPlanifieRepository;
import com.kikitraiteur.b2b.planning.data.repository.MenuPlanifieJourRepository;
import com.kikitraiteur.b2b.shared.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlanningService {

    private final MenuPlanifieJourRepository menuRepository;
    private final LigneMenuPlanifieRepository ligneRepository;
    private final PlatRepository platRepository;
    private final EntrepriseRepository entrepriseRepository;
    private final EmployeRepository employeRepository;

    public List<MenuPlanifieJourEntity> findByEntreprise(String entrepriseId) {
        if (entrepriseId == null || entrepriseId.isBlank() || "TOUTES".equalsIgnoreCase(entrepriseId)) {
            return menuRepository.findAll();
        }
        return menuRepository.findByEntrepriseId(entrepriseId);
    }

    public MenuPlanifieJourEntity ajouterPlatAuJour(String entrepriseId, String jourNom, String platId, Integer quantitePrevue) {
        PlatEntity plat = platRepository.findById(platId)
                .orElseThrow(() -> new ResourceNotFoundException("Plat introuvable : " + platId));

        MenuPlanifieJourEntity menu = menuRepository.findByEntrepriseIdAndJourNom(entrepriseId, jourNom)
                .orElseGet(() -> MenuPlanifieJourEntity.builder()
                        .id("menu-" + entrepriseId + "-" + jourNom.toLowerCase())
                        .entrepriseId(entrepriseId)
                        .jourNom(jourNom)
                        .dateStr(LocalDate.now().toString())
                        .theme("Menu du " + jourNom)
                        .lignes(new ArrayList<>())
                        .build());

        LigneMenuPlanifieEntity ligne = LigneMenuPlanifieEntity.builder()
                .id("lig-" + System.currentTimeMillis())
                .categorie(plat.getCategorie())
                .platId(plat.getId())
                .nomPlat(plat.getNom())
                .image(plat.getImage())
                .quantitePrevue(quantitePrevue != null ? quantitePrevue : 0)
                .disponible(true)
                .menuPlanifie(menu)
                .build();

        menu.getLignes().add(ligne);
        recalculerConformite(menu);
        return menuRepository.save(menu);
    }

    public MenuPlanifieJourEntity dupliquerJour(String entrepriseId, String jourSource, String jourCible) {
        MenuPlanifieJourEntity source = menuRepository.findByEntrepriseIdAndJourNom(entrepriseId, jourSource)
                .orElseThrow(() -> new ResourceNotFoundException("Menu source introuvable pour " + jourSource));

        MenuPlanifieJourEntity cible = menuRepository.findByEntrepriseIdAndJourNom(entrepriseId, jourCible)
                .orElseGet(() -> MenuPlanifieJourEntity.builder()
                        .id("menu-" + entrepriseId + "-" + jourCible.toLowerCase())
                        .entrepriseId(entrepriseId)
                        .jourNom(jourCible)
                        .dateStr(LocalDate.now().toString())
                        .lignes(new ArrayList<>())
                        .build());

        cible.setTheme(source.getTheme());
        cible.getLignes().clear();
        for (LigneMenuPlanifieEntity l : source.getLignes()) {
            cible.getLignes().add(LigneMenuPlanifieEntity.builder()
                    .id("lig-" + System.nanoTime())
                    .categorie(l.getCategorie())
                    .platId(l.getPlatId())
                    .nomPlat(l.getNomPlat())
                    .image(l.getImage())
                    .quantitePrevue(l.getQuantitePrevue())
                    .disponible(l.isDisponible())
                    .menuPlanifie(cible)
                    .build());
        }
        recalculerConformite(cible);
        return menuRepository.save(cible);
    }

    public List<MenuPlanifieJourEntity> reconduireSemaine(String entrepriseId) {
        List<MenuPlanifieJourEntity> menus = menuRepository.findByEntrepriseId(entrepriseId);
        for (MenuPlanifieJourEntity m : menus) {
            if (m.getDateStr() != null && !m.getDateStr().isBlank()) {
                m.setDateStr(LocalDate.parse(m.getDateStr()).plusDays(7).toString());
            }
        }
        return menuRepository.saveAll(menus);
    }

    public int deployerVersToutesEntreprises(String sourceEntrepriseId) {
        List<MenuPlanifieJourEntity> modele = menuRepository.findByEntrepriseId(sourceEntrepriseId);
        Set<String> archivedPlatIds = platRepository.findAll().stream()
                .filter(PlatEntity::isArchive)
                .map(PlatEntity::getId)
                .collect(Collectors.toSet());

        // Nettoyer d'abord les plats archivés dans le modèle source lui-même
        for (MenuPlanifieJourEntity mSource : modele) {
            boolean removed = mSource.getLignes().removeIf(l -> archivedPlatIds.contains(l.getPlatId()));
            if (removed) {
                recalculerConformite(mSource);
                menuRepository.save(mSource);
            }
        }

        List<EntrepriseEntity> entreprises = entrepriseRepository.findAll().stream()
                .filter(e -> !e.isArchivee() && !e.getId().equals(sourceEntrepriseId))
                .toList();

        int count = 1;
        for (EntrepriseEntity ent : entreprises) {
            for (MenuPlanifieJourEntity mSource : modele) {
                MenuPlanifieJourEntity cible = menuRepository.findByEntrepriseIdAndJourNom(ent.getId(), mSource.getJourNom())
                        .orElseGet(() -> MenuPlanifieJourEntity.builder()
                                .id("menu-" + ent.getId() + "-" + mSource.getJourNom().toLowerCase())
                                .entrepriseId(ent.getId())
                                .jourNom(mSource.getJourNom())
                                .dateStr(mSource.getDateStr())
                                .theme(mSource.getTheme())
                                .lignes(new ArrayList<>())
                                .build());

                cible.getLignes().clear();
                for (LigneMenuPlanifieEntity l : mSource.getLignes()) {
                    if (archivedPlatIds.contains(l.getPlatId())) continue;
                    if (ent.getCategoriesAutorisees().isEmpty() || ent.getCategoriesAutorisees().contains(l.getCategorie())) {
                        cible.getLignes().add(LigneMenuPlanifieEntity.builder()
                                .id("lig-" + System.nanoTime())
                                .categorie(l.getCategorie())
                                .platId(l.getPlatId())
                                .nomPlat(l.getNomPlat())
                                .image(l.getImage())
                                .quantitePrevue(0)
                                .disponible(true)
                                .menuPlanifie(cible)
                                .build());
                    }
                }
                recalculerConformite(cible);
                menuRepository.save(cible);
            }
            count++;
        }
        return count;
    }

    public LigneMenuPlanifieEntity updateQuantite(String ligneId, Integer quantite) {
        LigneMenuPlanifieEntity ligne = ligneRepository.findById(ligneId)
                .orElseThrow(() -> new ResourceNotFoundException("Ligne de menu introuvable : " + ligneId));
        ligne.setQuantitePrevue(quantite);
        LigneMenuPlanifieEntity saved = ligneRepository.save(ligne);

        MenuPlanifieJourEntity menu = ligne.getMenuPlanifie();
        if (menu != null) {
            recalculerConformite(menu);
            menuRepository.save(menu);
        }
        return saved;
    }

    public void deleteLigne(String ligneId) {
        ligneRepository.deleteById(ligneId);
    }

    private void recalculerConformite(MenuPlanifieJourEntity menu) {
        boolean allZero = menu.getLignes().stream().allMatch(l -> l.getQuantitePrevue() == null || l.getQuantitePrevue() <= 0);
        menu.setQuantitesSaisies(!allZero);
        if (allZero || menu.getLignes().isEmpty()) {
            menu.setStatutConformite("NON_SAISI");
            return;
        }
        long minEffectif = 1;
        if (menu.getEntrepriseId() != null && !menu.getEntrepriseId().isBlank()) {
            long count = employeRepository.findByEntrepriseId(menu.getEntrepriseId()).stream()
                    .filter(e -> e.isActif() && (e.getType() == null || "SUBVENTIONNE".equalsIgnoreCase(e.getType())))
                    .count();
            if (count > 0) {
                minEffectif = count;
            }
        }
        Map<String, Integer> sommesParCategorie = menu.getLignes().stream()
                .filter(l -> l.getCategorie() != null)
                .collect(Collectors.groupingBy(
                        LigneMenuPlanifieEntity::getCategorie,
                        Collectors.summingInt(l -> l.getQuantitePrevue() != null ? l.getQuantitePrevue() : 0)
                ));
        final long seuil = minEffectif;
        boolean conforme = !sommesParCategorie.isEmpty()
                && sommesParCategorie.values().stream().allMatch(somme -> somme >= seuil);
        menu.setStatutConformite(conforme ? "CONFORME" : "NON_CONFORME");
    }
}
