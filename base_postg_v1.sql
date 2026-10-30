-- ============================================================================
-- SCHEMA APONGA : PostgreSQL 14/15 (partie 1 : identité et accès)
-- ============================================================================

-- Fonction partagée : met à jour updated_at à chaque UPDATE
-- (remplace « ON UPDATE CURRENT_TIMESTAMP » de MySQL)
CREATE OR REPLACE FUNCTION maj_updated_at() RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Profil du tenant : UNE seule ligne (l'instance EST l'organisation)
CREATE TABLE organisation (
   id SMALLINT PRIMARY KEY DEFAULT 1,
   nom VARCHAR(150) NOT NULL,
   type VARCHAR(50),
   statut VARCHAR(20) NOT NULL DEFAULT 'active',
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT chk_organisation_unique CHECK (id = 1),
   CONSTRAINT chk_organisation_statut CHECK (statut IN ('active','suspendue','archivee'))
);
CREATE TRIGGER trg_organisation_updated_at
BEFORE UPDATE ON organisation
FOR EACH ROW EXECUTE FUNCTION maj_updated_at();

CREATE TABLE utilisateur (
   id SERIAL PRIMARY KEY,
   nom VARCHAR(100) NOT NULL,
   prenom VARCHAR(100) NOT NULL,
   email VARCHAR(150) UNIQUE,
   telephone VARCHAR(30) UNIQUE,
   -- Nullable : connexion par téléphone/OTP/SSO possible plus tard
   mot_de_passe_hash VARCHAR(255) NULL,
   date_naissance DATE,
   statut VARCHAR(20) NOT NULL DEFAULT 'actif',
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT chk_utilisateur_statut CHECK (statut IN ('actif','suspendu','anonymise')),
   -- 'anonymise' = droit à l'effacement (RGPD) : on efface l'identité, pas les faits
   CONSTRAINT chk_utilisateur_contact CHECK (email IS NOT NULL OR telephone IS NOT NULL OR statut = 'anonymise')
);
CREATE TRIGGER trg_utilisateur_updated_at
BEFORE UPDATE ON utilisateur
FOR EACH ROW EXECUTE FUNCTION maj_updated_at();

-- Sessions : une ligne par connexion active. Déconnexion = remplir revoquee_le.
CREATE TABLE session_utilisateur (
   id SERIAL PRIMARY KEY,
   id_utilisateur INT NOT NULL,
   empreinte_jeton CHAR(64) NOT NULL UNIQUE,
   adresse_ip VARCHAR(45) NULL,
   agent_utilisateur VARCHAR(255) NULL,
   cree_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
   expire_le TIMESTAMP NOT NULL,
   revoquee_le TIMESTAMP NULL,
   CONSTRAINT chk_session_expiration CHECK (expire_le > cree_le),
   FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id) ON DELETE CASCADE
);
CREATE INDEX idx_session_utilisateur ON session_utilisateur(id_utilisateur);

-- Mot de passe oublié : jeton à usage unique, de courte durée
CREATE TABLE reinitialisation_mot_de_passe (
   id SERIAL PRIMARY KEY,
   id_utilisateur INT NOT NULL,
   empreinte_jeton CHAR(64) NOT NULL UNIQUE,
   cree_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
   expire_le TIMESTAMP NOT NULL,
   utilisee_le TIMESTAMP NULL,
   CONSTRAINT chk_reinit_expiration CHECK (expire_le > cree_le),
   FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id) ON DELETE CASCADE
);
CREATE INDEX idx_reinit_utilisateur ON reinitialisation_mot_de_passe(id_utilisateur);

-- [C2] Adhésion au tenant : c'est le membre que connaissent tous les autres blocs
CREATE TABLE membre (
   id SERIAL PRIMARY KEY,
   id_utilisateur INT NOT NULL UNIQUE,
   statut VARCHAR(20) NOT NULL DEFAULT 'actif',
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT chk_membre_statut CHECK (statut IN ('actif','suspendu','inactif','archive')),
   FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id) ON DELETE RESTRICT
);

CREATE TABLE statut_membre_historique (
   id SERIAL PRIMARY KEY,
   id_membre INT NOT NULL,
   ancien_statut VARCHAR(20),
   nouveau_statut VARCHAR(20) NOT NULL,
   date_changement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   modifie_par INT NULL,
   raison TEXT,
   FOREIGN KEY (id_membre) REFERENCES membre(id) ON DELETE RESTRICT,
   FOREIGN KEY (modifie_par) REFERENCES membre(id) ON DELETE RESTRICT
);

CREATE TABLE role (
   id SERIAL PRIMARY KEY,
   code VARCHAR(50) NOT NULL UNIQUE,
   nom VARCHAR(100) NOT NULL
);

