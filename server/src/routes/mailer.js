const router = require('express').Router()
const { mailer } = require('../apis')
const { log } = require('../util')

router.post('/contact', async(req, res) => {

  const { name, email, message } = req.body

  try {
    const info = await mailer.sendMail({
      from: `"${name}" <${email}>`,
      to: process.env.MAIL_USER,
      subject: `🤖 📬 ✉️ ${name} (${email}) sent you a message from your website.`,
      text: message,
      replyTo: email,
    })

    log(`Message sent: ${info.messageId}`, 'FgGreen')
  
    res.status(200).json({
      message: 'Message sent successfully.',
    })
  }

  catch (err) {
    log(err, 'FgRed')
    res.status(500).json(err)
  }
})


router.get('/grid', async (req, res) => {
  try {
    const { data } = await ig.retrieveUserMedia(process.env.IG_ACCESS_TOKEN)
    res.status(200).json(data)
  }
  catch (err) {
    console.log(err)
    res.status(err.status || 500).json(err)
  } 
})

module.exports = router