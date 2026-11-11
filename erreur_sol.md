Node.js v22.23.3
aponga_from_scratch-back-1  | [nodemon] app crashed - waiting for file changes before starting...

Pourquoi nodemon affiche « app crashed
--- 

explication: nodemon ne fait que lancer node src/index.js et surveiller tes fichiers. Le crash vient de Node.js :

fonctionnement:
Le crash revient souvent parce que n’importe quelle erreur au démarrage produit ce cycle :
une erreur de syntaxe (comme ici) ;

solution:
regarder ou dans le console indique erreur
relancer:
> docker compose restart back

>> conseil: teneno any an-tsaina ilay zavatra ataon ndri : ohatra :
sady m-copier -colle no moiteny hoe : 
verification role
assignation role.

rehefa manao npm install d tratran'ito:
nodemon affiche « app crashed
>solution:
Installe le paquet dans le conteneur : et non dans la machine
docker exec aponga_from_scratch-back-1 npm install multer

si le conteneur s'arrete :
docker start aponga_from_scratch-back-1
docker exec aponga_from_scratch-back-1 npm install multer
docker restart aponga_from_scratch-back-1