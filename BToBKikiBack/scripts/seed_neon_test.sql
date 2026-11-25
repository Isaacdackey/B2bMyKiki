-- ============================================================================
-- SEED MANUEL DE TEST COMPLET POUR NEON (PostgreSQL)
-- À exécuter UNIQUEMENT manuellement par le développeur sur Neon.
-- Ce script n'est JAMAIS exécuté par Flyway ni par Spring Boot.
-- Mot de passe des comptes de test ci-dessous : Kiki2026!
-- (Hash BCrypt de "Kiki2026!" : $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy)
-- ============================================================================

-- 1. Types de Prestation & Catégories Alimentaires
INSERT INTO b2b_types_prestation (code, libelle, description_texte, cut_off_type, cut_off_heure, regles_cut_off, is_archive) VALUES
    ('CUISINE_SUR_PLACE', 'Cuisine et service sur place', 'Préparation et dressage en restaurant d''entreprise sur place', 'JOUR_J', '10:30', 'Clôture le matin même avant lancement en cuisine sur site', FALSE),
    ('SERVICE_SUR_PLACE', 'Service sur place (Réfectoire)', 'Plats cuisinés acheminés chauds et servis à l''assiette au réfectoire', 'J_MOINS_1', '18:00', 'Préparation centrale, clôture la veille au soir', FALSE),
    ('LIVRAISON_BARQUETTES', 'Livraison en barquettes', 'Conditionnement individuel hermétique scellé et étiqueté', 'J_MOINS_1', '16:00', 'Conditionnement et étiquetage individuel J-1', FALSE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO b2b_prestation_categories_defaut (prestation_code, categorie) VALUES
    ('CUISINE_SUR_PLACE', 'ENTREE'), ('CUISINE_SUR_PLACE', 'PLAT'), ('CUISINE_SUR_PLACE', 'DESSERT'), ('CUISINE_SUR_PLACE', 'BOISSON'),
    ('SERVICE_SUR_PLACE', 'ENTREE'), ('SERVICE_SUR_PLACE', 'PLAT'), ('SERVICE_SUR_PLACE', 'DESSERT'), ('SERVICE_SUR_PLACE', 'BOISSON'),
    ('LIVRAISON_BARQUETTES', 'PLAT'), ('LIVRAISON_BARQUETTES', 'BOISSON');

INSERT INTO b2b_prestation_jours_dispo (prestation_code, jour) VALUES
    ('CUISINE_SUR_PLACE', 'Lundi'), ('CUISINE_SUR_PLACE', 'Mardi'), ('CUISINE_SUR_PLACE', 'Mercredi'), ('CUISINE_SUR_PLACE', 'Jeudi'), ('CUISINE_SUR_PLACE', 'Vendredi'),
    ('SERVICE_SUR_PLACE', 'Lundi'), ('SERVICE_SUR_PLACE', 'Mardi'), ('SERVICE_SUR_PLACE', 'Mercredi'), ('SERVICE_SUR_PLACE', 'Jeudi'), ('SERVICE_SUR_PLACE', 'Vendredi'),
    ('LIVRAISON_BARQUETTES', 'Lundi'), ('LIVRAISON_BARQUETTES', 'Mardi'), ('LIVRAISON_BARQUETTES', 'Mercredi'), ('LIVRAISON_BARQUETTES', 'Jeudi'), ('LIVRAISON_BARQUETTES', 'Vendredi');

INSERT INTO b2b_categories_plat (code, libelle, icone, couleur, is_archive) VALUES
    ('ENTREE', 'Entrée', 'fa-leaf', '#606C38', FALSE),
    ('PLAT', 'Plat chaud', 'fa-bowl-food', '#721513', FALSE),
    ('DESSERT', 'Dessert', 'fa-cake-candles', '#C5A880', FALSE),
    ('BOISSON', 'Boisson', 'fa-wine-glass', '#332724', FALSE)
ON CONFLICT (code) DO NOTHING;

-- 2. Entreprises & Sites
INSERT INTO b2b_entreprises (
    id, nom, code_entreprise, ninea, rccm, adresse, email_contact, telephone,
    contact_referent, montant_prise_en_charge_repas, taux_prise_en_charge, plafond_journalier,
    budget_mensuel_alloue, tarif_negocie_htva, cadence_facturation,
    cut_off_type, cut_off_heure, type_prestation, is_archivee
) VALUES (
    'ent-001', 'TotalEnergies Sénégal', 'TOT-SN', '001294829 2V1', 'SN-DKR-2012-B-1428',
    'Route de l''Aéroport, Dakar', 'rh@totalenergies.sn', '+221 33 800 10 20',
    'Mme Fatou Fall', 5000, 100, 5000, 15000000, 5000, 'MENSUELLE',
    'J_MOINS_1', '18:00', 'CUISINE_SUR_PLACE', FALSE
) ON CONFLICT (id) DO NOTHING;

INSERT INTO b2b_entreprise_categories (entreprise_id, categorie) VALUES
    ('ent-001', 'ENTREE'), ('ent-001', 'PLAT'), ('ent-001', 'DESSERT'), ('ent-001', 'BOISSON');

INSERT INTO b2b_sites (
    id, nom, adresse, heure_cut_off, contact_referent, telephone_referent, type_prestation, entreprise_id
) VALUES
    ('site-1', 'Siège Plateau - Dakar', 'Place de l''Indépendance, Dakar', '18:00', 'Mme Fatou Fall', '+221 77 100 20 30', 'CUISINE_SUR_PLACE', 'ent-001'),
    ('site-2', 'Dépôt Bel-Air / Port', 'Zone Industrielle Bel-Air, Dakar', '17:00', 'M. Mamadou Diallo', '+221 77 100 20 31', 'SERVICE_SUR_PLACE', 'ent-001')
ON CONFLICT (id) DO NOTHING;

-- 3. Comptes Utilisateurs JWT (RH, Admin Site, Employés)
INSERT INTO b2b_users (
    id, email, password, nom_complet, titre_poste, entite, entreprise_id, site_id, site_nom, matricule, role, badge, badge_color, actif
) VALUES
    ('usr-rh-001', 'rh@totalenergies.sn', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
     'Mme Fatou Fall', 'Responsable RH & Moyens Généraux', 'TotalEnergies Sénégal', 'ent-001', 'site-1', 'Siège Plateau - Dakar', NULL,
     'RESPONSABLE_ENTREPRISE', 'Direction RH', '#606C38', TRUE),
    ('usr-site-001', 'site@kikitraiteur.sn', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
     'Moussa Kane', 'Responsable de Site Kiki Traiteur', 'Kiki Traiteur Exploitation', 'ent-001', 'site-1', 'Siège Plateau - Dakar', NULL,
     'RESPONSABLE_SITE_KIKI', 'Gérant Exploitation Site', '#3D5A80', TRUE),
    ('usr-emp-001', 'babacar.ndiaye@totalenergies.sn', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
     'Babacar Ndiaye', 'Salarié Conventionné', 'TotalEnergies Sénégal', 'ent-001', 'site-1', 'Siège Plateau - Dakar', 'TOT-9842',
     'SALARIE_CONVENTIONNE', 'Subventionné 100%', '#2E7D32', TRUE),
    ('usr-emp-002', 'ousmane.ba@totalenergies.sn', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
     'Ousmane Ba', 'Salarié Autonome', 'TotalEnergies Sénégal', 'ent-001', 'site-1', 'Siège Plateau - Dakar', 'TOT-EXT-01',
     'SALARIE_AUTONOME', 'Paiement direct Wave', '#1D4ED8', TRUE)
ON CONFLICT (email) DO NOTHING;

-- 4. Annuaire Employés
INSERT INTO b2b_employes (
    id, matricule, nom, prenom, email, telephone, entreprise_id, site_id, site_nom, departement, type, taux_subvention, actif, repas_consommes_mois, montant_pris_en_charge_mois
) VALUES
    ('emp-001', 'TOT-9842', 'Ndiaye', 'Babacar', 'babacar.ndiaye@totalenergies.sn', '+221 77 200 30 40',
     'ent-001', 'site-1', 'Siège Plateau - Dakar', 'Finance & Comptabilité', 'SUBVENTIONNE', 100, TRUE, 18, 90000),
    ('emp-002', 'TOT-9843', 'Diop', 'Awa', 'awa.diop@totalenergies.sn', '+221 77 200 30 41',
     'ent-001', 'site-1', 'Siège Plateau - Dakar', 'Ressources Humaines', 'SUBVENTIONNE', 70, TRUE, 14, 49000),
    ('emp-003', 'TOT-EXT-01', 'Ba', 'Ousmane', 'ousmane.ba@totalenergies.sn', '+221 77 200 30 42',
     'ent-001', 'site-1', 'Siège Plateau - Dakar', 'IT & Systèmes', 'AUTONOME', 0, TRUE, 6, 0)
ON CONFLICT (id) DO NOTHING;

-- 5. Catalogue de Plats
INSERT INTO b2b_plats (
    id, nom, description, categorie, prix_unitaire, image, allergene, disponible, is_archive
) VALUES
    ('e1', 'Salade Niçoise au Thon Frais', 'Salade fraîche de saison, thon frais, œufs et olives', 'ENTREE', 1500, '/assets/images/plats/salade.jpg', 'Poisson', TRUE, FALSE),
    ('e2', 'Pastels Dorés au Thon (x3)', 'Beignets croustillants farcis au thon et sauce tomate maison', 'ENTREE', 1500, '/assets/images/plats/pastels.jpg', 'Gluten', TRUE, FALSE),
    ('p1', 'Poulet Yassa Braisé Kiki & Riz Parfumé', 'Poulet mariné aux oignons caramélisés et citron vert', 'PLAT', 3500, '/assets/images/plats/p1.jpg', 'Aucun allergène majeur', TRUE, FALSE),
    ('p2', 'Filet de Capitaine Braisé & Alloco', 'Capitaine grillé, bananes plantains dorées et sauce verte', 'PLAT', 3500, '/assets/images/plats/capitaine.jpg', 'Poisson', TRUE, FALSE),
    ('p4', 'Thiéboudienne Penda Mbaye Royal', 'Riz rouge mijoté au mérou frais et légumes du terroir', 'PLAT', 3500, '/assets/images/plats/thieboudienne.jpg', 'Poisson', TRUE, FALSE),
    ('d1', 'Coupe de Fruits Exotiques Frais', 'Mangue, ananas et papaye de saison', 'DESSERT', 1000, '/assets/images/plats/fruits.jpg', 'Aucun allergène majeur', TRUE, FALSE),
    ('d2', 'Fondant Chocolat Intense', 'Gâteau cœur coulant au chocolat noir', 'DESSERT', 1200, '/assets/images/plats/fondant.jpg', 'Gluten', TRUE, FALSE),
    ('b1', 'Jus Naturel de Bissap Frais Menthe', 'Infusion fraîche de fleurs d''hibiscus et menthe', 'BOISSON', 800, '/assets/images/plats/bissap.jpg', 'Aucun allergène majeur', TRUE, FALSE),
    ('b2', 'Jus de Bouye Artisanal', 'Nectar onctueux de fruit de baobab', 'BOISSON', 800, '/assets/images/plats/bouye.jpg', 'Aucun allergène majeur', TRUE, FALSE)
ON CONFLICT (id) DO NOTHING;

-- 6. Planning Hebdomadaire Exemple
INSERT INTO b2b_menus_planifies (id, entreprise_id, jour_nom, date_str, theme, quantites_saisies, statut_conformite) VALUES
    ('plan-ent1-lun', 'ent-001', 'Lundi', '2026-11-23', 'Saveurs Sénégalaises & Terroir', TRUE, 'CONFORME'),
    ('plan-ent1-mar', 'ent-001', 'Mardi', '2026-11-24', 'Grillades & Fraîcheur Dakaroise', TRUE, 'CONFORME'),
    ('plan-ent1-mer', 'ent-001', 'Mercredi', '2026-11-25', 'Rôtisserie & Saveurs d''Afrique', TRUE, 'CONFORME'),
    ('plan-ent1-jeu', 'ent-001', 'Jeudi', '2026-11-26', 'Délices Culinaires du Chef', TRUE, 'CONFORME'),
    ('plan-ent1-ven', 'ent-001', 'Vendredi', '2026-11-27', 'Thiéboudienne Sacré du Vendredi', TRUE, 'CONFORME')
ON CONFLICT (id) DO NOTHING;

INSERT INTO b2b_lignes_menu_planifie (id, plat_id, nom_plat, categorie, quantite_prevue, disponible, menu_planifie_id) VALUES
    ('l-lun-1', 'e2', 'Pastels Dorés au Thon (x3)', 'ENTREE', 40, TRUE, 'plan-ent1-lun'),
    ('l-lun-2', 'p1', 'Poulet Yassa Braisé Kiki & Riz Parfumé', 'PLAT', 45, TRUE, 'plan-ent1-lun'),
    ('l-lun-3', 'b1', 'Jus Naturel de Bissap Frais Menthe', 'BOISSON', 60, TRUE, 'plan-ent1-lun'),
    ('l-mer-1', 'e1', 'Salade Niçoise au Thon Frais', 'ENTREE', 40, TRUE, 'plan-ent1-mer'),
    ('l-mer-2', 'p4', 'Thiéboudienne Penda Mbaye Royal', 'PLAT', 50, TRUE, 'plan-ent1-mer'),
    ('l-mer-3', 'd1', 'Coupe de Fruits Exotiques Frais', 'DESSERT', 45, TRUE, 'plan-ent1-mer'),
    ('l-mer-4', 'b1', 'Jus Naturel de Bissap Frais Menthe', 'BOISSON', 60, TRUE, 'plan-ent1-mer')
ON CONFLICT (id) DO NOTHING;
