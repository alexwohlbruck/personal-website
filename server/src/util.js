const { parse, stringify } = require('envfile')
const fs = require('fs')
const { heroku } = require('./apis/index')

const Colors = {
  'Reset': "\x1b[0m",
  'Bright': "\x1b[1m",
  'Dim': "\x1b[2m",
  'Underscore': "\x1b[4m",
  'Blink': "\x1b[5m",
  'Reverse': "\x1b[7m",
  'Hidden': "\x1b[8m",

  'FgBlack': "\x1b[30m",
  'FgRed': "\x1b[31m",
  'FgGreen': "\x1b[32m",
  'FgYellow': "\x1b[33m",
  'FgBlue': "\x1b[34m",
  'FgMagenta': "\x1b[35m",
  'FgCyan': "\x1b[36m",
  'FgWhite': "\x1b[37m",

  'BgBlack': "\x1b[40m",
  'BgRed': "\x1b[41m",
  'BgGreen': "\x1b[42m",
  'BgYellow': "\x1b[43m",
  'BgBlue': "\x1b[44m",
  'BgMagenta': "\x1b[45m",
  'BgCyan': "\x1b[46m",
  'BgWhite': "\x1b[47m",
}

module.exports = {

  Colors,

  // Log to console with nice colors :)
  log: function (text, color = Colors.FgCyan) {
    console.log(color, text)
  },

  // setTimeout modified to allow for larger intervals
  // https://catonmat.net/settimeout-setinterval
  setTimeout_: function (fn, delay) {
    var maxDelay = Math.pow(2, 31) - 1;

    if (delay > maxDelay) {
      var args = arguments;
      args[1] -= maxDelay;

      return setTimeout(function () {
        setTimeout_.apply(undefined, args);
      }, maxDelay);
    }

    return setTimeout.apply(undefined, arguments);
  },

  // Set the environment variable config locally and in Heroku app config
  updateEnvironment: function (key, value) {
    // Update local environment file
    const envPath = '.env'
    if (fs.existsSync(envPath)) {
      const env = fs.readFileSync(envPath, 'utf8')
      let parsedFile = parse(env)
      parsedFile[key] = value
      fs.writeFileSync(`./${envPath}`, stringify(parsedFile))
    }

    // Update heroku config vars
    heroku.patch(`/apps/${process.env.HEROKU_APP_NAME}/config-vars`, {
      body: {
        [key]: value
      }
    })
  },
}