mail                        mdp
lanja@test.mg               nouveaumotdepasse
fenitrarijaona@gmail.com    123???fefe
a@gmail.com                 a123
apprenant1@gmail.mg         app123...
apprenant2@gmail.mg         app123...2
apprenant3@gmail.mg         app123...3
apprenant4@gmail.mg         app123...4

---------------
sauvegarde des bases postgres:
pg_dump -U postgres -h localhost --no-owner --no-privileges -d aponga -f D:\STUDY\S6\stage-L3\projet-aponga_from_scratch\dump\aponga_backup.sql


New-Item -ItemType Directory -Force -Path "D:\STUDY\S6\stage-L3\projet-aponga\aponga_from_scratch\dump" | Out-Null

& "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe" -U postgres -h localhost --no-owner --no-privileges -d aponga -f "D:\STUDY\S6\stage-L3\projet-aponga\aponga_from_scratch\dump\aponga_backup.sql"

<!-- Étape e : démarrer la base et restaurer ton dump -->
docker compose up -d db
Get-Content D:\STUDY\S6\stage-L3\projet-aponga\aponga_from_scratch\dump\aponga_backup.sql | docker exec -i aponga_from_scratch-db-1 psql -U postgres -d aponga

<!-- acceder a postgres dans le docker -->
docker exec -it aponga_from_scratch-db-1 psql -U postgres -d aponga