CREATE TABLE permission (
   id SERIAL PRIMARY KEY,
   code VARCHAR(60) NOT NULL UNIQUE,
   description VARCHAR(255)
);

CREATE TABLE role_permission (
   id_role INT NOT NULL,
   id_permission INT NOT NULL,
   PRIMARY KEY (id_role, id_permission),
   FOREIGN KEY (id_role) REFERENCES role(id) ON DELETE CASCADE,
   FOREIGN KEY (id_permission) REFERENCES permission(id) ON DELETE CASCADE
);

CREATE TABLE membre_role (
   id SERIAL PRIMARY KEY,
   id_membre INT NOT NULL,
   id_role INT NOT NULL,
   attribue_par INT NULL,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (id_membre) REFERENCES membre(id) ON DELETE RESTRICT,
   FOREIGN KEY (id_role) REFERENCES role(id) ON DELETE RESTRICT,
   FOREIGN KEY (attribue_par) REFERENCES membre(id) ON DELETE RESTRICT,
   UNIQUE (id_membre, id_role)
);

-- Tutelle / supervision : entre deux MEMBRES
--  parent, tuteur_legal : tutelle d'un mineur (consentement possible)
--  responsable_groupe   : le responsable d'un groupe suit la progression de ses membres
--  delegue              : délégation de lecture
CREATE TABLE tutelle (
   id SERIAL PRIMARY KEY,
   id_tuteur INT NOT NULL,
   id_apprenant INT NOT NULL,
   type_relation VARCHAR(30) NOT NULL,
   consentement_requis BOOLEAN NOT NULL DEFAULT FALSE,
   consentement_donne_le TIMESTAMP NULL,
   statut VARCHAR(20) NOT NULL DEFAULT 'active',
   revoquee_le TIMESTAMP NULL,
   revoquee_par INT NULL,
   motif_revocation TEXT NULL,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT chk_tutelle_type CHECK (type_relation IN ('parent','tuteur_legal','responsable_groupe','delegue')),
   CONSTRAINT chk_tutelle_statut CHECK (statut IN ('active','revoquee')),
   CONSTRAINT chk_tutelle_distincts CHECK (id_tuteur <> id_apprenant),
   FOREIGN KEY (id_tuteur) REFERENCES membre(id) ON DELETE RESTRICT,
   FOREIGN KEY (id_apprenant) REFERENCES membre(id) ON DELETE RESTRICT,
   FOREIGN KEY (revoquee_par) REFERENCES membre(id) ON DELETE RESTRICT,
   UNIQUE (id_tuteur, id_apprenant, type_relation)
);
CREATE TRIGGER trg_tutelle_updated_at
BEFORE UPDATE ON tutelle
FOR EACH ROW EXECUTE FUNCTION maj_updated_at();

-- Groupe : regroupement de membres, support de la licence de groupe.
-- Ce n'est PAS une organisation (le tenant est l'instance).
CREATE TABLE groupe (
   id SERIAL PRIMARY KEY,
   nom VARCHAR(150) NOT NULL UNIQUE,
   description TEXT,
   id_responsable INT NOT NULL,
   statut VARCHAR(20) NOT NULL DEFAULT 'actif',
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT chk_groupe_statut CHECK (statut IN ('actif','archive')),
   FOREIGN KEY (id_responsable) REFERENCES membre(id) ON DELETE RESTRICT
);

CREATE TABLE groupe_membre (
   id SERIAL PRIMARY KEY,
   id_groupe INT NOT NULL,
   id_membre INT NOT NULL,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (id_groupe) REFERENCES groupe(id) ON DELETE RESTRICT,
   FOREIGN KEY (id_membre) REFERENCES membre(id) ON DELETE RESTRICT,
   UNIQUE (id_groupe, id_membre)
);

-- Paramètres de la plateforme (configuration, valable pour tout le tenant)
CREATE TABLE parametre (
   cle VARCHAR(60) PRIMARY KEY,
   valeur VARCHAR(255) NOT NULL,
   description VARCHAR(255)
);

-- =========================================================
-- Couche pédagogique : formations, unités, cours, ressources
-- =========================================================

-- Niveaux (débutant, intermédiaire, ...)
CREATE TABLE niveau (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(100) NOT NULL UNIQUE,
  ordre INT NOT NULL UNIQUE,
  cree_le TIMESTAMP NOT NULL DEFAULT NOW()          -- RENOMMAGE (created_at)
);

CREATE TABLE categorie (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(100) NOT NULL UNIQUE,
  description TEXT
);

-- Point d'extension : un nouveau type d'activité = une ligne ici
CREATE TABLE type_activite (
  code VARCHAR(50) PRIMARY KEY,
  libelle VARCHAR(150) NOT NULL
);

