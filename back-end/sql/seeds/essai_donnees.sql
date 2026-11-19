-- Données de l'essai gratuit (percussion).
-- Les mauvaises réponses des QCM sont inventées : données de test.
-- Ce fichier vide les tables de l'essai puis les remplit. Relançable sans risque.

BEGIN;

TRUNCATE essai_parcours, essai_unite, essai_section, essai_question, essai_choix
  RESTART IDENTITY CASCADE;

-- Parcours : le niveau détermine l'unité de départ
INSERT INTO essai_parcours (code, libelle, position_depart) VALUES
  ('debutant', 'Débutant', 1),
  ('intermediaire', 'Intermédiaire à avancé', 4);

-- Unités
INSERT INTO essai_unite (id, position, titre, objectifs) VALUES
  (1, 1, 'Découverte de la percussion et de l''aponga', 'Situer la percussion dans la musique, présenter l''aponga et son rôle culturel.'),
  (2, 2, 'Le rythme et la pulsation', 'Ressentir la pulsation régulière et compter les temps.'),
  (3, 3, 'Les techniques de frappe', 'Adopter une bonne posture et produire des sons clairs.'),
  (4, 4, 'La famille des percussions', 'Classer les instruments et reconnaître leurs sons.'),
  (5, 5, 'Jouer ensemble', 'Se coordonner en groupe et découvrir la polyrythmie.'),
  (6, 6, 'Répertoire et tradition', 'Interpréter un ou plusieurs rythmes traditionnels de bout en bout.');
SELECT setval(pg_get_serial_sequence('essai_unite', 'id'), (SELECT MAX(id) FROM essai_unite));

-- Sections du cours
INSERT INTO essai_section (id_unite, position, titre, contenu) VALUES
  (1, 1, 'Qu''est-ce qu''un instrument de percussion ?', 'Un instrument de percussion produit un son quand on le frappe, le secoue ou le gratte.'),
  (1, 2, 'Présentation de l''aponga', 'L''aponga est un tambour malgache. Il est composé d''une forme, de matériaux, d''une peau et d''un fût.'),
  (1, 3, 'Place de l''aponga', 'L''aponga accompagne la musique et les fêtes traditionnelles.'),
  (1, 4, 'Respect et entretien', 'On prend soin de son instrument : on le range après usage et on évite de le frapper trop fort.'),
  (2, 1, 'La pulsation', 'La pulsation est le battement régulier qui sert de repère dans la musique.'),
  (2, 2, 'Le tempo', 'Le tempo indique la vitesse de la musique : lent, moyen ou rapide.'),
  (2, 3, 'Compter les temps', 'Une mesure peut compter 2, 3 ou 4 temps. On compte à voix haute pour s''entraîner.'),
  (2, 4, 'Exercices', 'Frappez dans vos mains en suivant une pulsation régulière.'),
  (3, 1, 'Posture', 'Le corps et les mains restent détendus. Le dos est droit et les bras sont libres.'),
  (3, 2, 'Les sons de base', 'Le son grave se joue au centre de la peau. Le son clair se joue sur le bord.'),
  (3, 3, 'Alternance des mains', 'On alterne la main droite et la main gauche pour garder un jeu régulier.'),
  (3, 4, 'Premiers motifs', 'On commence par de petits motifs simples, répétés plusieurs fois.'),
  (4, 1, 'Percussions à peau', 'Les tambours et l''aponga sont des percussions à peau.'),
  (4, 2, 'Percussions à corps sonore', 'Les claves, les cloches et les hochets produisent leur son sans peau tendue.'),
  (4, 3, 'Instruments malgaches', 'L''aponga, le kabosy avec percussion et le hazolahy font partie des instruments malgaches.'),
  (4, 4, 'Écoute', 'Écoutez le son de chaque instrument, puis décrivez-le : grave, aigu, sec ou résonnant.'),
  (5, 1, 'Écouter les autres', 'En groupe, on écoute les autres tout en jouant.'),
  (5, 2, 'La polyrythmie', 'La polyrythmie consiste à garder son rythme pendant qu''un autre joue un rythme différent.'),
  (5, 3, 'Le meneur', 'Le meneur donne le tempo et guide le groupe.'),
  (5, 4, 'Questions-réponses rythmiques', 'Un joueur propose un rythme, et les autres répondent avec un rythme.'),
  (6, 1, 'Un rythme traditionnel', 'On apprend un rythme malgache complet, du début à la fin.'),
  (6, 2, 'L''enchaînement', 'Un morceau comprend une introduction, une partie principale et une fin.'),
  (6, 3, 'Prestation de groupe', 'On prépare une petite présentation à plusieurs, en écoutant et en suivant le tempo.');

