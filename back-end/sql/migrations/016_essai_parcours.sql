-- Parcours d'essai gratuit : public, indépendant des unités de l'école

CREATE TABLE essai_parcours (
  code            VARCHAR(30) PRIMARY KEY,
  libelle         VARCHAR(100) NOT NULL,
  position_depart INTEGER NOT NULL CHECK (position_depart > 0)
);

CREATE TABLE essai_unite (
  id        SERIAL PRIMARY KEY,
  position  INTEGER NOT NULL UNIQUE CHECK (position > 0),
  titre     VARCHAR(200) NOT NULL,
  objectifs TEXT
);

CREATE TABLE essai_section (
  id        SERIAL PRIMARY KEY,
  id_unite  INTEGER NOT NULL REFERENCES essai_unite(id) ON DELETE CASCADE,
  position  INTEGER NOT NULL,
  titre     VARCHAR(200) NOT NULL,
  contenu   TEXT NOT NULL,
  CONSTRAINT uq_essai_section_position UNIQUE (id_unite, position)
);

CREATE TABLE essai_question (
  id        SERIAL PRIMARY KEY,
  id_unite  INTEGER NOT NULL REFERENCES essai_unite(id) ON DELETE CASCADE,
  position  INTEGER NOT NULL,
  enonce    TEXT NOT NULL,
  CONSTRAINT uq_essai_question_position UNIQUE (id_unite, position)
);

CREATE TABLE essai_choix (
  id           SERIAL PRIMARY KEY,
  id_question  INTEGER NOT NULL REFERENCES essai_question(id) ON DELETE CASCADE,
  position     INTEGER NOT NULL,
  texte        VARCHAR(300) NOT NULL,
  est_bonne    BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT uq_essai_choix_position UNIQUE (id_question, position)
);

-- Une seule bonne réponse par question
CREATE UNIQUE INDEX uq_essai_choix_bonne ON essai_choix (id_question) WHERE est_bonne;