CREATE TABLE competence (
  id SERIAL PRIMARY KEY,
  id_categorie INT REFERENCES categorie(id) ON DELETE RESTRICT,
  id_niveau INT REFERENCES niveau(id) ON DELETE RESTRICT,
  libelle VARCHAR(150) NOT NULL,
  description TEXT,
  cree_le TIMESTAMP NOT NULL DEFAULT NOW()          -- RENOMMAGE
);

-- Identité stable : formation (sans parent) ou unité d'apprentissage (avec parent)
CREATE TABLE etude (
  id SERIAL PRIMARY KEY,
  type_etude VARCHAR(20) NOT NULL                   -- AJOUT
    CHECK (type_etude IN ('formation', 'unite')),
  id_parent INT REFERENCES etude(id) ON DELETE RESTRICT,
  id_categorie INT REFERENCES categorie(id) ON DELETE RESTRICT,
  id_niveau INT REFERENCES niveau(id) ON DELETE RESTRICT,
  id_niveau_prerequis INT REFERENCES niveau(id) ON DELETE RESTRICT,
  ordre INT NOT NULL DEFAULT 0,                     -- AJOUT : ordre des unités dans une formation
  titre VARCHAR(200) NOT NULL,
  cree_le TIMESTAMP NOT NULL DEFAULT NOW(),         -- RENOMMAGE
  modifie_le TIMESTAMP NOT NULL DEFAULT NOW(),      -- RENOMMAGE
  CONSTRAINT chk_etude_hierarchie CHECK (           -- AJOUT
    (type_etude = 'formation' AND id_parent IS NULL)
    OR (type_etude = 'unite' AND id_parent IS NOT NULL)
  )
);

-- Instantané d'une étude. Une fois publié, son contenu ne change plus.
CREATE TABLE version_etude (
  id SERIAL PRIMARY KEY,
  id_etude INT NOT NULL REFERENCES etude(id) ON DELETE RESTRICT,
  numero INT NOT NULL,
  etat VARCHAR(20) NOT NULL DEFAULT 'brouillon'
    CHECK (etat IN ('brouillon', 'publiee', 'depreciee', 'archivee')),
  titre VARCHAR(200) NOT NULL,
  description TEXT,
  -- Référence vers la règle d'évaluation : la clé étrangère sera ajoutée
  -- avec la couche politique, plus tard
  id_version_politique INT NULL,
  publie_le TIMESTAMP NULL,
  publie_par INT NULL REFERENCES membre(id) ON DELETE RESTRICT,
  cree_le TIMESTAMP NOT NULL DEFAULT NOW(),         -- RENOMMAGE
  UNIQUE (id_etude, numero)
);

-- Un cours (activité) rattaché à une unité
CREATE TABLE definition_activite (
  id SERIAL PRIMARY KEY,
  id_etude INT NOT NULL REFERENCES etude(id) ON DELETE RESTRICT,
  code_type_activite VARCHAR(50) NOT NULL           -- RENOMMAGE (type)
    REFERENCES type_activite(code) ON DELETE RESTRICT,
  titre VARCHAR(200),
  description TEXT,
  cree_le TIMESTAMP NOT NULL DEFAULT NOW()          -- RENOMMAGE
);

CREATE TABLE version_activite (
  id SERIAL PRIMARY KEY,
  id_definition_activite INT NOT NULL REFERENCES definition_activite(id) ON DELETE RESTRICT,
  numero INT NOT NULL,
  etat VARCHAR(20) NOT NULL DEFAULT 'brouillon'
    CHECK (etat IN ('brouillon', 'publiee', 'depreciee', 'archivee')),
  titre_version VARCHAR(200),
  description TEXT,
  duree_estimee_min INT NULL,
  publie_le TIMESTAMP NULL,
  publie_par INT NULL REFERENCES membre(id) ON DELETE RESTRICT,  -- AJOUT
  cree_le TIMESTAMP NOT NULL DEFAULT NOW(),         -- RENOMMAGE
  UNIQUE (id_definition_activite, numero)
);

-- Composition : quelles versions d'activités forment une version d'étude
CREATE TABLE version_etude_activite (
  id_version_etude INT NOT NULL REFERENCES version_etude(id) ON DELETE RESTRICT,
  id_version_activite INT NOT NULL REFERENCES version_activite(id) ON DELETE RESTRICT,
  ordre INT NOT NULL DEFAULT 0,
  obligatoire BOOLEAN NOT NULL DEFAULT TRUE,        -- RENOMMAGE de TINYINT(1)
  PRIMARY KEY (id_version_etude, id_version_activite)
);

-- Compétences validées par la réussite d'une version d'étude
CREATE TABLE version_etude_competence (
  id_version_etude INT NOT NULL REFERENCES version_etude(id) ON DELETE RESTRICT,
  id_competence INT NOT NULL REFERENCES competence(id) ON DELETE RESTRICT,
  PRIMARY KEY (id_version_etude, id_competence)
);

