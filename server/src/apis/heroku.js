const HerokuApi = require('heroku-client')

const heroku = new HerokuApi({
  token: process.env.HEROKU_API_TOKEN
})

module.exports = heroku