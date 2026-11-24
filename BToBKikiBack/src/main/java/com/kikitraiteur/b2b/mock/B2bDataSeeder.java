package com.kikitraiteur.b2b.mock;

import com.kikitraiteur.b2b.auth.entity.RoleName;
import com.kikitraiteur.b2b.auth.entity.UserEntity;
import com.kikitraiteur.b2b.auth.repository.UserRepository;
import com.kikitraiteur.b2b.catalogue.data.entity.PlatEntity;
import com.kikitraiteur.b2b.catalogue.data.repository.PlatRepository;
import com.kikitraiteur.b2b.commande.data.entity.CommandeSiteEntity;
import com.kikitraiteur.b2b.commande.data.entity.ReclamationCutOffEntity;
import com.kikitraiteur.b2b.commande.data.repository.CommandeSiteRepository;
import com.kikitraiteur.b2b.commande.data.repository.ReclamationCutOffRepository;
import com.kikitraiteur.b2b.entreprise.data.entity.EmployeEntity;
import com.kikitraiteur.b2b.entreprise.data.entity.EntrepriseEntity;
import com.kikitraiteur.b2b.entreprise.data.entity.SiteEntity;
import com.kikitraiteur.b2b.entreprise.data.repository.EmployeRepository;
import com.kikitraiteur.b2b.entreprise.data.repository.EntrepriseRepository;
import com.kikitraiteur.b2b.facturation.data.entity.FacturationJournaliereEntity;
import com.kikitraiteur.b2b.facturation.data.repository.FacturationJournaliereRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Component
@RequiredArgsConstructor
public class B2bDataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final EntrepriseRepository entrepriseRepository;
    private final EmployeRepository employeRepository;
    private final PlatRepository platRepository;
    private final CommandeSiteRepository commandeRepository;
    private final ReclamationCutOffRepository reclamationRepository;
    private final FacturationJournaliereRepository facturationRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            userRepository.saveAll(List.of(
                    UserEntity.builder()
                            .email("admin@kikitraiteur.sn")
                            .password(passwordEncoder.encode("Kiki2026!"))
                            .nomComplet("Direction Kiki Traiteur")
                            .titrePoste("Super Administrateur")
                            .entite("Kiki Traiteur B2B")
                            .role(RoleName.SUPER_ADMIN)
                            .badge("Super Admin")
                            .badgeColor("#721513")
                            .build(),
                    UserEntity.builder()
                            .email("rh@totalenergies.sn")
                            .password(passwordEncoder.encode("Kiki2026!"))
                            .nomComplet("Mme Fatou Fall")
                            .titrePoste("Responsable RH & Moyens Généraux")
                            .entite("TotalEnergies Sénégal")
                            .entrepriseId("ent-001")
                            .siteId("site-1")
                            .siteNom("Siège Plateau - Dakar")
                            .role(RoleName.RESPONSABLE_ENTREPRISE)
                            .badge("Responsable Entreprise")
                            .badgeColor("#721513")
                            .build(),
                    UserEntity.builder()
                            .email("cuisine@kikitraiteur.sn")
                            .password(passwordEncoder.encode("Kiki2026!"))
                            .nomComplet("Chef Moussa Ndiaye")
                            .titrePoste("Responsable de Site Kiki")
                            .entite("Kiki Traiteur Exploitation")
                            .entrepriseId("ent-001")
                            .siteId("site-1")
                            .siteNom("Siège Plateau - Dakar")
                            .role(RoleName.RESPONSABLE_SITE_KIKI)
                            .badge("Exploitation Cantine")
                            .badgeColor("#606C38")
                            .build(),
                    UserEntity.builder()
                            .email("ibrahima.sarr@totalenergies.sn")
                            .password(passwordEncoder.encode("Kiki2026!"))
                            .nomComplet("Ibrahima Sarr")
                            .titrePoste("Ingénieur Opérations")
                            .entite("TotalEnergies Sénégal")
                            .entrepriseId("ent-001")
                            .siteId("site-1")
                            .siteNom("Siège Plateau - Dakar")
                            .matricule("TOT-1001")
                            .role(RoleName.SALARIE_CONVENTIONNE)
                            .badge("Subventionné 100%")
                            .badgeColor("#606C38")
                            .build()
            ));
        }

        if (entrepriseRepository.count() == 0) {
            EntrepriseEntity total = EntrepriseEntity.builder()
                    .id("ent-001")
                    .nom("TotalEnergies — Siège Plateau")
                    .codeEntreprise("TOT-PLA")
                    .ninea("001294829 2V1")
                    .rccm("SN-DKR-2012-B-1428")
                    .adresse("Boulevard de la République, Dakar Plateau")
                    .emailContact("rh@totalenergies.sn")
                    .telephone("+221 33 839 50 00")
                    .contactReferent("Mme Fatou Fall")
                    .montantPriseEnChargeRepas(5000)
                    .tauxPriseEnCharge(100)
                    .cadenceFacturation("MENSUELLE")
                    .cutOffType("J_MOINS_1")
                    .cutOffHeure("18:00")
                    .typePrestation("CUISINE_SUR_PLACE")
                    .categoriesAutorisees(List.of("ENTREE", "PLAT", "DESSERT", "BOISSON"))
                    .build();

            SiteEntity sitePlateau = SiteEntity.builder()
                    .id("site-1")
                    .nom("Siège Plateau - Dakar")
                    .adresse("Boulevard de la République, Dakar")
                    .heureCutOff("18:00")
                    .contactReferent("Mme Fatou Fall")
                    .telephoneReferent("+221 33 839 50 00")
                    .typePrestation("CUISINE_SUR_PLACE")
                    .creneauxDisponibles(List.of("12:00 - 12:30", "12:30 - 13:00", "13:00 - 13:30", "13:30 - 14:00"))
                    .entreprise(total)
                    .build();

            total.getSites().add(sitePlateau);
            entrepriseRepository.save(total);
        }

        if (employeRepository.count() == 0) {
            employeRepository.saveAll(List.of(
                    EmployeEntity.builder().id("emp-1").matricule("TOT-1001").nom("Sarr").prenom("Ibrahima")
                            .email("ibrahima.sarr@totalenergies.sn").telephone("+221 77 100 10 01")
                            .entrepriseId("ent-001").siteId("site-1").siteNom("Siège Plateau - Dakar")
                            .departement("Opérations").type("SUBVENTIONNE").tauxSubvention(100).actif(true)
                            .repasConsommesMois(14).montantPrisEnChargeMois(70000).build(),
                    EmployeEntity.builder().id("emp-2").matricule("TOT-1002").nom("Diop").prenom("Awa")
                            .email("awa.diop@totalenergies.sn").telephone("+221 77 100 10 02")
                            .entrepriseId("ent-001").siteId("site-1").siteNom("Siège Plateau - Dakar")
                            .departement("Finance").type("SUBVENTIONNE").tauxSubvention(70).actif(true)
                            .repasConsommesMois(11).montantPrisEnChargeMois(38500).build()
            ));
        }

        if (platRepository.count() == 0) {
            platRepository.saveAll(List.of(
                    PlatEntity.builder().id("plat-1").nom("Thiéboudienne Rouge Royal").description("Riz au poisson thiof, légumes du marché et tamarin").categorie("PLAT").prixUnitaire(3500).image("/assets/images/plats/p1.jpg").calories(650).allergene("Poisson").build(),
                    PlatEntity.builder().id("plat-2").nom("Poulet Yassa Braisé").description("Poulet mariné au citron vert et oignons caramélisés").categorie("PLAT").prixUnitaire(3500).image("/assets/images/plats/p2.jpg").calories(580).allergene("Aucun allergène majeur").build(),
                    PlatEntity.builder().id("plat-3").nom("Pastels au Thon & Salade").description("Pastels croustillants servis avec sauce tomate maison").categorie("ENTREE").prixUnitaire(1500).image("/assets/images/plats/e1.jpg").calories(310).allergene("Gluten").build(),
                    PlatEntity.builder().id("plat-4").nom("Thiakry Onctueux").description("Couscous de mil sucré à la crème fraîche et vanille").categorie("DESSERT").prixUnitaire(1200).image("/assets/images/plats/d1.jpg").calories(290).allergene("Lait / Lactose").build(),
                    PlatEntity.builder().id("plat-5").nom("Jus de Bissap Frais").description("Infusion d'hibiscus mentholée, peu sucrée").categorie("BOISSON").prixUnitaire(800).image("/assets/images/plats/b1.jpg").calories(110).allergene("Aucun allergène majeur").build()
            ));
        }

        String todayIso = LocalDate.now().toString();
        String todayLabel = LocalDate.now().format(DateTimeFormatter.ofPattern("EEEE d MMMM yyyy", Locale.FRENCH));

        if (commandeRepository.count() == 0) {
            commandeRepository.saveAll(List.of(
                    CommandeSiteEntity.builder().id("cmd-1").codeCommande("CMD-4821").entrepriseId("ent-001").entrepriseNom("TotalEnergies — Siège Plateau")
                            .siteId("site-1").siteNom("Siège Plateau - Dakar").matricule("TOT-1001").employeNom("Ibrahima Sarr")
                            .categorie("PLAT").platNom("Thiéboudienne Rouge Royal").date(todayIso).heure("11:45")
                            .montantTotal(5000).partEntreprise(5000).partEmploye(0).tauxSubventionApplique(100)
                            .statut("LIVRE").scanneAt("12:10").livreAt("12:14").build()
            ));
        }

        if (reclamationRepository.count() == 0) {
            reclamationRepository.save(
                    ReclamationCutOffEntity.builder().id("rec-1").entrepriseId("ent-001").siteId("site-1")
                            .employeId("emp-2").employeNom("Awa Diop").matricule("TOT-1002").departement("Finance")
                            .date(todayIso).heureDemande("10:42").motif("Réunion client prolongée ce matin")
                            .statut("EN_ATTENTE").build()
            );
        }

        if (facturationRepository.count() == 0) {
            facturationRepository.save(
                    FacturationJournaliereEntity.builder().id("fac-1").entrepriseId("ent-001")
                            .date(todayIso).dateAffichee(todayLabel)
                            .nbPlatsLivres(48).nbPresents(52).montantTotal(240000)
                            .montantPartEntreprise(216000).montantPartEmploye(24000).statut("EN_COURS").build()
            );
        }
    }
}