-- Compétences travaillées par une version d'activité
CREATE TABLE activite_competence (
  id_version_activite INT NOT NULL REFERENCES version_activite(id) ON DELETE RESTRICT,
  id_competence INT NOT NULL REFERENCES competence(id) ON DELETE RESTRICT,
  PRIMARY KEY (id_version_activite, id_competence)
);

-- Médias rattachés à une version d'activité
CREATE TABLE ressource (
  id SERIAL PRIMARY KEY,
  id_version_activite INT NOT NULL REFERENCES version_activite(id) ON DELETE RESTRICT,
  type_media VARCHAR(30) NOT NULL
    CHECK (type_media IN ('video', 'pdf', 'audio', 'image', 'lien')),
  titre VARCHAR(200),
  url TEXT NOT NULL,
  duree_secondes INT NULL,
  ordre INT NOT NULL DEFAULT 0,
  cree_le TIMESTAMP NOT NULL DEFAULT NOW()          -- RENOMMAGE
);

-- =========================================================
-- Fonctions et triggers
-- =========================================================

-- Met à jour modifie_le à chaque modification d'une étude
CREATE OR REPLACE FUNCTION maj_modifie_le()        -- AJOUT
RETURNS TRIGGER AS $$
BEGIN
  NEW.modifie_le = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_etude_modifie_le
BEFORE UPDATE ON etude
FOR EACH ROW EXECUTE FUNCTION maj_modifie_le();

-- Une version publiée est immuable : seul l'etat peut changer (ex. vers 'depreciee')
CREATE OR REPLACE FUNCTION bloquer_version_publiee()   -- AJOUT
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.etat = 'publiee'
     AND (to_jsonb(NEW) - 'etat') <> (to_jsonb(OLD) - 'etat') THEN
    RAISE EXCEPTION 'Une version publiée est immuable : créez une nouvelle version.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_version_etude_immuable
BEFORE UPDATE ON version_etude
FOR EACH ROW EXECUTE FUNCTION bloquer_version_publiee();

CREATE TRIGGER trg_version_activite_immuable
BEFORE UPDATE ON version_activite
FOR EACH ROW EXECUTE FUNCTION bloquer_version_publiee();

-- Description présentée de la formation ou de l'unité
ALTER TABLE etude ADD COLUMN description TEXT;

-- nanisy an'ito satria hoe misy an le parcpours normal et particulier teo @ resaka niveau 
-- MODIFICATION : début
ALTER TABLE etude ADD COLUMN parcours_particulier BOOLEAN NOT NULL DEFAULT FALSE;

-- Une formation n'a pas de niveau
ALTER TABLE etude ADD CONSTRAINT chk_etude_niveau_unite CHECK (
  type_etude = 'unite'
  OR (id_niveau IS NULL AND id_niveau_prerequis IS NULL AND parcours_particulier = FALSE)
);

-- Un prérequis choisi à la main n'existe que pour un parcours particulier
ALTER TABLE etude ADD CONSTRAINT chk_etude_prerequis_particulier CHECK (
  parcours_particulier OR id_niveau_prerequis IS NULL
);
-- MODIFICATION : fin

-- Historique des niveaux suivis par un membre.
-- Une affectation est active tant que date_fin est vide.
CREATE TABLE affectation_niveau (
  id          SERIAL PRIMARY KEY,
  id_membre   INTEGER NOT NULL REFERENCES membre(id) ON DELETE RESTRICT,
  id_niveau   INTEGER NOT NULL REFERENCES niveau(id) ON DELETE RESTRICT,
  date_debut  DATE NOT NULL DEFAULT CURRENT_DATE,
  date_fin    DATE,
  cree_le     TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_affectation_dates CHECK (date_fin IS NULL OR date_fin >= date_debut)
);

-- Un membre n'a qu'une seule affectation active à la fois
CREATE UNIQUE INDEX uq_affectation_active
  ON affectation_niveau (id_membre)
  WHERE date_fin IS NULL;

-- Pour l'historique par niveau (T16)
CREATE INDEX idx_affectation_niveau_niveau ON affectation_niveau (id_niveau);

CREATE TABLE seance (
  id             SERIAL PRIMARY KEY,
  id_etude       INTEGER NOT NULL REFERENCES etude(id) ON DELETE RESTRICT,
  id_enseignant  INTEGER NOT NULL REFERENCES membre(id) ON DELETE RESTRICT,
  date_debut     TIMESTAMPTZ NOT NULL,
  duree_minutes  INTEGER NOT NULL CHECK (duree_minutes > 0 AND duree_minutes <= 1440),
  cree_le        TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Pour le planning d'un enseignant et le contrôle des chevauchements
CREATE INDEX idx_seance_enseignant_date ON seance (id_enseignant, date_debut);
CREATE INDEX idx_seance_etude ON seance (id_etude);
