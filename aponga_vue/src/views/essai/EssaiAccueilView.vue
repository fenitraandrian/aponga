<template>
  <main class="essai-accueil">
    <h1>APONGA</h1>
    <p class="accroche">Apprenez à jouer de l'aponga, le tambour malgache.</p>
    <p>
      Essayez gratuitement, sans compte. Vous choisissez votre niveau, lisez une partie
      du cours, puis répondez à un court quiz.
    </p>

    <RouterLink to="/essai/niveau" class="bouton bouton-principal">
      Commencer l'essai gratuit
    </RouterLink>

    <div class="comptes">
      <RouterLink to="/connexion" class="bouton bouton-secondaire">Se connecter</RouterLink>
      <RouterLink to="/inscription" class="bouton bouton-secondaire">S'inscrire</RouterLink>
    </div>
  </main>
</template>

<style scoped>
.essai-accueil {
  max-width: 36rem;
  margin: 0 auto;
  padding: 2.5rem 1rem;
  text-align: center;
}
.accroche {
  font-size: 1.15rem;
}
.bouton {
  display: inline-block;
  margin-top: 1.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  text-decoration: none;
}
.bouton-principal {
  background: #0066cc;
  color: #fff;
}
.comptes {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #ddd;
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}
.bouton-secondaire {
  margin-top: 0;
  border: 1px solid #0066cc;
  color: #0066cc;
}
</style>
