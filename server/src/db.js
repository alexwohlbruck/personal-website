const mongoose = require('mongoose')
mongoose.Promise = global.Promise

const user = process.env.DB_USER
const password = process.env.DB_PASSWORD
const host = process.env.DB_HOST
const dbUrl = process.env.environment === 'production'
  ? `mongodb+srv://${user}:${password}@${host}/?retryWrites=true&w=majority`
  : `mongodb://${host}/`

const { log } = require('./util')

async function connect() {
  try {
    await mongoose.connect(dbUrl, {
      retryWrites: true,
      w: 'majority',
    })
    log('Database connected', 'FgGreen')
  } catch (error) {
    console.error(error)
    process.exit()
  }
}


module.exports = {
  connect
}