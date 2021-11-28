require('dotenv').config()
const express = require("express")
const app = express()
const cors = require('cors')
const http = require('http')
const server = http.createServer(app)
const { Server } = require("socket.io")
const io = new Server(server, {
  cors: {
    origin: '*',
  }
})
const { log } = require('./util')

const port = process.env.PORT || 3000

app.set('socketio', io)
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({
  extended: true
}))
app.use('/', require('./routes')) // Import API routes

async function initApp() {
  server.listen(port, () => {
    log(`Server started on port ${port}!`, 'FgGreen');
  })
}

initApp()