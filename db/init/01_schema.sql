--
-- PostgreSQL database dump
--

-- Dumped from database version 15.2
-- Dumped by pg_dump version 15.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: bloquer_composition_publiee(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.bloquer_composition_publiee() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  etat_version VARCHAR;
BEGIN
  SELECT etat INTO etat_version
    FROM version_etude
   WHERE id = COALESCE(NEW.id_version_etude, OLD.id_version_etude);

  IF etat_version = 'publiee' THEN
    RAISE EXCEPTION 'La composition d''une version publi‚e est immuable.';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: bloquer_ressource_publiee(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.bloquer_ressource_publiee() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  etat_version VARCHAR;
BEGIN
  SELECT etat INTO etat_version
    FROM version_activite
   WHERE id = COALESCE(NEW.id_version_activite, OLD.id_version_activite);

  IF etat_version = 'publiee' THEN
    RAISE EXCEPTION 'Les ressources d''une version publi‚e sont immuables.';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: bloquer_version_publiee(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.bloquer_version_publiee() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF OLD.etat = 'publiee'
     AND (to_jsonb(NEW) - 'etat') <> (to_jsonb(OLD) - 'etat') THEN
    RAISE EXCEPTION 'Une version publi‚e est immuable : cr‚ez une nouvelle version.';
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: maj_modifie_le(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.maj_modifie_le() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.modifie_le = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: maj_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.maj_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activite_competence; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activite_competence (
    id_version_activite integer NOT NULL,
    id_competence integer NOT NULL
);


--
-- Name: affectation_enseignant; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.affectation_enseignant (
    id integer NOT NULL,
    id_membre integer NOT NULL,
    id_etude integer NOT NULL,
    date_debut date DEFAULT CURRENT_DATE NOT NULL,
    date_fin date,
    cree_le timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_affectation_enseignant_dates CHECK (((date_fin IS NULL) OR (date_fin >= date_debut)))
);


--
-- Name: affectation_enseignant_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.affectation_enseignant_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: affectation_enseignant_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.affectation_enseignant_id_seq OWNED BY public.affectation_enseignant.id;


--
-- Name: affectation_niveau; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.affectation_niveau (
    id integer NOT NULL,
    id_membre integer NOT NULL,
    id_niveau integer NOT NULL,
    date_debut date DEFAULT CURRENT_DATE NOT NULL,
    date_fin date,
    cree_le timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_affectation_dates CHECK (((date_fin IS NULL) OR (date_fin >= date_debut)))
);


--
-- Name: affectation_niveau_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.affectation_niveau_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: affectation_niveau_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.affectation_niveau_id_seq OWNED BY public.affectation_niveau.id;


--
-- Name: categorie; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categorie (
    id integer NOT NULL,
    nom character varying(100) NOT NULL,
    description text
);


--
-- Name: categorie_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categorie_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categorie_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categorie_id_seq OWNED BY public.categorie.id;


--
-- Name: competence; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.competence (
    id integer NOT NULL,
    id_categorie integer,
    id_niveau integer,
    libelle character varying(150) NOT NULL,
    description text,
    cree_le timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: competence_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.competence_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: competence_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.competence_id_seq OWNED BY public.competence.id;


--
-- Name: conteneur_contenu; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conteneur_contenu (
    id integer NOT NULL,
    id_etude integer NOT NULL,
    id_seance integer,
    titre character varying(200) NOT NULL,
    description text,
    cree_par integer,
    cree_le timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: conteneur_contenu_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.conteneur_contenu_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: conteneur_contenu_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.conteneur_contenu_id_seq OWNED BY public.conteneur_contenu.id;


--
-- Name: definition_activite; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.definition_activite (
    id integer NOT NULL,
    id_etude integer NOT NULL,
    code_type_activite character varying(50) NOT NULL,
    titre character varying(200),
    description text,
    cree_le timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: definition_activite_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.definition_activite_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: definition_activite_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.definition_activite_id_seq OWNED BY public.definition_activite.id;


--
-- Name: etude; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.etude (
    id integer NOT NULL,
    type_etude character varying(20) NOT NULL,
    id_parent integer,
    id_categorie integer,
    id_niveau integer,
    id_niveau_prerequis integer,
    ordre integer DEFAULT 0 NOT NULL,
    titre character varying(200) NOT NULL,
    cree_le timestamp without time zone DEFAULT now() NOT NULL,
    modifie_le timestamp without time zone DEFAULT now() NOT NULL,
    description text,
    parcours_particulier boolean DEFAULT false NOT NULL,
    CONSTRAINT chk_etude_hierarchie CHECK (((((type_etude)::text = 'formation'::text) AND (id_parent IS NULL)) OR (((type_etude)::text = 'unite'::text) AND (id_parent IS NOT NULL)))),
    CONSTRAINT chk_etude_niveau_unite CHECK ((((type_etude)::text = 'unite'::text) OR ((id_niveau IS NULL) AND (id_niveau_prerequis IS NULL) AND (parcours_particulier = false)))),
    CONSTRAINT etude_type_etude_check CHECK (((type_etude)::text = ANY ((ARRAY['formation'::character varying, 'unite'::character varying])::text[])))
);


--
-- Name: etude_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.etude_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: etude_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.etude_id_seq OWNED BY public.etude.id;


--
-- Name: fichier; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fichier (
    id integer NOT NULL,
    id_conteneur integer NOT NULL,
    nom_original character varying(255) NOT NULL,
    nom_stocke character varying(64) NOT NULL,
    type_mime character varying(100) NOT NULL,
    type_media character varying(20) NOT NULL,
    taille_octets bigint NOT NULL,
    cree_le timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT fichier_taille_octets_check CHECK ((taille_octets > 0)),
    CONSTRAINT fichier_type_media_check CHECK (((type_media)::text = ANY ((ARRAY['pdf'::character varying, 'image'::character varying, 'audio'::character varying, 'video'::character varying])::text[])))
);


--
-- Name: fichier_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fichier_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fichier_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fichier_id_seq OWNED BY public.fichier.id;


--
-- Name: groupe; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.groupe (
    id integer NOT NULL,
    nom character varying(150) NOT NULL,
    description text,
    id_responsable integer NOT NULL,
    statut character varying(20) DEFAULT 'actif'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_groupe_statut CHECK (((statut)::text = ANY ((ARRAY['actif'::character varying, 'archive'::character varying])::text[])))
);


--
-- Name: groupe_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.groupe_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: groupe_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.groupe_id_seq OWNED BY public.groupe.id;


--
-- Name: groupe_membre; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.groupe_membre (
    id integer NOT NULL,
    id_groupe integer NOT NULL,
    id_membre integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: groupe_membre_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.groupe_membre_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: groupe_membre_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.groupe_membre_id_seq OWNED BY public.groupe_membre.id;


--
-- Name: inscription_seance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inscription_seance (
    id integer NOT NULL,
    id_seance integer NOT NULL,
    id_membre integer NOT NULL,
    inscrit_par integer NOT NULL,
    date_inscription timestamp with time zone DEFAULT now() NOT NULL,
    id_niveau integer
);


--
-- Name: inscription_seance_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inscription_seance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inscription_seance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inscription_seance_id_seq OWNED BY public.inscription_seance.id;


--
-- Name: membre; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.membre (
    id integer NOT NULL,
    id_utilisateur integer NOT NULL,
    statut character varying(20) DEFAULT 'actif'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    id_organisation smallint DEFAULT 1 NOT NULL,
    CONSTRAINT chk_membre_statut CHECK (((statut)::text = ANY ((ARRAY['actif'::character varying, 'suspendu'::character varying, 'inactif'::character varying, 'archive'::character varying])::text[])))
);


--
-- Name: membre_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.membre_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: membre_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.membre_id_seq OWNED BY public.membre.id;


--
-- Name: membre_role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.membre_role (
    id integer NOT NULL,
    id_membre integer NOT NULL,
    id_role integer NOT NULL,
    attribue_par integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: membre_role_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.membre_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: membre_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.membre_role_id_seq OWNED BY public.membre_role.id;


--
-- Name: niveau; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.niveau (
    id integer NOT NULL,
    nom character varying(100) NOT NULL,
    ordre integer NOT NULL,
    cree_le timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: niveau_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.niveau_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: niveau_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.niveau_id_seq OWNED BY public.niveau.id;


--
-- Name: organisation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organisation (
    id smallint DEFAULT 1 NOT NULL,
    nom character varying(150) NOT NULL,
    type character varying(50),
    statut character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_organisation_statut CHECK (((statut)::text = ANY ((ARRAY['active'::character varying, 'suspendue'::character varying, 'archivee'::character varying])::text[]))),
    CONSTRAINT chk_organisation_unique CHECK ((id = 1))
);


--
-- Name: parametre; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parametre (
    cle character varying(60) NOT NULL,
    valeur character varying(255) NOT NULL,
    description character varying(255)
);


--
-- Name: permission; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permission (
    id integer NOT NULL,
    code character varying(60) NOT NULL,
    description character varying(255)
);


--
-- Name: permission_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.permission_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: permission_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.permission_id_seq OWNED BY public.permission.id;


--
-- Name: presence_seance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.presence_seance (
    id_seance integer NOT NULL,
    id_membre integer NOT NULL,
    present boolean NOT NULL,
    marque_par integer NOT NULL,
    date_marquage timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: regle_telechargement; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.regle_telechargement (
    type_fichier character varying(20) NOT NULL,
    telechargeable boolean DEFAULT false NOT NULL,
    CONSTRAINT regle_telechargement_type_fichier_check CHECK (((type_fichier)::text = ANY ((ARRAY['pdf'::character varying, 'image'::character varying, 'audio'::character varying, 'video'::character varying])::text[])))
);


--
-- Name: reinitialisation_mot_de_passe; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reinitialisation_mot_de_passe (
    id integer NOT NULL,
    id_utilisateur integer NOT NULL,
    empreinte_jeton character(64) NOT NULL,
    cree_le timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expire_le timestamp without time zone NOT NULL,
    utilisee_le timestamp without time zone,
    CONSTRAINT chk_reinit_expiration CHECK ((expire_le > cree_le))
);


--
-- Name: reinitialisation_mot_de_passe_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reinitialisation_mot_de_passe_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reinitialisation_mot_de_passe_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reinitialisation_mot_de_passe_id_seq OWNED BY public.reinitialisation_mot_de_passe.id;


--
-- Name: ressource; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ressource (
    id integer NOT NULL,
    id_version_activite integer NOT NULL,
    type_media character varying(30) NOT NULL,
    titre character varying(200),
    url text NOT NULL,
    duree_secondes integer,
    ordre integer DEFAULT 0 NOT NULL,
    cree_le timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT ressource_type_media_check CHECK (((type_media)::text = ANY ((ARRAY['video'::character varying, 'pdf'::character varying, 'audio'::character varying, 'image'::character varying, 'lien'::character varying])::text[])))
);


--
-- Name: ressource_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ressource_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ressource_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ressource_id_seq OWNED BY public.ressource.id;


--
-- Name: role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    nom character varying(100) NOT NULL
);


--
-- Name: role_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.role_id_seq OWNED BY public.role.id;


--
-- Name: role_permission; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permission (
    id_role integer NOT NULL,
    id_permission integer NOT NULL
);


--
-- Name: seance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seance (
    id integer NOT NULL,
    id_etude integer NOT NULL,
    id_enseignant integer NOT NULL,
    date_debut timestamp with time zone NOT NULL,
    duree_minutes integer NOT NULL,
    cree_le timestamp without time zone DEFAULT now() NOT NULL,
    capacite integer,
    CONSTRAINT chk_seance_capacite CHECK (((capacite IS NULL) OR (capacite > 0))),
    CONSTRAINT seance_duree_minutes_check CHECK (((duree_minutes > 0) AND (duree_minutes <= 1440)))
);


--
-- Name: seance_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.seance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: seance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.seance_id_seq OWNED BY public.seance.id;


--
-- Name: session_utilisateur; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session_utilisateur (
    id integer NOT NULL,
    id_utilisateur integer NOT NULL,
    empreinte_jeton character(64) NOT NULL,
    adresse_ip character varying(45),
    agent_utilisateur character varying(255),
    cree_le timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expire_le timestamp without time zone NOT NULL,
    revoquee_le timestamp without time zone,
    CONSTRAINT chk_session_expiration CHECK ((expire_le > cree_le))
);


--
-- Name: session_utilisateur_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.session_utilisateur_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: session_utilisateur_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.session_utilisateur_id_seq OWNED BY public.session_utilisateur.id;


--
-- Name: solde_seance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solde_seance (
    id_membre integer NOT NULL,
    id_niveau integer NOT NULL,
    nombre integer DEFAULT 0 NOT NULL,
    CONSTRAINT solde_seance_nombre_check CHECK ((nombre >= 0))
);


--
-- Name: statut_membre_historique; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.statut_membre_historique (
    id integer NOT NULL,
    id_membre integer NOT NULL,
    ancien_statut character varying(20),
    nouveau_statut character varying(20) NOT NULL,
    date_changement timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    modifie_par integer,
    raison text
);


--
-- Name: statut_membre_historique_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.statut_membre_historique_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: statut_membre_historique_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.statut_membre_historique_id_seq OWNED BY public.statut_membre_historique.id;


--
-- Name: tutelle; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tutelle (
    id integer NOT NULL,
    id_tuteur integer NOT NULL,
    id_apprenant integer NOT NULL,
    type_relation character varying(30) NOT NULL,
    consentement_requis boolean DEFAULT false NOT NULL,
    consentement_donne_le timestamp without time zone,
    statut character varying(20) DEFAULT 'active'::character varying NOT NULL,
    revoquee_le timestamp without time zone,
    revoquee_par integer,
    motif_revocation text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_tutelle_distincts CHECK ((id_tuteur <> id_apprenant)),
    CONSTRAINT chk_tutelle_statut CHECK (((statut)::text = ANY ((ARRAY['active'::character varying, 'revoquee'::character varying])::text[]))),
    CONSTRAINT chk_tutelle_type CHECK (((type_relation)::text = ANY ((ARRAY['parent'::character varying, 'tuteur_legal'::character varying, 'responsable_groupe'::character varying, 'delegue'::character varying])::text[])))
);


--
-- Name: tutelle_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tutelle_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tutelle_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tutelle_id_seq OWNED BY public.tutelle.id;


--
-- Name: type_activite; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.type_activite (
    code character varying(50) NOT NULL,
    libelle character varying(150) NOT NULL
);


--
-- Name: utilisateur; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.utilisateur (
    id integer NOT NULL,
    nom character varying(100) NOT NULL,
    prenom character varying(100) NOT NULL,
    email character varying(150),
    telephone character varying(30),
    mot_de_passe_hash character varying(255),
    date_naissance date,
    statut character varying(20) DEFAULT 'actif'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_utilisateur_contact CHECK (((email IS NOT NULL) OR (telephone IS NOT NULL) OR ((statut)::text = 'anonymise'::text))),
    CONSTRAINT chk_utilisateur_statut CHECK (((statut)::text = ANY ((ARRAY['actif'::character varying, 'suspendu'::character varying, 'anonymise'::character varying])::text[])))
);


--
-- Name: utilisateur_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.utilisateur_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: utilisateur_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.utilisateur_id_seq OWNED BY public.utilisateur.id;


--
-- Name: version_activite; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.version_activite (
    id integer NOT NULL,
    id_definition_activite integer NOT NULL,
    numero integer NOT NULL,
    etat character varying(20) DEFAULT 'brouillon'::character varying NOT NULL,
    titre_version character varying(200),
    description text,
    duree_estimee_min integer,
    publie_le timestamp without time zone,
    publie_par integer,
    cree_le timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT version_activite_etat_check CHECK (((etat)::text = ANY ((ARRAY['brouillon'::character varying, 'publiee'::character varying, 'depreciee'::character varying, 'archivee'::character varying])::text[])))
);


--
-- Name: version_activite_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.version_activite_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: version_activite_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.version_activite_id_seq OWNED BY public.version_activite.id;


--
-- Name: version_etude; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.version_etude (
    id integer NOT NULL,
    id_etude integer NOT NULL,
    numero integer NOT NULL,
    etat character varying(20) DEFAULT 'brouillon'::character varying NOT NULL,
    titre character varying(200) NOT NULL,
    description text,
    id_version_politique integer,
    publie_le timestamp without time zone,
    publie_par integer,
    cree_le timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT version_etude_etat_check CHECK (((etat)::text = ANY ((ARRAY['brouillon'::character varying, 'publiee'::character varying, 'depreciee'::character varying, 'archivee'::character varying])::text[])))
);


--
-- Name: version_etude_activite; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.version_etude_activite (
    id_version_etude integer NOT NULL,
    id_version_activite integer NOT NULL,
    ordre integer DEFAULT 0 NOT NULL,
    obligatoire boolean DEFAULT true NOT NULL
);


--
-- Name: version_etude_competence; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.version_etude_competence (
    id_version_etude integer NOT NULL,
    id_competence integer NOT NULL
);


--
-- Name: version_etude_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.version_etude_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: version_etude_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.version_etude_id_seq OWNED BY public.version_etude.id;


--
-- Name: affectation_enseignant id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affectation_enseignant ALTER COLUMN id SET DEFAULT nextval('public.affectation_enseignant_id_seq'::regclass);


--
-- Name: affectation_niveau id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affectation_niveau ALTER COLUMN id SET DEFAULT nextval('public.affectation_niveau_id_seq'::regclass);


--
-- Name: categorie id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorie ALTER COLUMN id SET DEFAULT nextval('public.categorie_id_seq'::regclass);


--
-- Name: competence id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competence ALTER COLUMN id SET DEFAULT nextval('public.competence_id_seq'::regclass);


--
-- Name: conteneur_contenu id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conteneur_contenu ALTER COLUMN id SET DEFAULT nextval('public.conteneur_contenu_id_seq'::regclass);


--
-- Name: definition_activite id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.definition_activite ALTER COLUMN id SET DEFAULT nextval('public.definition_activite_id_seq'::regclass);


--
-- Name: etude id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.etude ALTER COLUMN id SET DEFAULT nextval('public.etude_id_seq'::regclass);


--
-- Name: fichier id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fichier ALTER COLUMN id SET DEFAULT nextval('public.fichier_id_seq'::regclass);


--
-- Name: groupe id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groupe ALTER COLUMN id SET DEFAULT nextval('public.groupe_id_seq'::regclass);


--
-- Name: groupe_membre id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groupe_membre ALTER COLUMN id SET DEFAULT nextval('public.groupe_membre_id_seq'::regclass);


--
-- Name: inscription_seance id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscription_seance ALTER COLUMN id SET DEFAULT nextval('public.inscription_seance_id_seq'::regclass);


--
-- Name: membre id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membre ALTER COLUMN id SET DEFAULT nextval('public.membre_id_seq'::regclass);


--
-- Name: membre_role id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membre_role ALTER COLUMN id SET DEFAULT nextval('public.membre_role_id_seq'::regclass);


--
-- Name: niveau id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.niveau ALTER COLUMN id SET DEFAULT nextval('public.niveau_id_seq'::regclass);


--
-- Name: permission id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permission ALTER COLUMN id SET DEFAULT nextval('public.permission_id_seq'::regclass);


--
-- Name: reinitialisation_mot_de_passe id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reinitialisation_mot_de_passe ALTER COLUMN id SET DEFAULT nextval('public.reinitialisation_mot_de_passe_id_seq'::regclass);


--
-- Name: ressource id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ressource ALTER COLUMN id SET DEFAULT nextval('public.ressource_id_seq'::regclass);


--
-- Name: role id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role ALTER COLUMN id SET DEFAULT nextval('public.role_id_seq'::regclass);


--
-- Name: seance id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seance ALTER COLUMN id SET DEFAULT nextval('public.seance_id_seq'::regclass);


--
-- Name: session_utilisateur id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_utilisateur ALTER COLUMN id SET DEFAULT nextval('public.session_utilisateur_id_seq'::regclass);


--
-- Name: statut_membre_historique id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.statut_membre_historique ALTER COLUMN id SET DEFAULT nextval('public.statut_membre_historique_id_seq'::regclass);


--
-- Name: tutelle id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutelle ALTER COLUMN id SET DEFAULT nextval('public.tutelle_id_seq'::regclass);


--
-- Name: utilisateur id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateur ALTER COLUMN id SET DEFAULT nextval('public.utilisateur_id_seq'::regclass);


--
-- Name: version_activite id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.version_activite ALTER COLUMN id SET DEFAULT nextval('public.version_activite_id_seq'::regclass);


--
-- Name: version_etude id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.version_etude ALTER COLUMN id SET DEFAULT nextval('public.version_etude_id_seq'::regclass);


--
-- Name: activite_competence activite_competence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activite_competence
    ADD CONSTRAINT activite_competence_pkey PRIMARY KEY (id_version_activite, id_competence);


--
-- Name: affectation_enseignant affectation_enseignant_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affectation_enseignant
    ADD CONSTRAINT affectation_enseignant_pkey PRIMARY KEY (id);


--
-- Name: affectation_niveau affectation_niveau_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affectation_niveau
    ADD CONSTRAINT affectation_niveau_pkey PRIMARY KEY (id);


--
-- Name: categorie categorie_nom_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorie
    ADD CONSTRAINT categorie_nom_key UNIQUE (nom);


--
-- Name: categorie categorie_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorie
    ADD CONSTRAINT categorie_pkey PRIMARY KEY (id);


--
-- Name: competence competence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competence
    ADD CONSTRAINT competence_pkey PRIMARY KEY (id);


--
-- Name: conteneur_contenu conteneur_contenu_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conteneur_contenu
    ADD CONSTRAINT conteneur_contenu_pkey PRIMARY KEY (id);


--
-- Name: definition_activite definition_activite_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.definition_activite
    ADD CONSTRAINT definition_activite_pkey PRIMARY KEY (id);


--
-- Name: etude etude_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.etude
    ADD CONSTRAINT etude_pkey PRIMARY KEY (id);


--
-- Name: fichier fichier_nom_stocke_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fichier
    ADD CONSTRAINT fichier_nom_stocke_key UNIQUE (nom_stocke);


--
-- Name: fichier fichier_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fichier
    ADD CONSTRAINT fichier_pkey PRIMARY KEY (id);


--
-- Name: groupe_membre groupe_membre_id_groupe_id_membre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groupe_membre
    ADD CONSTRAINT groupe_membre_id_groupe_id_membre_key UNIQUE (id_groupe, id_membre);


--
-- Name: groupe_membre groupe_membre_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groupe_membre
    ADD CONSTRAINT groupe_membre_pkey PRIMARY KEY (id);


--
-- Name: groupe groupe_nom_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groupe
    ADD CONSTRAINT groupe_nom_key UNIQUE (nom);


--
-- Name: groupe groupe_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groupe
    ADD CONSTRAINT groupe_pkey PRIMARY KEY (id);


--
-- Name: inscription_seance inscription_seance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscription_seance
    ADD CONSTRAINT inscription_seance_pkey PRIMARY KEY (id);


--
-- Name: membre membre_id_utilisateur_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membre
    ADD CONSTRAINT membre_id_utilisateur_key UNIQUE (id_utilisateur);


--
-- Name: membre membre_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membre
    ADD CONSTRAINT membre_pkey PRIMARY KEY (id);


--
-- Name: membre_role membre_role_id_membre_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membre_role
    ADD CONSTRAINT membre_role_id_membre_id_role_key UNIQUE (id_membre, id_role);


--
-- Name: membre_role membre_role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membre_role
    ADD CONSTRAINT membre_role_pkey PRIMARY KEY (id);


--
-- Name: niveau niveau_nom_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.niveau
    ADD CONSTRAINT niveau_nom_key UNIQUE (nom);


--
-- Name: niveau niveau_ordre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.niveau
    ADD CONSTRAINT niveau_ordre_key UNIQUE (ordre);


--
-- Name: niveau niveau_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.niveau
    ADD CONSTRAINT niveau_pkey PRIMARY KEY (id);


--
-- Name: organisation organisation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organisation
    ADD CONSTRAINT organisation_pkey PRIMARY KEY (id);


--
-- Name: parametre parametre_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parametre
    ADD CONSTRAINT parametre_pkey PRIMARY KEY (cle);


--
-- Name: permission permission_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permission
    ADD CONSTRAINT permission_code_key UNIQUE (code);


--
-- Name: permission permission_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permission
    ADD CONSTRAINT permission_pkey PRIMARY KEY (id);


--
-- Name: presence_seance presence_seance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presence_seance
    ADD CONSTRAINT presence_seance_pkey PRIMARY KEY (id_seance, id_membre);


--
-- Name: regle_telechargement regle_telechargement_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regle_telechargement
    ADD CONSTRAINT regle_telechargement_pkey PRIMARY KEY (type_fichier);


--
-- Name: reinitialisation_mot_de_passe reinitialisation_mot_de_passe_empreinte_jeton_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reinitialisation_mot_de_passe
    ADD CONSTRAINT reinitialisation_mot_de_passe_empreinte_jeton_key UNIQUE (empreinte_jeton);


--
-- Name: reinitialisation_mot_de_passe reinitialisation_mot_de_passe_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reinitialisation_mot_de_passe
    ADD CONSTRAINT reinitialisation_mot_de_passe_pkey PRIMARY KEY (id);


--
-- Name: ressource ressource_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ressource
    ADD CONSTRAINT ressource_pkey PRIMARY KEY (id);


--
-- Name: role role_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role
    ADD CONSTRAINT role_code_key UNIQUE (code);


--
-- Name: role_permission role_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permission
    ADD CONSTRAINT role_permission_pkey PRIMARY KEY (id_role, id_permission);


--
-- Name: role role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role
    ADD CONSTRAINT role_pkey PRIMARY KEY (id);


--
-- Name: seance seance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seance
    ADD CONSTRAINT seance_pkey PRIMARY KEY (id);


--
-- Name: session_utilisateur session_utilisateur_empreinte_jeton_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_utilisateur
    ADD CONSTRAINT session_utilisateur_empreinte_jeton_key UNIQUE (empreinte_jeton);


--
-- Name: session_utilisateur session_utilisateur_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_utilisateur
    ADD CONSTRAINT session_utilisateur_pkey PRIMARY KEY (id);


--
-- Name: solde_seance solde_seance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solde_seance
    ADD CONSTRAINT solde_seance_pkey PRIMARY KEY (id_membre, id_niveau);


--
-- Name: statut_membre_historique statut_membre_historique_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.statut_membre_historique
    ADD CONSTRAINT statut_membre_historique_pkey PRIMARY KEY (id);


--
-- Name: tutelle tutelle_id_tuteur_id_apprenant_type_relation_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutelle
    ADD CONSTRAINT tutelle_id_tuteur_id_apprenant_type_relation_key UNIQUE (id_tuteur, id_apprenant, type_relation);


--
-- Name: tutelle tutelle_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutelle
    ADD CONSTRAINT tutelle_pkey PRIMARY KEY (id);


--
-- Name: type_activite type_activite_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.type_activite
    ADD CONSTRAINT type_activite_pkey PRIMARY KEY (code);


--
-- Name: inscription_seance uq_inscription_seance_membre; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscription_seance
    ADD CONSTRAINT uq_inscription_seance_membre UNIQUE (id_seance, id_membre);


--
-- Name: utilisateur utilisateur_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_email_key UNIQUE (email);


--
-- Name: utilisateur utilisateur_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_pkey PRIMARY KEY (id);


--
-- Name: utilisateur utilisateur_telephone_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_telephone_key UNIQUE (telephone);


--
-- Name: version_activite version_activite_id_definition_activite_numero_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.version_activite
    ADD CONSTRAINT version_activite_id_definition_activite_numero_key UNIQUE (id_definition_activite, numero);


--
-- Name: version_activite version_activite_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.version_activite
    ADD CONSTRAINT version_activite_pkey PRIMARY KEY (id);


--
-- Name: version_etude_activite version_etude_activite_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.version_etude_activite
    ADD CONSTRAINT version_etude_activite_pkey PRIMARY KEY (id_version_etude, id_version_activite);


--
-- Name: version_etude_competence version_etude_competence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.version_etude_competence
    ADD CONSTRAINT version_etude_competence_pkey PRIMARY KEY (id_version_etude, id_competence);


--
-- Name: version_etude version_etude_id_etude_numero_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.version_etude
    ADD CONSTRAINT version_etude_id_etude_numero_key UNIQUE (id_etude, numero);


--
-- Name: version_etude version_etude_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.version_etude
    ADD CONSTRAINT version_etude_pkey PRIMARY KEY (id);


--
-- Name: idx_affectation_enseignant_etude; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_affectation_enseignant_etude ON public.affectation_enseignant USING btree (id_etude);


--
-- Name: idx_affectation_niveau_niveau; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_affectation_niveau_niveau ON public.affectation_niveau USING btree (id_niveau);


--
-- Name: idx_conteneur_etude; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conteneur_etude ON public.conteneur_contenu USING btree (id_etude);


--
-- Name: idx_conteneur_seance; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conteneur_seance ON public.conteneur_contenu USING btree (id_seance);


--
-- Name: idx_fichier_conteneur; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fichier_conteneur ON public.fichier USING btree (id_conteneur);


--
-- Name: idx_inscription_seance_membre; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inscription_seance_membre ON public.inscription_seance USING btree (id_membre);


--
-- Name: idx_reinit_utilisateur; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reinit_utilisateur ON public.reinitialisation_mot_de_passe USING btree (id_utilisateur);


--
-- Name: idx_seance_enseignant_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seance_enseignant_date ON public.seance USING btree (id_enseignant, date_debut);


--
-- Name: idx_seance_etude; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seance_etude ON public.seance USING btree (id_etude);


--
-- Name: idx_session_utilisateur; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_session_utilisateur ON public.session_utilisateur USING btree (id_utilisateur);


--
-- Name: uq_affectation_active; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_affectation_active ON public.affectation_niveau USING btree (id_membre) WHERE (date_fin IS NULL);


--
-- Name: uq_affectation_enseignant_active; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_affectation_enseignant_active ON public.affectation_enseignant USING btree (id_membre, id_etude) WHERE (date_fin IS NULL);


--
-- Name: uq_composition_ordre; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_composition_ordre ON public.version_etude_activite USING btree (id_version_etude, ordre);


--
-- Name: uq_etude_ordre_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_etude_ordre_parent ON public.etude USING btree (id_parent, ordre) WHERE (id_parent IS NOT NULL);


--
-- Name: version_etude_activite trg_composition_immuable; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_composition_immuable BEFORE INSERT OR DELETE OR UPDATE ON public.version_etude_activite FOR EACH ROW EXECUTE FUNCTION public.bloquer_composition_publiee();


--
-- Name: etude trg_etude_modifie_le; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_etude_modifie_le BEFORE UPDATE ON public.etude FOR EACH ROW EXECUTE FUNCTION public.maj_modifie_le();


--
-- Name: organisation trg_organisation_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_organisation_updated_at BEFORE UPDATE ON public.organisation FOR EACH ROW EXECUTE FUNCTION public.maj_updated_at();


--
-- Name: ressource trg_ressource_immuable; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_ressource_immuable BEFORE INSERT OR DELETE OR UPDATE ON public.ressource FOR EACH ROW EXECUTE FUNCTION public.bloquer_ressource_publiee();


--
-- Name: tutelle trg_tutelle_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_tutelle_updated_at BEFORE UPDATE ON public.tutelle FOR EACH ROW EXECUTE FUNCTION public.maj_updated_at();


--
-- Name: utilisateur trg_utilisateur_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_utilisateur_updated_at BEFORE UPDATE ON public.utilisateur FOR EACH ROW EXECUTE FUNCTION public.maj_updated_at();


--
-- Name: version_activite trg_version_activite_immuable; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_version_activite_immuable BEFORE UPDATE ON public.version_activite FOR EACH ROW EXECUTE FUNCTION public.bloquer_version_publiee();


--
-- Name: version_etude trg_version_etude_immuable; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_version_etude_immuable BEFORE UPDATE ON public.version_etude FOR EACH ROW EXECUTE FUNCTION public.bloquer_version_publiee();


--
-- Name: activite_competence activite_competence_id_competence_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activite_competence
    ADD CONSTRAINT activite_competence_id_competence_fkey FOREIGN KEY (id_competence) REFERENCES public.competence(id) ON DELETE RESTRICT;


--
-- Name: activite_competence activite_competence_id_version_activite_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activite_competence
    ADD CONSTRAINT activite_competence_id_version_activite_fkey FOREIGN KEY (id_version_activite) REFERENCES public.version_activite(id) ON DELETE RESTRICT;


--
-- Name: affectation_enseignant affectation_enseignant_id_etude_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affectation_enseignant
    ADD CONSTRAINT affectation_enseignant_id_etude_fkey FOREIGN KEY (id_etude) REFERENCES public.etude(id) ON DELETE RESTRICT;


--
-- Name: affectation_enseignant affectation_enseignant_id_membre_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affectation_enseignant
    ADD CONSTRAINT affectation_enseignant_id_membre_fkey FOREIGN KEY (id_membre) REFERENCES public.membre(id) ON DELETE RESTRICT;


--
-- Name: affectation_niveau affectation_niveau_id_membre_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affectation_niveau
    ADD CONSTRAINT affectation_niveau_id_membre_fkey FOREIGN KEY (id_membre) REFERENCES public.membre(id) ON DELETE RESTRICT;


--
-- Name: affectation_niveau affectation_niveau_id_niveau_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affectation_niveau
    ADD CONSTRAINT affectation_niveau_id_niveau_fkey FOREIGN KEY (id_niveau) REFERENCES public.niveau(id) ON DELETE RESTRICT;


--
-- Name: competence competence_id_categorie_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competence
    ADD CONSTRAINT competence_id_categorie_fkey FOREIGN KEY (id_categorie) REFERENCES public.categorie(id) ON DELETE RESTRICT;


--
-- Name: competence competence_id_niveau_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competence
    ADD CONSTRAINT competence_id_niveau_fkey FOREIGN KEY (id_niveau) REFERENCES public.niveau(id) ON DELETE RESTRICT;


--
-- Name: conteneur_contenu conteneur_contenu_cree_par_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conteneur_contenu
    ADD CONSTRAINT conteneur_contenu_cree_par_fkey FOREIGN KEY (cree_par) REFERENCES public.membre(id) ON DELETE RESTRICT;


--
-- Name: conteneur_contenu conteneur_contenu_id_etude_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conteneur_contenu
    ADD CONSTRAINT conteneur_contenu_id_etude_fkey FOREIGN KEY (id_etude) REFERENCES public.etude(id) ON DELETE RESTRICT;


--
-- Name: conteneur_contenu conteneur_contenu_id_seance_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conteneur_contenu
    ADD CONSTRAINT conteneur_contenu_id_seance_fkey FOREIGN KEY (id_seance) REFERENCES public.seance(id) ON DELETE RESTRICT;


--
-- Name: definition_activite definition_activite_code_type_activite_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.definition_activite
    ADD CONSTRAINT definition_activite_code_type_activite_fkey FOREIGN KEY (code_type_activite) REFERENCES public.type_activite(code) ON DELETE RESTRICT;


--
-- Name: definition_activite definition_activite_id_etude_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.definition_activite
    ADD CONSTRAINT definition_activite_id_etude_fkey FOREIGN KEY (id_etude) REFERENCES public.etude(id) ON DELETE RESTRICT;


--
-- Name: etude etude_id_categorie_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.etude
    ADD CONSTRAINT etude_id_categorie_fkey FOREIGN KEY (id_categorie) REFERENCES public.categorie(id) ON DELETE RESTRICT;


--
-- Name: etude etude_id_niveau_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.etude
    ADD CONSTRAINT etude_id_niveau_fkey FOREIGN KEY (id_niveau) REFERENCES public.niveau(id) ON DELETE RESTRICT;


--
-- Name: etude etude_id_niveau_prerequis_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.etude
    ADD CONSTRAINT etude_id_niveau_prerequis_fkey FOREIGN KEY (id_niveau_prerequis) REFERENCES public.niveau(id) ON DELETE RESTRICT;


--
-- Name: etude etude_id_parent_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.etude
    ADD CONSTRAINT etude_id_parent_fkey FOREIGN KEY (id_parent) REFERENCES public.etude(id) ON DELETE RESTRICT;


--
-- Name: fichier fichier_id_conteneur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fichier
    ADD CONSTRAINT fichier_id_conteneur_fkey FOREIGN KEY (id_conteneur) REFERENCES public.conteneur_contenu(id) ON DELETE CASCADE;


--
-- Name: membre fk_membre_organisation; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membre
    ADD CONSTRAINT fk_membre_organisation FOREIGN KEY (id_organisation) REFERENCES public.organisation(id) ON DELETE RESTRICT;


--
-- Name: presence_seance fk_presence_inscription; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presence_seance
    ADD CONSTRAINT fk_presence_inscription FOREIGN KEY (id_seance, id_membre) REFERENCES public.inscription_seance(id_seance, id_membre) ON DELETE CASCADE;


--
-- Name: groupe groupe_id_responsable_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groupe
    ADD CONSTRAINT groupe_id_responsable_fkey FOREIGN KEY (id_responsable) REFERENCES public.membre(id) ON DELETE RESTRICT;


--
-- Name: groupe_membre groupe_membre_id_groupe_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groupe_membre
    ADD CONSTRAINT groupe_membre_id_groupe_fkey FOREIGN KEY (id_groupe) REFERENCES public.groupe(id) ON DELETE RESTRICT;


--
-- Name: groupe_membre groupe_membre_id_membre_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groupe_membre
    ADD CONSTRAINT groupe_membre_id_membre_fkey FOREIGN KEY (id_membre) REFERENCES public.membre(id) ON DELETE RESTRICT;


--
-- Name: inscription_seance inscription_seance_id_membre_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscription_seance
    ADD CONSTRAINT inscription_seance_id_membre_fkey FOREIGN KEY (id_membre) REFERENCES public.membre(id) ON DELETE RESTRICT;


--
-- Name: inscription_seance inscription_seance_id_niveau_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscription_seance
    ADD CONSTRAINT inscription_seance_id_niveau_fkey FOREIGN KEY (id_niveau) REFERENCES public.niveau(id) ON DELETE RESTRICT;


--
-- Name: inscription_seance inscription_seance_id_seance_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscription_seance
    ADD CONSTRAINT inscription_seance_id_seance_fkey FOREIGN KEY (id_seance) REFERENCES public.seance(id) ON DELETE CASCADE;


--
-- Name: inscription_seance inscription_seance_inscrit_par_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscription_seance
    ADD CONSTRAINT inscription_seance_inscrit_par_fkey FOREIGN KEY (inscrit_par) REFERENCES public.membre(id) ON DELETE RESTRICT;


--
-- Name: membre membre_id_utilisateur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membre
    ADD CONSTRAINT membre_id_utilisateur_fkey FOREIGN KEY (id_utilisateur) REFERENCES public.utilisateur(id) ON DELETE RESTRICT;


--
-- Name: membre_role membre_role_attribue_par_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membre_role
    ADD CONSTRAINT membre_role_attribue_par_fkey FOREIGN KEY (attribue_par) REFERENCES public.membre(id) ON DELETE RESTRICT;


--
-- Name: membre_role membre_role_id_membre_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membre_role
    ADD CONSTRAINT membre_role_id_membre_fkey FOREIGN KEY (id_membre) REFERENCES public.membre(id) ON DELETE RESTRICT;


--
-- Name: membre_role membre_role_id_role_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membre_role
    ADD CONSTRAINT membre_role_id_role_fkey FOREIGN KEY (id_role) REFERENCES public.role(id) ON DELETE RESTRICT;


--
-- Name: presence_seance presence_seance_marque_par_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presence_seance
    ADD CONSTRAINT presence_seance_marque_par_fkey FOREIGN KEY (marque_par) REFERENCES public.membre(id) ON DELETE RESTRICT;


--
-- Name: reinitialisation_mot_de_passe reinitialisation_mot_de_passe_id_utilisateur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reinitialisation_mot_de_passe
    ADD CONSTRAINT reinitialisation_mot_de_passe_id_utilisateur_fkey FOREIGN KEY (id_utilisateur) REFERENCES public.utilisateur(id) ON DELETE CASCADE;


--
-- Name: ressource ressource_id_version_activite_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ressource
    ADD CONSTRAINT ressource_id_version_activite_fkey FOREIGN KEY (id_version_activite) REFERENCES public.version_activite(id) ON DELETE RESTRICT;


--
-- Name: role_permission role_permission_id_permission_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permission
    ADD CONSTRAINT role_permission_id_permission_fkey FOREIGN KEY (id_permission) REFERENCES public.permission(id) ON DELETE CASCADE;


--
-- Name: role_permission role_permission_id_role_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permission
    ADD CONSTRAINT role_permission_id_role_fkey FOREIGN KEY (id_role) REFERENCES public.role(id) ON DELETE CASCADE;


--
-- Name: seance seance_id_enseignant_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seance
    ADD CONSTRAINT seance_id_enseignant_fkey FOREIGN KEY (id_enseignant) REFERENCES public.membre(id) ON DELETE RESTRICT;


--
-- Name: seance seance_id_etude_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seance
    ADD CONSTRAINT seance_id_etude_fkey FOREIGN KEY (id_etude) REFERENCES public.etude(id) ON DELETE RESTRICT;


--
-- Name: session_utilisateur session_utilisateur_id_utilisateur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_utilisateur
    ADD CONSTRAINT session_utilisateur_id_utilisateur_fkey FOREIGN KEY (id_utilisateur) REFERENCES public.utilisateur(id) ON DELETE CASCADE;


--
-- Name: solde_seance solde_seance_id_membre_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solde_seance
    ADD CONSTRAINT solde_seance_id_membre_fkey FOREIGN KEY (id_membre) REFERENCES public.membre(id) ON DELETE RESTRICT;


--
-- Name: solde_seance solde_seance_id_niveau_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solde_seance
    ADD CONSTRAINT solde_seance_id_niveau_fkey FOREIGN KEY (id_niveau) REFERENCES public.niveau(id) ON DELETE RESTRICT;


--
-- Name: statut_membre_historique statut_membre_historique_id_membre_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.statut_membre_historique
    ADD CONSTRAINT statut_membre_historique_id_membre_fkey FOREIGN KEY (id_membre) REFERENCES public.membre(id) ON DELETE RESTRICT;


--
-- Name: statut_membre_historique statut_membre_historique_modifie_par_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.statut_membre_historique
    ADD CONSTRAINT statut_membre_historique_modifie_par_fkey FOREIGN KEY (modifie_par) REFERENCES public.membre(id) ON DELETE RESTRICT;


--
-- Name: tutelle tutelle_id_apprenant_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutelle
    ADD CONSTRAINT tutelle_id_apprenant_fkey FOREIGN KEY (id_apprenant) REFERENCES public.membre(id) ON DELETE RESTRICT;


--
-- Name: tutelle tutelle_id_tuteur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutelle
    ADD CONSTRAINT tutelle_id_tuteur_fkey FOREIGN KEY (id_tuteur) REFERENCES public.membre(id) ON DELETE RESTRICT;


--
-- Name: tutelle tutelle_revoquee_par_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutelle
    ADD CONSTRAINT tutelle_revoquee_par_fkey FOREIGN KEY (revoquee_par) REFERENCES public.membre(id) ON DELETE RESTRICT;


--
-- Name: version_activite version_activite_id_definition_activite_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.version_activite
    ADD CONSTRAINT version_activite_id_definition_activite_fkey FOREIGN KEY (id_definition_activite) REFERENCES public.definition_activite(id) ON DELETE RESTRICT;


--
-- Name: version_activite version_activite_publie_par_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.version_activite
    ADD CONSTRAINT version_activite_publie_par_fkey FOREIGN KEY (publie_par) REFERENCES public.membre(id) ON DELETE RESTRICT;


--
-- Name: version_etude_activite version_etude_activite_id_version_activite_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.version_etude_activite
    ADD CONSTRAINT version_etude_activite_id_version_activite_fkey FOREIGN KEY (id_version_activite) REFERENCES public.version_activite(id) ON DELETE RESTRICT;


--
-- Name: version_etude_activite version_etude_activite_id_version_etude_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.version_etude_activite
    ADD CONSTRAINT version_etude_activite_id_version_etude_fkey FOREIGN KEY (id_version_etude) REFERENCES public.version_etude(id) ON DELETE RESTRICT;


--
-- Name: version_etude_competence version_etude_competence_id_competence_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.version_etude_competence
    ADD CONSTRAINT version_etude_competence_id_competence_fkey FOREIGN KEY (id_competence) REFERENCES public.competence(id) ON DELETE RESTRICT;


--
-- Name: version_etude_competence version_etude_competence_id_version_etude_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.version_etude_competence
    ADD CONSTRAINT version_etude_competence_id_version_etude_fkey FOREIGN KEY (id_version_etude) REFERENCES public.version_etude(id) ON DELETE RESTRICT;


--
-- Name: version_etude version_etude_id_etude_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.version_etude
    ADD CONSTRAINT version_etude_id_etude_fkey FOREIGN KEY (id_etude) REFERENCES public.etude(id) ON DELETE RESTRICT;


--
-- Name: version_etude version_etude_publie_par_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.version_etude
    ADD CONSTRAINT version_etude_publie_par_fkey FOREIGN KEY (publie_par) REFERENCES public.membre(id) ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

