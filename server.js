import express from 'express'
import cors from 'cors'
import { Resend } from 'resend'
import dotenv from 'dotenv'

// Load environment variables from .env
dotenv.config()

const app = express()
const port = 3001

// Middleware
app.use(cors())
app.use(express.json())

// Initialize Resend
const resend = new Resend(process.env.VITE_RESEND_API_KEY)

app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, html } = req.body

    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Missing required fields (to, subject, html)' })
    }

    if (!process.env.VITE_RESEND_API_KEY) {
      return res.status(500).json({ error: 'Server misconfiguration: Missing Resend API Key' })
    }

    const data = await resend.emails.send({
      from: 'FitAI Pro <onboarding@resend.dev>',
      to: [to],
      subject: subject,
      html: html,
    })

    console.log('✅ Email sent successfully:', data)
    res.status(200).json(data)
  } catch (error) {
    console.error('❌ Error sending email:', error)
    res.status(500).json({ error: error.message })
  }
})

app.listen(port, () => {
  console.log(`🚀 FitAI Pro Email Backend running at http://localhost:${port}`)
})
