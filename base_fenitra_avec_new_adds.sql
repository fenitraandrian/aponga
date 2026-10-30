--  LES 7 CORRECTIONS BLOQUANTES 
--  ------------------------------------------------------------------
--  [C1] Versionner la structure : version_etude ; l'offre pointe une version.
--  [C2] Tout est identifié par `membre` (jamais par `utilisateur`).
--  [C3] Fait ≠ jugement : preuve, resultat (immuables), puis interpretation
--       (règle référencée) et outcome (état + feedback).
--  [C4] Plus de ON DELETE CASCADE sur la chaîne de faits ; interdiction de
--       supprimer physiquement un fait enregistré (triggers).
--  [C5] Accès commercial : offre.type_acces, pack, droit_acces,
--       participation.statut = 'en_attente_paiement'.
--  [C6] Réussite (Achievement) : certificat/crédits dépendent d'une réussite ;
--       `realisation` devient un calcul (vue), plus un compteur stocké.
--  [C7] Multi-tenant par instance (voir ci-dessus) + cohérence interne
--       garantie par triggers à la place d'un id_organisation partout.
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- 1. IDENTITY — qui existe, qui a le droit de quoi
-- ============================================================================

-- Profil du tenant : UNE seule ligne (l'instance EST l'organisation).
CREATE TABLE organisation (
   id TINYINT PRIMARY KEY DEFAULT 1,
   nom VARCHAR(150) NOT NULL,
   type VARCHAR(50),
   statut VARCHAR(20) NOT NULL DEFAULT 'active',
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
   CONSTRAINT chk_organisation_unique CHECK (id = 1),
   CONSTRAINT chk_organisation_statut CHECK (statut IN ('active','suspendue','archivee'))
) ENGINE=InnoDB;

CREATE TABLE utilisateur (
   id INT PRIMARY KEY AUTO_INCREMENT,
   nom VARCHAR(100) NOT NULL,
   prenom VARCHAR(100) NOT NULL,
   email VARCHAR(150) UNIQUE,
   telephone VARCHAR(30) UNIQUE,
   -- Nullable : connexion par téléphone/OTP/SSO possible (mobile money, etc.)
   mot_de_passe_hash VARCHAR(255) NULL,
   date_naissance DATE,
   statut VARCHAR(20) NOT NULL DEFAULT 'actif',
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
   CONSTRAINT chk_utilisateur_statut CHECK (statut IN ('actif','suspendu','anonymise')),
   -- 'anonymise' = droit à l'effacement (RGPD) : on efface l'identité, pas les faits
   CONSTRAINT chk_utilisateur_contact CHECK (email IS NOT NULL OR telephone IS NOT NULL OR statut = 'anonymise')
) ENGINE=InnoDB;


-------------MY_ADDS________
-- Sessions : une ligne par connexion active. Déconnexion = remplir revoquee_le.
CREATE TABLE session_utilisateur (
   id INT PRIMARY KEY AUTO_INCREMENT,
   id_utilisateur INT NOT NULL,
   empreinte_jeton CHAR(64) NOT NULL UNIQUE,
   adresse_ip VARCHAR(45) NULL,
   agent_utilisateur VARCHAR(255) NULL,
   cree_le DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   expire_le DATETIME NOT NULL,
   revoquee_le DATETIME NULL,
   CONSTRAINT chk_session_expiration CHECK (expire_le > cree_le),
   FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id) ON DELETE CASCADE,
   INDEX idx_session_utilisateur (id_utilisateur)
) ENGINE=InnoDB;

-- Mot de passe oublié : jeton à usage unique, de courte durée.
CREATE TABLE reinitialisation_mot_de_passe (
   id INT PRIMARY KEY AUTO_INCREMENT,
   id_utilisateur INT NOT NULL,
   empreinte_jeton CHAR(64) NOT NULL UNIQUE,
   cree_le DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   expire_le DATETIME NOT NULL,
   utilisee_le DATETIME NULL,
   CONSTRAINT chk_reinit_expiration CHECK (expire_le > cree_le),
   FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id) ON DELETE CASCADE,
   INDEX idx_reinit_utilisateur (id_utilisateur)
) ENGINE=InnoDB;
-- _________________________


