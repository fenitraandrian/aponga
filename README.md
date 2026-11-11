# APONGA

Plateforme de gestion pédagogique pour une école de percussion à Madagascar : niveaux, unités, séances, apprenants, enseignants, inscriptions, contenus et suivi de présence.

## Prérequis

- **Docker Desktop**. Sous Windows, activer WSL 2 pendant l'installation.
- **Git**.
- Un éditeur de code (VS Code recommandé).

Aucune installation de Node.js ou de PostgreSQL n'est nécessaire : tout fonctionne dans Docker.

Facultatif, pour l'autocomplétion dans l'éditeur : `npm install` dans `back-end/` et dans `aponga_vue/`.

## Installation

1. Cloner le dépôt :

   ```bash
   git clone <url-du-depot>
   cd aponga_from_scratch
   ```

2. Créer le fichier de configuration à partir du modèle :

   ```powershell
   copy .env.example .env
   ```

   Ouvre `.env` et choisis un mot de passe pour `POSTGRES_PASSWORD`.

3. Lancer le projet :

   ```bash
   docker compose up --build
   ```

   Au premier lancement, la base est créée et remplie avec la structure et les rôles. Le téléchargement des images peut prendre plusieurs minutes.

## Adresses

| Service | Adresse |
|---|---|
| Interface | http://localhost:5173 |
| API | http://localhost:3000 |
| PostgreSQL | `localhost`, port `5433` |

## Premier compte administrateur

1. Ouvre l'interface et inscris-toi avec ton adresse e-mail.
2. Donne-toi le rôle administrateur. Dans un terminal :

   ```bash
   docker exec -it aponga_from_scratch-db-1 psql -U postgres -d aponga
   ```

   Puis dans psql (remplace l'e-mail et le code du rôle) :

   ```sql
   INSERT INTO membre_role (id_membre, id_role)
   SELECT m.id, r.id
     FROM membre m
     JOIN utilisateur u ON u.id = m.id_utilisateur, role r
    WHERE u.email = 'ton@email.com' AND r.code = 'CODE_ADMIN'
   ON CONFLICT DO NOTHING;
   ```

   Pour connaître le code du rôle administrateur : `SELECT code FROM role;`.

3. Déconnecte-toi et reconnecte-toi.

## Base de données

- La structure et les rôles sont créés automatiquement au premier lancement (`db/init/`).
- Ouvrir la base en ligne de commande :

  ```bash
  docker exec -it aponga_from_scratch-db-1 psql -U postgres -d aponga
  ```

- Ouvrir la base avec une interface graphique (pgAdmin, DBeaver) : hôte `localhost`, port `5433`, base `aponga`, utilisateur `postgres`, mot de passe du `.env`.
- Repartir d'une base vide :

  ```bash
  docker compose down -v
  docker compose up --build
  ```

  Cette commande supprime toutes les données.

## Commandes utiles

```bash
docker compose up -d          # lancer en arrière-plan
docker compose down           # arrêter
docker compose logs -f back   # suivre les journaux du back-end
docker compose restart back   # redémarrer le back-end
```

## Structure du projet

```
aponga_from_scratch/
├── back-end/          API Express, accès à PostgreSQL avec le paquet pg
│   ├── src/           code source (routes, services, validation)
│   ├── sql/           anciens scripts de migration et de permissions (historique)
│   └── uploads/       fichiers téléversés (non versionnés)
├── aponga_vue/        interface Vue 3 + Vite
├── db/init/           structure et rôles, chargés au premier lancement
├── docker-compose.yml
└── .env.example
```

Les scripts de `back-end/sql/` servent d'historique. Ne les rejoue pas sur une base créée depuis `db/init/`, la structure y est déjà.