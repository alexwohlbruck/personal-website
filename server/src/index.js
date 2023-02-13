require('dotenv').config()
const express = require("express")
const app = express()
const cors = require('cors')
const http = require('http')
const server = http.createServer(app)
const db = require('./db')
const { Server } = require("socket.io")
const io = new Server(server, {
  cors: {
    origin: '*',
  }
})
const passport = require("passport");
const { log, Colors } = require('./util')

const port = process.env.PORT || 3000

require("./passport/config")(passport);

app.set('socketio', io)
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({
  extended: true
}))
app.use('/', require('./routes')) // Import API routes

async function initApp() {
  await db.connect()

  server.listen(port, () => {
    log(`Server started on port ${port}!`, Colors.FgMagenta);
  })
}

initApp()