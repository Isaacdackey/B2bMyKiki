package com.kikitraiteur.b2b.commande.service;

import com.kikitraiteur.b2b.commande.data.entity.CommandeSiteEntity;
import com.kikitraiteur.b2b.commande.data.repository.CommandeSiteRepository;
import com.kikitraiteur.b2b.commande.data.repository.ReclamationCutOffRepository;
import com.kikitraiteur.b2b.entreprise.data.entity.EntrepriseEntity;
import com.kikitraiteur.b2b.entreprise.data.entity.TypePrestationEntity;
import com.kikitraiteur.b2b.entreprise.data.repository.EntrepriseRepository;
import com.kikitraiteur.b2b.entreprise.data.repository.TypePrestationRepository;
import com.kikitraiteur.b2b.shared.exceptions.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CommandeServiceTest {

    @Mock
    private CommandeSiteRepository commandeRepository;
    @Mock
    private ReclamationCutOffRepository reclamationRepository;
    @Mock
    private EntrepriseRepository entrepriseRepository;
    @Mock
    private TypePrestationRepository typePrestationRepository;

    private CommandeService commandeService;

    @BeforeEach
    void setUp() {
        commandeService = new CommandeService(
                commandeRepository,
                reclamationRepository,
                entrepriseRepository,
                typePrestationRepository
        );
    }

    @Test
    void createCommande_rejeteSiCutOffJoursAvantDepasse() {
        EntrepriseEntity ent = EntrepriseEntity.builder()
                .id("ent-1")
                .nom("Test Ent")
                .codeEntreprise("TST-1")
                .cutOffJoursAvant(2) // J-2
                .cutOffHeure("08:00")
                .categoriesAutorisees(List.of("PLAT"))
                .build();

        when(entrepriseRepository.findById("ent-1")).thenReturn(Optional.of(ent));
        when(reclamationRepository.findByEntrepriseId("ent-1")).thenReturn(List.of());

        CommandeSiteEntity cmd = CommandeSiteEntity.builder()
                .entrepriseId("ent-1")
                .categorie("PLAT")
                .platNom("Poulet Yassa")
                .date(LocalDate.now().plusDays(1).toString()) // Pour demain alors que cut-off est J-2
                .matricule("EMP-01")
                .build();

        BusinessException ex = assertThrows(BusinessException.class, () -> commandeService.createCommande(cmd));
        assertTrue(ex.getMessage().contains("J-2"));
    }

    @Test
    void createCommande_autoriseSiDansLesDelaisCutOffJoursAvant() {
        EntrepriseEntity ent = EntrepriseEntity.builder()
                .id("ent-1")
                .nom("Test Ent")
                .codeEntreprise("TST-1")
                .cutOffJoursAvant(1) // J-1
                .cutOffHeure("23:59")
                .categoriesAutorisees(List.of("PLAT"))
                .build();

        when(entrepriseRepository.findById("ent-1")).thenReturn(Optional.of(ent));
        when(commandeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CommandeSiteEntity cmd = CommandeSiteEntity.builder()
                .entrepriseId("ent-1")
                .categorie("PLAT")
                .platNom("Poulet Yassa")
                .date(LocalDate.now().plusDays(3).toString())
                .matricule("EMP-01")
                .build();

        CommandeSiteEntity saved = commandeService.createCommande(cmd);
        assertNotNull(saved.getId());
        assertEquals("EN_COURS", saved.getStatut());
    }

    @Test
    void createCommande_rejeteSiJourNonDisponibleDansTypePrestation() {
        EntrepriseEntity ent = EntrepriseEntity.builder()
                .id("ent-1")
                .nom("Test Ent")
                .codeEntreprise("TST-1")
                .typePrestation("LIVRAISON_BARQUETTES")
                .cutOffJoursAvant(0)
                .cutOffHeure("23:59")
                .categoriesAutorisees(List.of("PLAT"))
                .build();

        TypePrestationEntity tp = TypePrestationEntity.builder()
                .code("LIVRAISON_BARQUETTES")
                .libelle("Livraison barquettes")
                .joursDisponibles(List.of("Lundi")) // Uniquement Lundi
                .build();

        when(entrepriseRepository.findById("ent-1")).thenReturn(Optional.of(ent));
        when(typePrestationRepository.findById("LIVRAISON_BARQUETTES")).thenReturn(Optional.of(tp));

        // Trouver une date future qui n'est pas un Lundi (ex: Mardi)
        LocalDate dateTest = LocalDate.now().plusDays(1);
        if (dateTest.getDayOfWeek().getValue() == 1) {
            dateTest = dateTest.plusDays(1);
        }
        final String dateStr = dateTest.toString();

        CommandeSiteEntity cmd = CommandeSiteEntity.builder()
                .entrepriseId("ent-1")
                .categorie("PLAT")
                .platNom("Poulet Yassa")
                .date(dateStr)
                .matricule("EMP-01")
                .build();

        assertThrows(BusinessException.class, () -> commandeService.createCommande(cmd));
    }
}