-- Questions (3 par unité)
INSERT INTO essai_question (id, id_unite, position, enonce) VALUES
  (1, 1, 1, 'De quelle famille d''instruments fait partie l''aponga ?'),
  (2, 1, 2, 'Avec quoi produit-on le son sur un tambour ?'),
  (3, 1, 3, 'Citez un moment où l''on joue traditionnellement de l''aponga.'),
  (4, 2, 1, 'Qu''est-ce que la pulsation ?'),
  (5, 2, 2, 'Un rythme joué très vite a un tempo :'),
  (6, 2, 3, 'Combien de temps compte-t-on dans une mesure à 4 temps ?'),
  (7, 3, 1, 'Où frappe-t-on pour obtenir un son grave ?'),
  (8, 3, 2, 'Pourquoi alterner les deux mains ?'),
  (9, 3, 3, 'Une bonne posture aide à mieux jouer.'),
  (10, 4, 1, 'Donnez un exemple de percussion à peau.'),
  (11, 4, 2, 'Les claves produisent-elles un son grave ou sec et clair ?'),
  (12, 4, 3, 'L''aponga est-il un instrument malgache ?'),
  (13, 5, 1, 'Qu''est-ce que la polyrythmie ?'),
  (14, 5, 2, 'À quoi sert le meneur dans un groupe ?'),
  (15, 5, 3, 'Pourquoi faut-il écouter les autres en jouant ?'),
  (16, 6, 1, 'Quelles sont les trois grandes parties d''un morceau joué ?'),
  (17, 6, 2, 'Citez un usage traditionnel de l''aponga.'),
  (18, 6, 3, 'Que faut-il faire pour réussir une prestation de groupe ?');
SELECT setval(pg_get_serial_sequence('essai_question', 'id'), (SELECT MAX(id) FROM essai_question));

-- Choix (une seule bonne réponse par question, positions variées)
INSERT INTO essai_choix (id_question, position, texte, est_bonne) VALUES
  (1, 1, 'Les cordes', false), (1, 2, 'Les percussions', true), (1, 3, 'Les vents', false),
  (2, 1, 'En soufflant dedans', false), (2, 2, 'En frappant la peau', true), (2, 3, 'En pinçant les cordes', false),
  (3, 1, 'Pendant un examen écrit', false), (3, 2, 'Pendant une réunion administrative', false), (3, 3, 'Pendant les fêtes, les cérémonies et les danses', true),
  (4, 1, 'Le battement régulier de la musique', true), (4, 2, 'La note la plus aiguë', false), (4, 3, 'Le volume du son', false),
  (5, 1, 'Lent', false), (5, 2, 'Moyen', false), (5, 3, 'Rapide', true),
  (6, 1, '2', false), (6, 2, '4', true), (6, 3, '3', false),
  (7, 1, 'Au centre de la peau', true), (7, 2, 'Sur le bord', false), (7, 3, 'Sur le fût', false),
  (8, 1, 'Pour changer d''instrument', false), (8, 2, 'Pour jouer plus vite et plus régulièrement', true), (8, 3, 'Pour jouer plus fort', false),
  (9, 1, 'Faux', false), (9, 2, 'Vrai', true),
  (10, 1, 'La clave', false), (10, 2, 'Le tambour', true), (10, 3, 'Le hochet', false),
  (11, 1, 'Un son grave', false), (11, 2, 'Un son sec et clair', true), (11, 3, 'Aucun son', false),
  (12, 1, 'Non', false), (12, 2, 'Oui', true),
  (13, 1, 'Un seul rythme très lent', false), (13, 2, 'Plusieurs rythmes joués en même temps', true), (13, 3, 'Une suite de silences', false),
  (14, 1, 'À jouer le plus fort', false), (14, 2, 'À ne rien jouer', false), (14, 3, 'À donner et à maintenir le tempo', true),
  (15, 1, 'Pour rester ensemble et synchronisés', true), (15, 2, 'Pour jouer plus fort', false), (15, 3, 'Pour finir en premier', false),
  (16, 1, 'Couplet, refrain, pont', false), (16, 2, 'Début, milieu, rappel', false), (16, 3, 'Introduction, partie principale, final', true),
  (17, 1, 'Les rythmes de fête malgaches', true), (17, 2, 'Les examens écrits', false), (17, 3, 'Les concours de vitesse', false),
  (18, 1, 'Jouer chacun à son rythme', false), (18, 2, 'Écouter, suivre le tempo et rester ensemble', true), (18, 3, 'Jouer le plus fort possible', false);

COMMIT;