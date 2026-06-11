export function generateEmailHTML({ userProfile, dailyLogs, aiInsights }) {
  const userName = userProfile?.id ? 'Athlete' : 'Fitness Enthusiast'
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  // Determine a color theme based on activity level
  let themeColor = '#10B981' // Green default
  let headerImage = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1000&auto=format&fit=crop'
  
  if (dailyLogs?.total_calories_burned > 800) {
    themeColor = '#F59E0B' // Orange for high activity
    headerImage = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop'
  } else if (dailyLogs?.total_calories_burned < 200) {
    themeColor = '#3B82F6' // Blue for rest day
    headerImage = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1000&auto=format&fit=crop'
  }

  const workoutsHtml = dailyLogs?.activities?.length > 0 
    ? dailyLogs.activities.map(w => `
      <div style="background: rgba(255,255,255,0.05); padding: 12px; margin-bottom: 10px; border-radius: 8px; border-left: 4px solid ${themeColor};">
        <strong style="color: #ffffff; font-size: 16px;">${w.name}</strong><br/>
        <span style="color: #A1A1AA; font-size: 14px;">🔥 ${w.burned} kcal burned</span>
      </div>
    `).join('')
    : '<p style="color: #A1A1AA;">No workouts logged today yet. Every day is a fresh start!</p>'

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Fitness Report</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #09090b; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #18181b; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
          
          <!-- Header Image -->
          <tr>
            <td>
              <div style="width: 100%; height: 200px; background-image: url('${headerImage}'); background-size: cover; background-position: center; position: relative;">
                <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, #18181b, transparent); height: 100px;"></div>
              </div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 30px;">
              <h1 style="margin: 0 0 10px 0; font-size: 24px; color: ${themeColor};">FitAI Pro Daily Report</h1>
              <p style="margin: 0 0 30px 0; font-size: 14px; color: #A1A1AA;">${dateStr}</p>

              <!-- Quote Block -->
              <div style="background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%); padding: 20px; border-radius: 12px; margin-bottom: 30px; border: 1px solid rgba(255,255,255,0.1);">
                <p style="margin: 0; font-size: 18px; font-style: italic; color: #ffffff; text-align: center;">
                  "${aiInsights?.quote || 'The only bad workout is the one that did not happen.'}"
                </p>
              </div>

              <!-- Stats Grid -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td width="30%" align="center" style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 12px;">
                    <span style="display: block; font-size: 28px; font-weight: bold; color: ${themeColor};">${dailyLogs?.total_calories_burned || 0}</span>
                    <span style="font-size: 12px; color: #A1A1AA; text-transform: uppercase;">kcal Burned</span>
                  </td>
                  <td width="5%"></td>
                  <td width="30%" align="center" style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 12px;">
                    <span style="display: block; font-size: 28px; font-weight: bold; color: #60A5FA;">${dailyLogs?.total_calories_intake || 0}</span>
                    <span style="font-size: 12px; color: #A1A1AA; text-transform: uppercase;">kcal Eaten</span>
                  </td>
                  <td width="5%"></td>
                  <td width="30%" align="center" style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 12px;">
                    <span style="display: block; font-size: 28px; font-weight: bold; color: #38BDF8;">${dailyLogs?.total_water_ml || 0}</span>
                    <span style="font-size: 12px; color: #A1A1AA; text-transform: uppercase;">ml Water</span>
                  </td>
                </tr>
              </table>

              <!-- AI Analysis -->
              <h2 style="font-size: 18px; color: #ffffff; margin-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">🤖 AI Workout Analysis</h2>
              <p style="font-size: 15px; line-height: 1.6; color: #E4E4E7; margin-bottom: 30px;">
                ${aiInsights?.analysis || 'Keep tracking your workouts to get personalized AI insights!'}
              </p>

              <!-- AI Tip -->
              <div style="background-color: ${themeColor}15; border-left: 4px solid ${themeColor}; padding: 15px; border-radius: 0 8px 8px 0; margin-bottom: 30px;">
                <strong style="color: ${themeColor}; font-size: 14px; text-transform: uppercase;">Pro Tip for Tomorrow</strong>
                <p style="margin: 5px 0 0 0; font-size: 15px; color: #E4E4E7;">
                  ${aiInsights?.tip || 'Stay hydrated and aim for 8 hours of sleep.'}
                </p>
              </div>

              <!-- Today's Log -->
              <h2 style="font-size: 18px; color: #ffffff; margin-bottom: 15px;">📋 Today's Activities</h2>
              ${workoutsHtml}

              <!-- Mental Discipline -->
              ${(userProfile?.nfp_streak !== undefined || userProfile?.spr_streak !== undefined) ? `
              <h2 style="font-size: 18px; color: #ffffff; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">🛡️ Mental Discipline</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td width="48%" style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 12px; border-left: 4px solid #8B5CF6;">
                    <span style="display: block; font-size: 14px; color: #A1A1AA; text-transform: uppercase;">Nutrition Plan (NFP)</span>
                    <span style="display: block; font-size: 24px; font-weight: bold; color: #ffffff;">${userProfile?.nfp_streak || 0} <span style="font-size: 14px; font-weight: normal; color: #A1A1AA;">days</span></span>
                    <span style="font-size: 12px; color: ${userProfile?.nfp_confidence < 50 ? '#ef4444' : '#10b981'};">Confidence: ${parseFloat(userProfile?.nfp_confidence || 100).toFixed(1)}%</span>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 12px; border-left: 4px solid #EC4899;">
                    <span style="display: block; font-size: 14px; color: #A1A1AA; text-transform: uppercase;">Personal Routine (SPR)</span>
                    <span style="display: block; font-size: 24px; font-weight: bold; color: #ffffff;">${userProfile?.spr_streak || 0} <span style="font-size: 14px; font-weight: normal; color: #A1A1AA;">days</span></span>
                    <span style="font-size: 12px; color: ${userProfile?.spr_confidence < 50 ? '#ef4444' : '#10b981'};">Confidence: ${parseFloat(userProfile?.spr_confidence || 100).toFixed(1)}%</span>
                  </td>
                </tr>
              </table>
              ` : ''}

            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #09090b; padding: 20px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #71717A;">Generated by FitAI Pro &bull; Zeitgeist Fitness</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}
