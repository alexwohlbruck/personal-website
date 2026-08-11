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
      message: `Message sent successfully.`,
    })
  }

  catch (err) {
    log(err, 'FgRed')
    res.status(500).json({
      message: err.message || 'Something went wrong.',
      ...err
    })
  }
})


module.exports = router