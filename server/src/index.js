import cors from 'cors'
import express from 'express'
import { startTokenRenewal } from './apis/instagram.js'
import { config } from './config.js'
import routes from './routes/index.js'
import { log } from './util.js'

const app = express()

app.disable('x-powered-by')
app.use(
  cors({
    origin: config.origins.length ? config.origins : true,
  }),
)
app.use(express.json({ limit: '32kb' }))
app.use(express.urlencoded({ extended: true, limit: '32kb' }))
app.use('/', routes)

/**
 * One place where failure becomes a status code.
 *
 * Express 5 forwards a rejected promise from an async handler here instead of
 * leaving it as an unhandled rejection, which under Express 4 was enough to
 * take the process down and with it the three integrations that had nothing to
 * do with whichever one actually broke.
 */
// eslint-disable-next-line no-unused-vars -- Express needs all four to see this as an error handler.
app.use((err, req, res, next) => {
  const status = err.status ?? 500
  // 503 is a missing credential, which /health already reports and the boot
  // banner already listed. Logging it on every request only buries the faults
  // that are actually worth reading.
  if (status >= 500 && status !== 503) log(`${req.method} ${req.path}: ${err.message}`, 'FgRed')
  res.status(status).json({ message: err.message || 'Something went wrong.' })
})

app.listen(config.port, () => {
  log(`Server started on port ${config.port}!`, 'FgGreen')

  const configured = Object.entries({
    spotify: config.spotify.configured,
    instagram: config.instagram.configured,
    calendar: config.calendar.configured,
    mailer: config.mail.configured,
  })

  for (const [name, ready] of configured) {
    log(`  ${ready ? '✓' : '·'} ${name}`, ready ? 'FgGreen' : 'FgGray')
  }

  startTokenRenewal()
})
