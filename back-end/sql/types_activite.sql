-- Types d'activité de départ : on pourra en ajouter sans changer la structure
INSERT INTO type_activite (code, libelle) VALUES
  ('cours', 'Cours'),
  ('exercice', 'Exercice'),
  ('lecture', 'Lecture'),
  ('evaluation', 'Evaluation')
ON CONFLICT DO NOTHING;