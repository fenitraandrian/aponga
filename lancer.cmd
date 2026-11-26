cd D:\STUDY\S6\stage-L3\projet-aponga\aponga_from_scratch\aponga_vue>npm run dev 

cd D:\STUDY\S6\stage-L3\projet-aponga\aponga_from_scratch\back-end>npm run dev

@REM  Si tu utilises Docker pour le front, lance 
docker compose up dev

docker compose down
@REM  (une nouvelle dépendance demande toujours --build) :
docker compose up --build

@REM  rehefa manova front
docker compose restart dev

@REM  rehefa manova back ()
docker compose restart back 

@REM  pour acceder a la base sur docker
docker exec -it aponga_from_scratch-db-1 psql -U postgres -d aponga  

@REM  pour demarrer un conteneur non-demarre:
docker compose up -d <nom_conteneur>

@REM  pour executer une requette dans docker >>powershell
Get-Content back-end\sql\migrations\021_abonnements.sql | docker compose exec -T db psql -U postgres -d aponga

