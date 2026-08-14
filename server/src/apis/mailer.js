import nodemailer from 'nodemailer'
import { config } from '../config.js'
import { ApiError } from '../util.js'

let transport

function transporter() {
  if (!config.mail.configured) throw new ApiError('Mail is not configured', 503)
  transport ??= nodemailer.createTransport({
    host: config.mail.host,
    port: config.mail.port,
    secure: config.mail.port === 465,
    auth: { user: config.mail.user, pass: config.mail.pass },
  })
  return transport
}

export async function sendAdminSignInCode({ email, code }) {
  return transporter().sendMail({
    from: { name: 'alex.wohlbruck.com', address: config.mail.user },
    to: email,
    // The code is in the subject so it can be read from a notification without
    // opening anything.
    subject: `${code} is your guestbook moderation code`,
    text: [
      `Your code is ${code}. It expires in 10 minutes.`,
      '',
      'If you did not just try to sign in to the guestbook, ignore this. The',
      'code is useless on its own, and nobody else was told it exists.',
    ].join('\n'),
  })
}

export async function sendContactMessage({ name, email, message }) {
  return transporter().sendMail({
    // The envelope sender stays on our own domain. Sending as the visitor's
    // address is what gets a domain marked as a spoofer by SPF and DMARC.
    from: { name, address: config.mail.user },
    to: config.mail.to,
    replyTo: { name, address: email },
    subject: `🤖 📬 ✉️ ${name} (${email}) sent you a message from your website.`,
    text: message,
  })
}
