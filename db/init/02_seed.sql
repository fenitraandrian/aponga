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
-- Data for Name: permission; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.permission (id, code, description) VALUES (1, 'profil.consulter', 'Voir son propre profil');
INSERT INTO public.permission (id, code, description) VALUES (2, 'utilisateurs.lire', 'Voir la liste des utilisateurs et leurs r“les');
INSERT INTO public.permission (id, code, description) VALUES (3, 'utilisateurs.modifier', 'Modifier les informations des utilisateurs');
INSERT INTO public.permission (id, code, description) VALUES (4, 'roles.lire', 'Voir les r“les et leurs permissions');
INSERT INTO public.permission (id, code, description) VALUES (5, 'roles.gerer', 'Attribuer des r“les aux membres');
INSERT INTO public.permission (id, code, description) VALUES (6, 'pedagogie.lire', 'Consulter les formations, unit‚s et leurs versions');
INSERT INTO public.permission (id, code, description) VALUES (7, 'pedagogie.gerer', 'Cr‚er, modifier, supprimer et publier formations et unit‚s');
INSERT INTO public.permission (id, code, description) VALUES (8, 'apprenants.lire', 'Consulter les apprenants et leur niveau');
INSERT INTO public.permission (id, code, description) VALUES (9, 'apprenants.gerer', 'Cr‚er, modifier et affecter les apprenants … un niveau');
INSERT INTO public.permission (id, code, description) VALUES (10, 'seances.lire', 'Consulter le planning des s‚ances');
INSERT INTO public.permission (id, code, description) VALUES (11, 'seances.gerer', 'Cr‚er, modifier et supprimer des s‚ances');
INSERT INTO public.permission (id, code, description) VALUES (12, 'contenus.lire', 'Consulter et t‚l‚charger les contenus des unit‚s');
INSERT INTO public.permission (id, code, description) VALUES (13, 'contenus.gerer', 'T‚l‚verser, modifier et supprimer les contenus des unit‚s');
INSERT INTO public.permission (id, code, description) VALUES (14, 'enseignants.lire', 'Consulter les enseignants et leurs affectations');
INSERT INTO public.permission (id, code, description) VALUES (15, 'enseignants.gerer', 'Modifier les enseignants et g‚rer leurs affectations');
INSERT INTO public.permission (id, code, description) VALUES (16, 'inscriptions.lire', 'Voir les apprenants inscrits … une s‚ance');
INSERT INTO public.permission (id, code, description) VALUES (17, 'inscriptions.gerer', 'Inscrire et d‚sinscrire des apprenants aux s‚ances');
INSERT INTO public.permission (id, code, description) VALUES (18, 'inscriptions.soi', 'Voir les s‚ances disponibles et s''inscrire ou se d‚sinscrire soi-mˆme');
INSERT INTO public.permission (id, code, description) VALUES (19, 'presences.lire', 'Voir les pr‚sences d''une s‚ance');
INSERT INTO public.permission (id, code, description) VALUES (20, 'presences.gerer', 'Marquer les pr‚sences de ses s‚ances');
INSERT INTO public.permission (id, code, description) VALUES (21, 'telechargements.gerer', 'R‚gler quels types de documents peuvent ˆtre t‚l‚charg‚s');


--
-- Data for Name: role; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.role (id, code, nom) VALUES (1, 'administrateur', 'Administrateur');
INSERT INTO public.role (id, code, nom) VALUES (2, 'formateur', 'Formateur');
INSERT INTO public.role (id, code, nom) VALUES (3, 'apprenant', 'Apprenant');


--
-- Data for Name: role_permission; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.role_permission (id_role, id_permission) VALUES (1, 1);
INSERT INTO public.role_permission (id_role, id_permission) VALUES (1, 2);
INSERT INTO public.role_permission (id_role, id_permission) VALUES (1, 3);
INSERT INTO public.role_permission (id_role, id_permission) VALUES (1, 4);
INSERT INTO public.role_permission (id_role, id_permission) VALUES (1, 5);
INSERT INTO public.role_permission (id_role, id_permission) VALUES (2, 1);
INSERT INTO public.role_permission (id_role, id_permission) VALUES (2, 2);
INSERT INTO public.role_permission (id_role, id_permission) VALUES (3, 1);
INSERT INTO public.role_permission (id_role, id_permission) VALUES (1, 6);
INSERT INTO public.role_permission (id_role, id_permission) VALUES (1, 7);
INSERT INTO public.role_permission (id_role, id_permission) VALUES (2, 6);
INSERT INTO public.role_permission (id_role, id_permission) VALUES (1, 8);
INSERT INTO public.role_permission (id_role, id_permission) VALUES (1, 9);
INSERT INTO public.role_permission (id_role, id_permission) VALUES (2, 8);
INSERT INTO public.role_permission (id_role, id_permission) VALUES (1, 10);
INSERT INTO public.role_permission (id_role, id_permission) VALUES (1, 11);
INSERT INTO public.role_permission (id_role, id_permission) VALUES (2, 10);
INSERT INTO public.role_permission (id_role, id_permission) VALUES (1, 12);
INSERT INTO public.role_permission (id_role, id_permission) VALUES (1, 13);
INSERT INTO public.role_permission (id_role, id_permission) VALUES (2, 12);
INSERT INTO public.role_permission (id_role, id_permission) VALUES (2, 13);
INSERT INTO public.role_permission (id_role, id_permission) VALUES (1, 14);
INSERT INTO public.role_permission (id_role, id_permission) VALUES (1, 15);
INSERT INTO public.role_permission (id_role, id_permission) VALUES (2, 14);
INSERT INTO public.role_permission (id_role, id_permission) VALUES (1, 16);
INSERT INTO public.role_permission (id_role, id_permission) VALUES (1, 17);
INSERT INTO public.role_permission (id_role, id_permission) VALUES (2, 16);
INSERT INTO public.role_permission (id_role, id_permission) VALUES (3, 18);
INSERT INTO public.role_permission (id_role, id_permission) VALUES (2, 19);
INSERT INTO public.role_permission (id_role, id_permission) VALUES (2, 20);
INSERT INTO public.role_permission (id_role, id_permission) VALUES (1, 21);
INSERT INTO public.role_permission (id_role, id_permission) VALUES (1, 19);


--
-- Name: permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.permission_id_seq', 21, true);


--
-- Name: role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.role_id_seq', 3, true);


--
-- PostgreSQL database dump complete
--

