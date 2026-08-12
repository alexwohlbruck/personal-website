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
