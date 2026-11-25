-- ============================================================================
-- SEED MANUEL DE TEST POUR NEON (PostgreSQL)
-- À exécuter UNIQUEMENT manuellement par le développeur sur Neon.
-- Ce script n'est JAMAIS exécuté par Flyway ni par Spring Boot.
-- Mot de passe des comptes de test ci-dessous : Kiki2026!
-- (Hash BCrypt de "Kiki2026!" : $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy)
-- ============================================================================

INSERT INTO b2b_entreprises (
    id, nom, code_entreprise, ninea, rccm, adresse, email_contact, telephone,
    contact_referent, montant_prise_en_charge_repas, cadence_facturation,
    cut_off_type, cut_off_heure, type_prestation, is_archivee
) VALUES (
    'ent-001', 'TotalEnergies Sénégal', 'TOT-SN', '001294829 2V1', 'SN-DKR-2012-B-1428',
    'Route de l''Aéroport, Dakar', 'rh@totalenergies.sn', '+221 33 800 10 20',
    'Mme Fatou Fall', 5000, 'MENSUELLE',
    'J_MOINS_1', '18:00', 'CUISINE_SUR_PLACE', FALSE
) ON CONFLICT (id) DO NOTHING;

INSERT INTO b2b_sites (
    id, nom, adresse, heure_cut_off, contact_referent, telephone_referent, type_prestation, entreprise_id
) VALUES (
    'site-1', 'Siège Plateau - Dakar', 'Place de l''Indépendance, Dakar', '18:00',
    'Mme Fatou Fall', '+221 77 100 20 30', 'CUISINE_SUR_PLACE', 'ent-001'
) ON CONFLICT (id) DO NOTHING;

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
     'SALARIE_CONVENTIONNE', 'Subventionné 100%', '#2E7D32', TRUE)
ON CONFLICT (email) DO NOTHING;

INSERT INTO b2b_employes (
    id, matricule, nom, prenom, email, telephone, site_id, site_nom, departement, type, taux_subvention, actif, repas_consommes_mois, montant_pris_en_charge_mois
) VALUES (
    'emp-001', 'TOT-9842', 'Ndiaye', 'Babacar', 'babacar.ndiaye@totalenergies.sn', '+221 77 200 30 40',
    'site-1', 'Siège Plateau - Dakar', 'Finance', 'SUBVENTIONNE', 100, TRUE, 0, 0
) ON CONFLICT (id) DO NOTHING;

INSERT INTO b2b_plats (
    id, nom, description, categorie, prix_unitaire, image, allergene, disponible, is_archive
) VALUES
    ('plat-001', 'Thiéboudienne Penda Mbaye Rouge', 'Riz rouge mijoté au mérou frais et légumes du terroir', 'PLAT', 3500, '/assets/images/plats/thieboudienne.jpg', 'Poisson', TRUE, FALSE),
    ('plat-002', 'Poulet Yassa Braisé Kiki', 'Poulet mariné aux oignons caramélisés et citron vert', 'PLAT', 3500, '/assets/images/plats/p1.jpg', 'Aucun allergène majeur', TRUE, FALSE),
    ('plat-003', 'Pastels Dorés au Thon', 'Lot de 3 pastels croustillants et sauce tomate maison', 'ENTREE', 1500, '/assets/images/plats/pastels.jpg', 'Gluten', TRUE, FALSE),
    ('plat-004', 'Jus Naturel de Bissap Menthe', 'Infusion fraîche de fleurs d''hibiscus et menthe', 'BOISSON', 800, '/assets/images/plats/bissap.jpg', 'Aucun allergène majeur', TRUE, FALSE)
ON CONFLICT (id) DO NOTHING;