-- [C2] Adhésion au tenant : c'est le membre (membership_id) que connaissent
-- tous les autres blocs, jamais l'utilisateur.
CREATE TABLE membre (
   id INT PRIMARY KEY AUTO_INCREMENT,
   id_utilisateur INT NOT NULL UNIQUE,
   statut VARCHAR(20) NOT NULL DEFAULT 'actif',
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT chk_membre_statut CHECK (statut IN ('actif','suspendu','inactif','archive')),
   FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

ALTER TABLE membre
  ADD COLUMN id_organisation SMALLINT NOT NULL DEFAULT 1;

ALTER TABLE membre
  ADD CONSTRAINT fk_membre_organisation
  FOREIGN KEY (id_organisation) REFERENCES organisation(id) ON DELETE RESTRICT;

-- Optionnel : PostgreSQL n'indexe pas automatiquement une clé étrangère
CREATE INDEX idx_membre_organisation ON membre(id_organisation);


CREATE TABLE statut_membre_historique (
   id INT PRIMARY KEY AUTO_INCREMENT,
   id_membre INT NOT NULL,
   ancien_statut VARCHAR(20),
   nouveau_statut VARCHAR(20) NOT NULL,
   date_changement DATETIME DEFAULT CURRENT_TIMESTAMP,
   modifie_par INT NULL,
   raison TEXT,
   FOREIGN KEY (id_membre) REFERENCES membre(id) ON DELETE RESTRICT,
   FOREIGN KEY (modifie_par) REFERENCES membre(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE role (
   id INT PRIMARY KEY AUTO_INCREMENT,
   code VARCHAR(50) NOT NULL UNIQUE,
   nom VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE permission (
   id INT PRIMARY KEY AUTO_INCREMENT,
   code VARCHAR(60) NOT NULL UNIQUE,
   description VARCHAR(255)
) ENGINE=InnoDB;

CREATE TABLE role_permission (
   id_role INT NOT NULL,
   id_permission INT NOT NULL,
   PRIMARY KEY (id_role, id_permission),
   FOREIGN KEY (id_role) REFERENCES role(id) ON DELETE CASCADE,
   FOREIGN KEY (id_permission) REFERENCES permission(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE membre_role (
   id INT PRIMARY KEY AUTO_INCREMENT,
   id_membre INT NOT NULL,
   id_role INT NOT NULL,
   attribue_par INT NULL,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (id_membre) REFERENCES membre(id) ON DELETE RESTRICT,
   FOREIGN KEY (id_role) REFERENCES role(id) ON DELETE RESTRICT,
   FOREIGN KEY (attribue_par) REFERENCES membre(id) ON DELETE RESTRICT,
   UNIQUE (id_membre, id_role)
) ENGINE=InnoDB;

-- Tutelle / supervision (Guardianship généralisé) : entre deux MEMBRES.
--  parent, tuteur_legal : tutelle d'un mineur (consentement possible)
--  responsable_groupe   : le responsable d'un groupe suit la progression de ses membres
--  delegue              : délégation de lecture
CREATE TABLE tutelle (
   id INT PRIMARY KEY AUTO_INCREMENT,
   id_tuteur INT NOT NULL,
   id_apprenant INT NOT NULL,
   type_relation VARCHAR(30) NOT NULL,
   consentement_requis TINYINT(1) NOT NULL DEFAULT 0,
   consentement_donne_le DATETIME NULL,
   statut VARCHAR(20) NOT NULL DEFAULT 'active',
   revoquee_le DATETIME NULL,
   revoquee_par INT NULL,
   motif_revocation TEXT NULL,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
   CONSTRAINT chk_tutelle_type CHECK (type_relation IN ('parent','tuteur_legal','responsable_groupe','delegue')),
   CONSTRAINT chk_tutelle_statut CHECK (statut IN ('active','revoquee')),
   CONSTRAINT chk_tutelle_distincts CHECK (id_tuteur <> id_apprenant),
   FOREIGN KEY (id_tuteur) REFERENCES membre(id) ON DELETE RESTRICT,
   FOREIGN KEY (id_apprenant) REFERENCES membre(id) ON DELETE RESTRICT,
   FOREIGN KEY (revoquee_par) REFERENCES membre(id) ON DELETE RESTRICT,
   UNIQUE (id_tuteur, id_apprenant, type_relation)
) ENGINE=InnoDB;

-- Groupe (ex. « Groupe Lemasa ») : regroupement de membres, support de la
-- licence de groupe. Ce n'est PAS une organisation (le tenant est l'instance).
CREATE TABLE groupe (
   id INT PRIMARY KEY AUTO_INCREMENT,
   nom VARCHAR(150) NOT NULL UNIQUE,
   description TEXT,
   id_responsable INT NOT NULL,
   statut VARCHAR(20) NOT NULL DEFAULT 'actif',
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT chk_groupe_statut CHECK (statut IN ('actif','archive')),
   FOREIGN KEY (id_responsable) REFERENCES membre(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE groupe_membre (
   id INT PRIMARY KEY AUTO_INCREMENT,
   id_groupe INT NOT NULL,
   id_membre INT NOT NULL,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (id_groupe) REFERENCES groupe(id) ON DELETE RESTRICT,
   FOREIGN KEY (id_membre) REFERENCES membre(id) ON DELETE RESTRICT,
   UNIQUE (id_groupe, id_membre)
) ENGINE=InnoDB;

-- Paramètres de la plateforme (valeurs de configuration du tenant)
CREATE TABLE parametre (
   cle VARCHAR(60) PRIMARY KEY,
   valeur VARCHAR(255) NOT NULL,
   description VARCHAR(255)
) ENGINE=InnoDB;

-- ============================================================================
-- 2. DESIGN — le contenu pédagogique, hors du temps, versionné et immuable
-- ============================================================================

CREATE TABLE niveau (
   id INT PRIMARY KEY AUTO_INCREMENT,
   nom VARCHAR(100) NOT NULL UNIQUE,
   ordre INT NOT NULL UNIQUE,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE categorie (
   id INT PRIMARY KEY AUTO_INCREMENT,
   nom VARCHAR(100) NOT NULL UNIQUE,
   description TEXT
) ENGINE=InnoDB;

-- Point d'extension : un nouveau type d'activité = une ligne ici, aucun
-- changement de structure.
CREATE TABLE type_activite (
   code VARCHAR(50) PRIMARY KEY,
   libelle VARCHAR(150) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE politique (
   id INT PRIMARY KEY AUTO_INCREMENT,
   titre VARCHAR(200) NOT NULL,
   description TEXT,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE version_politique (
   id INT PRIMARY KEY AUTO_INCREMENT,
   id_politique INT NOT NULL,
   numero INT NOT NULL,
   etat VARCHAR(20) NOT NULL DEFAULT 'brouillon',
   label_version VARCHAR(100) NOT NULL,
   contenu TEXT,
   publie_le DATETIME NULL,
   publie_par INT NULL,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT chk_vpol_etat CHECK (etat IN ('brouillon','publiee','depreciee','archivee')),
   FOREIGN KEY (id_politique) REFERENCES politique(id) ON DELETE RESTRICT,
   FOREIGN KEY (publie_par) REFERENCES membre(id) ON DELETE RESTRICT,
   UNIQUE (id_politique, numero)
) ENGINE=InnoDB;

-- RuleVersion structurée (la règle n'est plus un simple TEXT).
--  score_minimum                    : score ≥ seuil sur les activités du type visé
--  taux_presence_minimum            : présence ≥ seuil % des séances planifiées
--  activites_obligatoires_completees: toutes les activités obligatoires terminées
--  validation_humaine               : un évaluateur doit valider (boucle de correction) ;
--                                     code_type_activite précise QUELLE activité l'exige (NULL = toutes)
CREATE TABLE regle_politique (
   id INT PRIMARY KEY AUTO_INCREMENT,
   id_version_politique INT NOT NULL,
   ordre INT NOT NULL DEFAULT 0,
   critere VARCHAR(50) NOT NULL,
   code_type_activite VARCHAR(50) NULL,
   seuil DECIMAL(5,2) NULL,
   description VARCHAR(255),
   CONSTRAINT chk_regle_critere CHECK (critere IN ('score_minimum','taux_presence_minimum','activites_obligatoires_completees','validation_humaine')),
   FOREIGN KEY (id_version_politique) REFERENCES version_politique(id) ON DELETE RESTRICT,
   FOREIGN KEY (code_type_activite) REFERENCES type_activite(code) ON DELETE RESTRICT,
   UNIQUE (id_version_politique, ordre)
) ENGINE=InnoDB;

CREATE TABLE competence (
   id INT PRIMARY KEY AUTO_INCREMENT,
   id_categorie INT NULL,
   id_niveau INT NULL,
   libelle VARCHAR(150) NOT NULL,
   description TEXT,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (id_categorie) REFERENCES categorie(id) ON DELETE RESTRICT,
   FOREIGN KEY (id_niveau) REFERENCES niveau(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- LearningStructure : identité STABLE d'un parcours / niveau / module.
-- Le contenu vit dans version_etude [C1]. id_niveau NULL = module isolé ou
-- contenu de découverte (cas 3 et 6).
CREATE TABLE etude (
   id INT PRIMARY KEY AUTO_INCREMENT,
   id_parent INT NULL,
   id_categorie INT NULL,
   id_niveau INT NULL,
   id_niveau_prerequis INT NULL,
   titre VARCHAR(200) NOT NULL,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
   FOREIGN KEY (id_parent) REFERENCES etude(id) ON DELETE RESTRICT,
   FOREIGN KEY (id_categorie) REFERENCES categorie(id) ON DELETE RESTRICT,
   FOREIGN KEY (id_niveau) REFERENCES niveau(id) ON DELETE RESTRICT,
   FOREIGN KEY (id_niveau_prerequis) REFERENCES niveau(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- [C1] StructureVersion : instantané IMMUABLE une fois publié.
CREATE TABLE version_etude (
   id INT PRIMARY KEY AUTO_INCREMENT,
   id_etude INT NOT NULL,
   numero INT NOT NULL,
   etat VARCHAR(20) NOT NULL DEFAULT 'brouillon',
   titre VARCHAR(200) NOT NULL,
   description TEXT,
   -- Règle qui jugera ce parcours. NULL = contenu non évalué (ex. découverte gratuite).
   id_version_politique INT NULL,
   publie_le DATETIME NULL,
   publie_par INT NULL,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT chk_vetude_etat CHECK (etat IN ('brouillon','publiee','depreciee','archivee')),
   FOREIGN KEY (id_etude) REFERENCES etude(id) ON DELETE RESTRICT,
   FOREIGN KEY (id_version_politique) REFERENCES version_politique(id) ON DELETE RESTRICT,
   FOREIGN KEY (publie_par) REFERENCES membre(id) ON DELETE RESTRICT,
   UNIQUE (id_etude, numero)
) ENGINE=InnoDB;

CREATE TABLE definition_activite (
   id INT PRIMARY KEY AUTO_INCREMENT,
   id_etude INT NOT NULL,
   type VARCHAR(50) NOT NULL,
   titre VARCHAR(200),
   description TEXT,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (id_etude) REFERENCES etude(id) ON DELETE RESTRICT,
   FOREIGN KEY (type) REFERENCES type_activite(code) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE version_activite (
   id INT PRIMARY KEY AUTO_INCREMENT,
   id_definition_activite INT NOT NULL,
   numero INT NOT NULL,
   etat VARCHAR(20) NOT NULL DEFAULT 'brouillon',
   titre_version VARCHAR(200),
   description TEXT,
   duree_estimee_min INT NULL,
   publie_le DATETIME NULL,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT chk_vact_etat CHECK (etat IN ('brouillon','publiee','depreciee','archivee')),
   FOREIGN KEY (id_definition_activite) REFERENCES definition_activite(id) ON DELETE RESTRICT,
   UNIQUE (id_definition_activite, numero)
) ENGINE=InnoDB;

-- Composition : quelles versions d'activités forment quelle version de parcours.
-- (remplace activity_definition_version, redondante avec la FK de version_activite)
CREATE TABLE version_etude_activite (
   id_version_etude INT NOT NULL,
   id_version_activite INT NOT NULL,
   ordre INT NOT NULL DEFAULT 0,
   obligatoire TINYINT(1) NOT NULL DEFAULT 1,
   PRIMARY KEY (id_version_etude, id_version_activite),
   FOREIGN KEY (id_version_etude) REFERENCES version_etude(id) ON DELETE RESTRICT,
   FOREIGN KEY (id_version_activite) REFERENCES version_activite(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Compétences validées par la réussite d'une version de parcours
CREATE TABLE version_etude_competence (
   id_version_etude INT NOT NULL,
   id_competence INT NOT NULL,
   PRIMARY KEY (id_version_etude, id_competence),
   FOREIGN KEY (id_version_etude) REFERENCES version_etude(id) ON DELETE RESTRICT,
   FOREIGN KEY (id_competence) REFERENCES competence(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Compétences travaillées par une activité
CREATE TABLE activite_competence (
   id_version_activite INT NOT NULL,
   id_competence INT NOT NULL,
   PRIMARY KEY (id_version_activite, id_competence),
   FOREIGN KEY (id_version_activite) REFERENCES version_activite(id) ON DELETE RESTRICT,
   FOREIGN KEY (id_competence) REFERENCES competence(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Rattachée à la VERSION d'activité (donc figée avec elle). L'ancien champ
-- statut_acces (gratuit/payant) disparaît : l'accès se décide au niveau de
-- l'OFFRE (offre.type_acces), pas de la vidéo.
CREATE TABLE ressource (
   id INT PRIMARY KEY AUTO_INCREMENT,
   id_version_activite INT NOT NULL,
   type_media VARCHAR(30) NOT NULL,
   titre VARCHAR(200),
   url TEXT NOT NULL,
   duree_secondes INT NULL,
   ordre INT NOT NULL DEFAULT 0,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT chk_ressource_media CHECK (type_media IN ('video','pdf','audio','image','lien')),
   FOREIGN KEY (id_version_activite) REFERENCES version_activite(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================================================
-- 3. DEPLOYMENT — la réalisation concrète : sessions, accès, staff
-- ============================================================================

-- [C1] L'offre pointe une VERSION de parcours (verrou de version, INV-DEPLOY-02).
-- [C5] type_acces : gratuit / payant. Le MONTANT n'existe pas ici : il
-- appartient au service PAIEMENT, hors noyau.
CREATE TABLE offre (
   id INT PRIMARY KEY AUTO_INCREMENT,
   id_version_etude INT NOT NULL,
   nom VARCHAR(150) NOT NULL,
   description TEXT,
   type_acces VARCHAR(10) NOT NULL DEFAULT 'gratuit',
   date_debut DATETIME NOT NULL,
   date_fin DATETIME NULL,
   statut VARCHAR(20) NOT NULL DEFAULT 'planifiee',
   publie_le DATETIME NULL,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
   CONSTRAINT chk_offre_acces CHECK (type_acces IN ('gratuit','payant')),
   CONSTRAINT chk_offre_statut CHECK (statut IN ('planifiee','publiee','active','close','archivee')),
   CONSTRAINT chk_offre_dates CHECK (date_fin IS NULL OR date_fin >= date_debut),
   FOREIGN KEY (id_version_etude) REFERENCES version_etude(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- capacite NULL = illimitée (gratuit, achat individuel)
CREATE TABLE cohorte (
   id INT PRIMARY KEY AUTO_INCREMENT,
   id_offre INT NOT NULL,
   nom VARCHAR(100) NOT NULL,
   capacite INT NULL,
   statut VARCHAR(20) NOT NULL DEFAULT 'active',
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT chk_cohorte_capacite CHECK (capacite IS NULL OR capacite > 0),
   CONSTRAINT chk_cohorte_statut CHECK (statut IN ('active','close','archivee')),
   FOREIGN KEY (id_offre) REFERENCES offre(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 'planifiee'  : séance à horaire fixe (studio, salle)
-- 'asynchrone' : fenêtre de disponibilité d'un contenu à la demande (vidéo, quiz)
CREATE TABLE activite_occurrence (
   id INT PRIMARY KEY AUTO_INCREMENT,
   id_version_activite INT NOT NULL,
   id_offre INT NOT NULL,
   mode VARCHAR(15) NOT NULL DEFAULT 'asynchrone',
   date_debut DATETIME NOT NULL,
   date_fin DATETIME NULL,
   lieu VARCHAR(150),
   statut VARCHAR(20) NOT NULL DEFAULT 'planifiee',
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
   CONSTRAINT chk_occ_mode CHECK (mode IN ('planifiee','asynchrone')),
   CONSTRAINT chk_occ_statut CHECK (statut IN ('planifiee','ouverte','close','annulee')),
   CONSTRAINT chk_occ_dates CHECK (date_fin IS NULL OR date_fin >= date_debut),
   FOREIGN KEY (id_version_activite) REFERENCES version_activite(id) ON DELETE RESTRICT,
   FOREIGN KEY (id_offre) REFERENCES offre(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- [C2] Staff = membres. Affecté à une offre (évaluateur, formateur), éventuellement
-- restreint à une cohorte ou à une occurrence : c'est ce qui borne ce qu'un
-- évaluateur a le droit de voir (contrôle d'accès par ligne).
CREATE TABLE affectation_staff (
   id INT PRIMARY KEY AUTO_INCREMENT,
   id_offre INT NOT NULL,
   id_cohorte INT NULL,
   id_activite_occurrence INT NULL,
   id_membre INT NOT NULL,
   role_staff VARCHAR(30) NOT NULL,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT chk_staff_role CHECK (role_staff IN ('formateur_principal','evaluateur','assistant')),
   FOREIGN KEY (id_offre) REFERENCES offre(id) ON DELETE RESTRICT,
   FOREIGN KEY (id_cohorte) REFERENCES cohorte(id) ON DELETE RESTRICT,
   FOREIGN KEY (id_activite_occurrence) REFERENCES activite_occurrence(id) ON DELETE RESTRICT,
   FOREIGN KEY (id_membre) REFERENCES membre(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- [C5] Forfait (pack) : regroupe plusieurs offres (ex. Débutant + Intermédiaire + Avancé)
CREATE TABLE pack (
   id INT PRIMARY KEY AUTO_INCREMENT,
   nom VARCHAR(150) NOT NULL UNIQUE,
   description TEXT,
   statut VARCHAR(20) NOT NULL DEFAULT 'actif',
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT chk_pack_statut CHECK (statut IN ('actif','archive'))
) ENGINE=InnoDB;

CREATE TABLE pack_offre (
   id_pack INT NOT NULL,
   id_offre INT NOT NULL,
   PRIMARY KEY (id_pack, id_offre),
   FOREIGN KEY (id_pack) REFERENCES pack(id) ON DELETE RESTRICT,
   FOREIGN KEY (id_offre) REFERENCES offre(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- [C5] Entitlement : « ce membre a-t-il le DROIT d'accéder à cette offre ? »,
-- quelle que soit la source (paiement unitaire, forfait, licence de groupe...).
-- Un forfait est « déplié » à l'octroi : une ligne par offre, id_pack = origine.
-- AUCUNE donnée financière ici : seulement la référence opaque de l'événement
-- PaymentConfirmed qui a déclenché l'octroi.
CREATE TABLE droit_acces (
   id INT PRIMARY KEY AUTO_INCREMENT,
   id_membre INT NOT NULL,
   id_offre INT NOT NULL,
   id_pack INT NULL,
   id_groupe INT NULL,
   source VARCHAR(25) NOT NULL,
   accorde_par INT NULL,
   reference_evenement VARCHAR(64) NULL,
   statut VARCHAR(10) NOT NULL DEFAULT 'actif',
   accorde_le DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   expire_le DATETIME NULL,
   revoque_le DATETIME NULL,
   motif_revocation TEXT NULL,
   CONSTRAINT chk_droit_source CHECK (source IN ('gratuit','paiement_unitaire','paiement_pack','licence_groupe','octroi_manuel')),
   CONSTRAINT chk_droit_statut CHECK (statut IN ('actif','revoque','expire')),
   -- INV-DEPLOY-06 : une licence de groupe / un octroi manuel est toujours attribuable à quelqu'un
   CONSTRAINT chk_droit_tracable CHECK (source NOT IN ('licence_groupe','octroi_manuel') OR accorde_par IS NOT NULL),
   FOREIGN KEY (id_membre) REFERENCES membre(id) ON DELETE RESTRICT,
   FOREIGN KEY (id_offre) REFERENCES offre(id) ON DELETE RESTRICT,
   FOREIGN KEY (id_pack) REFERENCES pack(id) ON DELETE RESTRICT,
   FOREIGN KEY (id_groupe) REFERENCES groupe(id) ON DELETE RESTRICT,
   FOREIGN KEY (accorde_par) REFERENCES membre(id) ON DELETE RESTRICT,
   UNIQUE (id_membre, id_offre)
) ENGINE=InnoDB;

-- ============================================================================
-- 4. EXECUTION — ce qui s'est réellement passé (des FAITS, jamais de jugement)
-- ============================================================================

-- [C2][C5] Inscription d'un MEMBRE à une OFFRE. La cohorte est facultative.
-- Cycle : en_attente_paiement -> inscrit -> en_cours -> soumis -> interprete -> reconnu
CREATE TABLE participation (
   id INT PRIMARY KEY AUTO_INCREMENT,
   id_membre INT NOT NULL,
   id_offre INT NOT NULL,
   id_cohorte INT NULL,
   statut VARCHAR(25) NOT NULL DEFAULT 'inscrit',
   date_inscription DATETIME DEFAULT CURRENT_TIMESTAMP,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
   CONSTRAINT chk_part_statut CHECK (statut IN ('en_attente_paiement','inscrit','en_cours','soumis','interprete','reconnu','abandonne','annule')),
   FOREIGN KEY (id_membre) REFERENCES membre(id) ON DELETE RESTRICT,
   FOREIGN KEY (id_offre) REFERENCES offre(id) ON DELETE RESTRICT,
   FOREIGN KEY (id_cohorte) REFERENCES cohorte(id) ON DELETE RESTRICT,
   UNIQUE (id_membre, id_offre)
) ENGINE=InnoDB;

CREATE TABLE participation_statut_historique (
   id INT PRIMARY KEY AUTO_INCREMENT,
   id_participation INT NOT NULL,
   ancien_statut VARCHAR(25),
   nouveau_statut VARCHAR(25) NOT NULL,
   date_changement DATETIME DEFAULT CURRENT_TIMESTAMP,
   modifie_par INT NULL,
   FOREIGN KEY (id_participation) REFERENCES participation(id) ON DELETE RESTRICT,
   FOREIGN KEY (modifie_par) REFERENCES membre(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- UNE ligne par occurrence suivie : la présence se COMPTE (cas Micka), la
-- reprise après pause (cas 7) lit progression_pct / position_lecture_secondes.
CREATE TABLE execution_activite (
   id INT PRIMARY KEY AUTO_INCREMENT,
   id_participation INT NOT NULL,
   id_activite_occurrence INT NOT NULL,
   etat VARCHAR(15) NOT NULL DEFAULT 'prevu',
   statut_presence VARCHAR(10) NULL,
   progression_pct TINYINT UNSIGNED NULL,
   position_lecture_secondes INT NULL,
   commence_le DATETIME NULL,
   termine_le DATETIME NULL,
   commentaire TEXT,
   marque_par INT NULL,
   marque_le DATETIME NULL,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
   CONSTRAINT chk_exec_etat CHECK (etat IN ('prevu','en_cours','termine','manque')),
   CONSTRAINT chk_exec_presence CHECK (statut_presence IS NULL OR statut_presence IN ('present','absent','excuse')),
   CONSTRAINT chk_exec_pct CHECK (progression_pct IS NULL OR progression_pct <= 100),
   FOREIGN KEY (id_participation) REFERENCES participation(id) ON DELETE RESTRICT,
   FOREIGN KEY (id_activite_occurrence) REFERENCES activite_occurrence(id) ON DELETE RESTRICT,
   FOREIGN KEY (marque_par) REFERENCES membre(id) ON DELETE RESTRICT,
   UNIQUE (id_participation, id_activite_occurrence)
) ENGINE=InnoDB;

-- Une tentative = un dépôt. Un renvoi après correction = une NOUVELLE tentative
-- (l'ancienne reste intacte). id_participation n'est plus recopié (dérivable).
CREATE TABLE tentative (
   id INT PRIMARY KEY AUTO_INCREMENT,
   id_execution_activite INT NOT NULL,
   numero_tentative INT NOT NULL DEFAULT 1,
   etat VARCHAR(10) NOT NULL DEFAULT 'en_cours',
   soumise_le DATETIME NULL,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT chk_tent_etat CHECK (etat IN ('en_cours','soumise','annulee')),
   FOREIGN KEY (id_execution_activite) REFERENCES execution_activite(id) ON DELETE RESTRICT,
   UNIQUE (id_execution_activite, numero_tentative)
) ENGINE=InnoDB;

-- [C3] Evidence : ce que l'apprenant a déposé (vidéo de performance, réponses de quiz...)
CREATE TABLE preuve (
   id INT PRIMARY KEY AUTO_INCREMENT,
   id_tentative INT NOT NULL,
   type_preuve VARCHAR(25) NOT NULL,
   url TEXT NULL,
   contenu JSON NULL,
   empreinte_sha256 CHAR(64) NULL,
   taille_octets BIGINT NULL,
   duree_secondes INT NULL,
   depose_par INT NULL,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT chk_preuve_type CHECK (type_preuve IN ('video','document','fiche_observation','reponses_quiz','audio')),
   CONSTRAINT chk_preuve_contenu CHECK (url IS NOT NULL OR contenu IS NOT NULL),
   FOREIGN KEY (id_tentative) REFERENCES tentative(id) ON DELETE RESTRICT,
   FOREIGN KEY (depose_par) REFERENCES membre(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- [C3] Result : le fait mesuré. IMMUABLE. score NULL = évaluation qualitative
-- (ex. vidéo de performance) : un fait n'a pas toujours de note.
CREATE TABLE resultat (
   id INT PRIMARY KEY AUTO_INCREMENT,
   id_tentative INT NOT NULL UNIQUE,
   score DECIMAL(5,2) NULL,
   enregistre_le DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT chk_resultat_score CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
   FOREIGN KEY (id_tentative) REFERENCES tentative(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================================================
-- 5. INTERPRETATION — transformer les faits en jugement
-- ============================================================================

-- [C3] InterpretationRun : référence la règle appliquée (traçabilité d'audit).
CREATE TABLE interpretation (
   id INT PRIMARY KEY AUTO_INCREMENT,
   id_tentative INT NOT NULL,
   id_version_politique INT NOT NULL,
   etat VARCHAR(25) NOT NULL DEFAULT 'en_cours',
   declenchee_le DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   terminee_le DATETIME NULL,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT chk_interp_etat CHECK (etat IN ('en_cours','en_attente_arbitrage','en_attente_validation','terminee','echouee')),
   FOREIGN KEY (id_tentative) REFERENCES tentative(id) ON DELETE RESTRICT,
   FOREIGN KEY (id_version_politique) REFERENCES version_politique(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE resolution_conflit (
   id INT PRIMARY KEY AUTO_INCREMENT,
   id_interpretation INT NOT NULL,
   motif TEXT NOT NULL,
   decision TEXT NULL,
   arbitre_par INT NULL,
   decide_le DATETIME NULL,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (id_interpretation) REFERENCES interpretation(id) ON DELETE RESTRICT,
   FOREIGN KEY (arbitre_par) REFERENCES membre(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- [C3] Outcome : le jugement. Boucle de correction (cas 2) :
--   en_attente -> a_ameliorer (+ feedback obligatoire) | valide | refuse
-- Un état final ne change plus : un renvoi crée une nouvelle tentative, donc
-- une nouvelle interprétation, donc un nouvel outcome.
-- finalite :
--   'activite'            : jugement d'une activité (ex. quiz réussi) — ne débloque rien seul
--   'validation_niveau'   : décision de validation du parcours — seul à pouvoir créer une réussite
--   'retour_personnalise' : retour informatif (cas 8) — ne crée jamais de réussite
CREATE TABLE outcome (
   id INT PRIMARY KEY AUTO_INCREMENT,
   id_interpretation INT NOT NULL,
   finalite VARCHAR(25) NOT NULL DEFAULT 'activite',
   id_competence INT NULL,
   etat VARCHAR(15) NOT NULL DEFAULT 'en_attente',
   feedback TEXT NULL,
   evalue_par INT NULL,
   evalue_le DATETIME NULL,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT chk_outcome_finalite CHECK (finalite IN ('activite','validation_niveau','retour_personnalise')),
   CONSTRAINT chk_outcome_etat CHECK (etat IN ('en_attente','a_ameliorer','valide','refuse')),
   CONSTRAINT chk_outcome_feedback CHECK (etat <> 'a_ameliorer' OR (feedback IS NOT NULL AND CHAR_LENGTH(feedback) > 0)),
   FOREIGN KEY (id_interpretation) REFERENCES interpretation(id) ON DELETE RESTRICT,
   FOREIGN KEY (id_competence) REFERENCES competence(id) ON DELETE RESTRICT,
   FOREIGN KEY (evalue_par) REFERENCES membre(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================================================
-- 6. RECOGNITION — officialiser
-- ============================================================================

-- [C6] Achievement : « ce membre a validé cette compétence / ce niveau ».
-- C'est LA clé du déblocage du niveau suivant (INV-EXEC-06). Le niveau atteint
-- d'un membre n'est JAMAIS stocké : il se déduit de ses réussites (vue).
CREATE TABLE reussite (
   id INT PRIMARY KEY AUTO_INCREMENT,
   id_membre INT NOT NULL,
   id_outcome INT NOT NULL UNIQUE,
   id_competence INT NOT NULL,
   id_version_etude INT NOT NULL,
   etat VARCHAR(10) NOT NULL DEFAULT 'acquise',
   obtenue_le DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT chk_reussite_etat CHECK (etat IN ('acquise','revoquee')),
   FOREIGN KEY (id_membre) REFERENCES membre(id) ON DELETE RESTRICT,
   FOREIGN KEY (id_outcome) REFERENCES outcome(id) ON DELETE RESTRICT,
   FOREIGN KEY (id_competence) REFERENCES competence(id) ON DELETE RESTRICT,
   FOREIGN KEY (id_version_etude) REFERENCES version_etude(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Crédit facultatif (vide pour une formation non académique)
CREATE TABLE credit_obtenu (
   id INT PRIMARY KEY AUTO_INCREMENT,
   id_reussite INT NOT NULL,
   points INT NOT NULL DEFAULT 0,
   type_credit VARCHAR(50),
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT chk_credit_points CHECK (points >= 0),
   FOREIGN KEY (id_reussite) REFERENCES reussite(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Credential : en_attente -> emis -> (revoque | expire). Un revoque ne revient jamais.
CREATE TABLE certificat (
   id INT PRIMARY KEY AUTO_INCREMENT,
   id_reussite INT NOT NULL,
   type_credential VARCHAR(20) NOT NULL DEFAULT 'certificat_pdf',
   reference VARCHAR(100) NOT NULL UNIQUE,
   statut VARCHAR(15) NOT NULL DEFAULT 'en_attente',
   emis_le DATETIME NULL,
   date_expiration DATE NULL,
   revoque_le DATETIME NULL,
   revoque_par INT NULL,
   motif_revocation TEXT NULL,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT chk_cert_type CHECK (type_credential IN ('certificat_pdf','badge_numerique')),
   CONSTRAINT chk_cert_statut CHECK (statut IN ('en_attente','emis','revoque','expire')),
   -- INV-RECOG-05 : toute révocation trace décideur, date et motif
   CONSTRAINT chk_cert_revocation CHECK (statut <> 'revoque' OR (revoque_par IS NOT NULL AND revoque_le IS NOT NULL AND motif_revocation IS NOT NULL)),
   FOREIGN KEY (id_reussite) REFERENCES reussite(id) ON DELETE RESTRICT,
   FOREIGN KEY (revoque_par) REFERENCES membre(id) ON DELETE RESTRICT,
   UNIQUE (id_reussite, type_credential)
) ENGINE=InnoDB;

-- ============================================================================
-- 7. TRANSVERSE — audit, événements (outbox / inbox)
-- ============================================================================

-- AUDIT : journal append-only (aucun UPDATE ni DELETE possible : triggers).
CREATE TABLE journal_audit (
   id BIGINT PRIMARY KEY AUTO_INCREMENT,
   id_evenement CHAR(36) NOT NULL UNIQUE,
   type_evenement VARCHAR(100) NOT NULL,
   contexte_source VARCHAR(30) NOT NULL,
   correlation_id CHAR(36) NOT NULL,
   causation_id CHAR(36) NULL,
   id_acteur INT NULL,
   payload JSON NOT NULL,
   survenu_le DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
   INDEX idx_audit_corr (correlation_id),
   INDEX idx_audit_type (type_evenement)
) ENGINE=InnoDB;

-- Outbox : événements à publier vers les autres services (notification, paiement...)
CREATE TABLE evenement_sortant (
   id BIGINT PRIMARY KEY AUTO_INCREMENT,
   id_evenement CHAR(36) NOT NULL UNIQUE,
   type_evenement VARCHAR(100) NOT NULL,
   payload JSON NOT NULL,
   cree_le DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
   publie_le DATETIME(3) NULL
) ENGINE=InnoDB;

-- Inbox : événements reçus (ex. payment.PaymentConfirmed). id_evenement UNIQUE =
-- traitement idempotent (un même événement n'est jamais appliqué deux fois).
CREATE TABLE evenement_entrant (
   id BIGINT PRIMARY KEY AUTO_INCREMENT,
   id_evenement CHAR(36) NOT NULL UNIQUE,
   type_evenement VARCHAR(100) NOT NULL,
   payload JSON NOT NULL,
   recu_le DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
   traite_le DATETIME(3) NULL
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

-
