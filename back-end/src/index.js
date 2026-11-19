import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import authRouter from './routes/auth.js'
import rolesRouter from './routes/roles.js'
import utilisateursRouter from './routes/utilisateurs.js'
import etudesRouter from './routes/etudes.js'
import activitesRouter from './routes/activites.js'
import compositionsRouter from './routes/compositions.js'
import ressourcesRouter from './routes/ressources.js'
import niveauxRouter from './routes/niveaux.js'
import apprenantsRouter from './routes/apprenants.js'
import seancesRouter from './routes/seances.js'
import contenusRouter from './routes/contenus.js'
import enseignantsRouter from './routes/enseignants.js'
import inscriptionsRouter from './routes/inscriptions.js'
import mesInscriptionsRouter from './routes/mesInscriptions.js'
import presencesRouter from './routes/presences.js'
import mesContenusRouter from './routes/mesContenus.js'
import reglesTelechargementRouter from './routes/reglesTelechargement.js'

const app = express()

// app.use(cors({ origin: 'http://localhost:5173' }))
app.use(cors({ origin: process.env.FRONT_URL, credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.get('/api/health', (req, res) => {
  res.json({ statut: 'ok' })
})

app.use('/api/auth', authRouter)
app.use('/api/roles', rolesRouter)
app.use('/api/utilisateurs', utilisateursRouter)
app.use('/api/etudes', etudesRouter)
app.use('/api/activites', activitesRouter)
app.use('/api/etudes', compositionsRouter)
app.use('/api/activites', ressourcesRouter)
app.use('/api/niveaux', niveauxRouter)
app.use('/api/apprenants', apprenantsRouter)
app.use('/api/seances', seancesRouter)
app.use('/api/contenus', contenusRouter)
app.use('/api/enseignants', enseignantsRouter)
app.use('/api/seances', inscriptionsRouter)
app.use('/api/mes-inscriptions', mesInscriptionsRouter)
app.use('/api/presences', presencesRouter)
app.use('/api/mes-contenus', mesContenusRouter)
app.use('/api/regles-telechargement', reglesTelechargementRouter)

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Back-end démarré sur http://localhost:${port}`)
})