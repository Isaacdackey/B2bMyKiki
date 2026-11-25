-- ============================================================================
-- V1__init_schema.sql
-- Migration Flyway strictement DDL (tables, contraintes, index).
-- Aucun INSERT de données ici : le Super Admin est créé par bootstrap,
-- et les données de test sont gérées dans scripts/seed_neon_test.sql.
-- ============================================================================

CREATE TABLE IF NOT EXISTS b2b_entreprises (
    id VARCHAR(255) PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    code_entreprise VARCHAR(255) NOT NULL UNIQUE,
    ninea VARCHAR(255),
    rccm VARCHAR(255),
    adresse VARCHAR(255),
    email_contact VARCHAR(255),
    telephone VARCHAR(255),
    contact_referent VARCHAR(255),
    montant_prise_en_charge_repas INTEGER,
    taux_prise_en_charge INTEGER,
    plafond_journalier INTEGER,
    budget_mensuel_alloue BIGINT,
    tarif_negocie_htva INTEGER,
    cadence_facturation VARCHAR(255),
    cut_off_type VARCHAR(255),
    cut_off_heure VARCHAR(255),
    type_prestation VARCHAR(255),
    is_archivee BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS b2b_entreprise_categories (
    entreprise_id VARCHAR(255) NOT NULL REFERENCES b2b_entreprises(id) ON DELETE CASCADE,
    categorie VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS b2b_sites (
    id VARCHAR(255) PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    adresse VARCHAR(255),
    heure_cut_off VARCHAR(255),
    contact_referent VARCHAR(255),
    telephone_referent VARCHAR(255),
    type_prestation VARCHAR(255),
    entreprise_id VARCHAR(255) REFERENCES b2b_entreprises(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS b2b_site_creneaux (
    site_id VARCHAR(255) NOT NULL REFERENCES b2b_sites(id) ON DELETE CASCADE,
    creneau VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS b2b_users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nom_complet VARCHAR(255) NOT NULL,
    titre_poste VARCHAR(255),
    entite VARCHAR(255),
    entreprise_id VARCHAR(255),
    site_id VARCHAR(255),
    site_nom VARCHAR(255),
    matricule VARCHAR(255),
    role VARCHAR(64) NOT NULL,
    badge VARCHAR(255),
    badge_color VARCHAR(255),
    actif BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS b2b_password_reset_tokens (
    id VARCHAR(255) PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS b2b_invitations_admin (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    nom_complet VARCHAR(255) NOT NULL,
    role VARCHAR(64) NOT NULL,
    role_libelle VARCHAR(255),
    entreprise_id VARCHAR(255) NOT NULL,
    entreprise_nom VARCHAR(255),
    date_envoi VARCHAR(64),
    token_activation VARCHAR(255) NOT NULL UNIQUE,
    statut VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS b2b_employes (
    id VARCHAR(255) PRIMARY KEY,
    matricule VARCHAR(255) NOT NULL UNIQUE,
    nom VARCHAR(255) NOT NULL,
    prenom VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telephone VARCHAR(255),
    entreprise_id VARCHAR(255),
    site_id VARCHAR(255),
    site_nom VARCHAR(255),
    departement VARCHAR(255),
    type VARCHAR(64),
    taux_subvention INTEGER,
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    repas_consommes_mois INTEGER DEFAULT 0,
    montant_pris_en_charge_mois INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS b2b_plats (
    id VARCHAR(255) PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    categorie VARCHAR(64) NOT NULL,
    prix_unitaire INTEGER NOT NULL,
    image VARCHAR(1024),
    allergene VARCHAR(255),
    calories INTEGER,
    disponible BOOLEAN NOT NULL DEFAULT TRUE,
    is_archive BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS b2b_menus_planifies (
    id VARCHAR(255) PRIMARY KEY,
    entreprise_id VARCHAR(255) NOT NULL,
    jour_nom VARCHAR(64) NOT NULL,
    date_str VARCHAR(64),
    theme VARCHAR(255),
    quantites_saisies BOOLEAN NOT NULL DEFAULT FALSE,
    statut_conformite VARCHAR(64)
);

CREATE TABLE IF NOT EXISTS b2b_lignes_menu_planifie (
    id VARCHAR(255) PRIMARY KEY,
    categorie VARCHAR(64),
    plat_id VARCHAR(255),
    nom_plat VARCHAR(255),
    image VARCHAR(1024),
    quantite_prevue INTEGER DEFAULT 0,
    disponible BOOLEAN NOT NULL DEFAULT TRUE,
    menu_planifie_id VARCHAR(255) REFERENCES b2b_menus_planifies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS b2b_commandes_site (
    id VARCHAR(255) PRIMARY KEY,
    code_commande VARCHAR(255) NOT NULL,
    entreprise_id VARCHAR(255) NOT NULL,
    entreprise_nom VARCHAR(255),
    matricule VARCHAR(255) NOT NULL,
    employe_nom VARCHAR(255) NOT NULL,
    categorie VARCHAR(64),
    plat_nom VARCHAR(255) NOT NULL,
    date VARCHAR(64) NOT NULL,
    heure VARCHAR(64),
    montant_total INTEGER NOT NULL,
    part_entreprise INTEGER NOT NULL,
    part_employe INTEGER NOT NULL,
    statut VARCHAR(64) NOT NULL,
    scanne_at VARCHAR(64),
    livre_at VARCHAR(64)
);

CREATE TABLE IF NOT EXISTS b2b_reclamations_cutoff (
    id VARCHAR(255) PRIMARY KEY,
    entreprise_id VARCHAR(255) NOT NULL,
    employe_nom VARCHAR(255) NOT NULL,
    matricule VARCHAR(255) NOT NULL,
    date VARCHAR(64) NOT NULL,
    heure_demande VARCHAR(64),
    motif TEXT NOT NULL,
    statut VARCHAR(64) NOT NULL,
    debloque_par VARCHAR(255),
    debloque_at VARCHAR(64)
);

CREATE TABLE IF NOT EXISTS b2b_types_prestation (
    code VARCHAR(255) PRIMARY KEY,
    libelle VARCHAR(255) NOT NULL,
    description_texte VARCHAR(500),
    cut_off_type VARCHAR(64),
    cut_off_heure VARCHAR(32),
    regles_cut_off VARCHAR(500),
    is_archive BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS b2b_prestation_categories_defaut (
    prestation_code VARCHAR(255) NOT NULL REFERENCES b2b_types_prestation(code) ON DELETE CASCADE,
    categorie VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS b2b_prestation_jours_dispo (
    prestation_code VARCHAR(255) NOT NULL REFERENCES b2b_types_prestation(code) ON DELETE CASCADE,
    jour VARCHAR(64)
);

CREATE TABLE IF NOT EXISTS b2b_categories_plat (
    code VARCHAR(255) PRIMARY KEY,
    libelle VARCHAR(255) NOT NULL,
    icone VARCHAR(255),
    couleur VARCHAR(64),
    is_archive BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS b2b_alertes_commande (
    id VARCHAR(255) PRIMARY KEY,
    entreprise_id VARCHAR(255) NOT NULL,
    employe_email VARCHAR(255) NOT NULL,
    employe_nom VARCHAR(255),
    expediteur_nom VARCHAR(255),
    message TEXT NOT NULL,
    lu BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS b2b_paiements_wave (
    id VARCHAR(255) PRIMARY KEY,
    commande_id VARCHAR(255),
    entreprise_id VARCHAR(255),
    employe_matricule VARCHAR(255),
    employe_nom VARCHAR(255),
    montant_total INTEGER,
    part_entreprise INTEGER,
    part_employe INTEGER,
    statut VARCHAR(64) NOT NULL,
    mode VARCHAR(32) NOT NULL,
    wave_session_id VARCHAR(255),
    wave_launch_url VARCHAR(1024),
    created_at TIMESTAMP,
    paid_at TIMESTAMP
);
