import { generateEmailInsights } from './ai'
import { generateEmailHTML } from './emailTemplate'

export async function sendDailyReportEmail(user, userProfile, dailyLogs) {
  try {
    // 1. Get AI Insights
    const aiInsights = await generateEmailInsights(userProfile, dailyLogs)

    // 2. Generate Beautiful HTML Email
    const htmlContent = generateEmailHTML({ userProfile, dailyLogs, aiInsights })

    // 3. Post to local backend
    const response = await fetch('http://localhost:3001/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // ⚠️ TEMPORARY: Hardcoded to your Resend account email because your domain DNS is still pending.
        // Once hello.zeitgeist.com is verified, change this back to `to: user.email`
        to: 'canvadwala@gmail.com',
        subject: `Your FitAI Pro Daily Report ⚡️`,
        html: htmlContent
      })
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error || 'Failed to send email')
    }

    return true
  } catch (error) {
    console.error('Error sending daily report:', error)
    throw error
  }
}
