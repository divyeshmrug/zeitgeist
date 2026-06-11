// src/lib/ai.js

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const GROQ_FITAI_KEY = import.meta.env.VITE_GROQ_FITAI_KEY || '';

export async function analyzeFoodWithAI(description) {
  if (!GROQ_API_KEY) {
    console.warn("No Groq API Key found. Returning mock data.");
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          meal_name: "Mocked AI Meal",
          category: "Snack",
          calories: Math.floor(Math.random() * 500) + 100,
          protein: Math.floor(Math.random() * 30) + 5,
          carbs: Math.floor(Math.random() * 60) + 10,
          fat: Math.floor(Math.random() * 20) + 2,
          advice: "Good choice! Try adding some salad for extra fiber.",
        });
      }, 1500);
    });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { 
            role: 'system', 
            content: "You are an expert nutritionist. Analyze the food described and return a JSON object with strictly these keys: calories (number), protein (number), carbs (number), fat (number), meal_name (string: short 2-3 word name of the meal), category (string: strictly one of 'Breakfast', 'Lunch', 'Dinner', 'Snack'), advice (string). Do not return any markdown or extra text, just the raw JSON object. Ensure it is perfectly parsable. If the user does not specify a time, guess the category based on the food type." 
          },
          { 
            role: 'user', 
            content: `Analyze this meal: ${description}` 
          }
        ],
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error("Failed to analyze food via Groq:", error);
    throw error;
  }
}

export async function generateAdvancedDailyReport(userProfile, userHistory, todayData) {
  if (!GROQ_API_KEY) {
    console.warn("No Groq API Key found. Returning mock PDF data.");
    return {
      summary: "You had a solid day overall based on mock data.",
      progress_analysis: "You are maintaining consistency. Keep pushing your limits.",
      improvement_suggestions: "Try to drink more water and increase protein intake slightly.",
      transformation_prediction: "If you keep this up, you'll reach your goal in roughly 45 days.",
      motivation: "Every drop of sweat brings you closer to your goal! 🔥",
      tomorrow_plan: "Wake up early, hydrate immediately, and aim for a 30-min walk."
    }
  }

  const systemPrompt = `You are a highly personalized AI Fitness Coach.

Always respond according to the user's profile and historical data. Never assume information not present in the profile.

USER PROFILE:
- Age: ${userProfile.age || 'N/A'}
- Gender: ${userProfile.gender || 'N/A'}
- Height: ${userProfile.height_cm || 'N/A'} cm
- Current Weight: ${userProfile.current_weight_kg || 'N/A'} kg
- Goal Weight: ${userProfile.goal_weight_kg || 'N/A'} kg
- Goal Type: ${userProfile.goal_type || 'N/A'}
- Diet Preference: ${userProfile.diet_preference || 'N/A'}
- Allergies: ${userProfile.allergies || 'None'}
- Medical Restrictions: ${userProfile.medical_restrictions || 'None'}
- Activity Level: ${userProfile.activity_level || 'N/A'}

USER HISTORY:
- Average Calories Intake: ${userHistory.avg_calories_intake || 0} kcal
- Average Calories Burned: ${userHistory.avg_calories_burned || 0} kcal
- Average Water Intake: ${userHistory.avg_water_ml || 0} ml
- Days Logged: ${userHistory.days_logged || 0}
- Current Streak: ${userProfile.current_streak || 0} days

RULES:
1. Never recommend non-vegetarian food to vegetarian or vegan users.
2. Never recommend food that conflicts with allergies or restrictions.
3. Give advice based on the user's goal only.
4. Compare today's data with historical data.
5. Detect improvements and declines.
6. Give realistic and actionable recommendations.
7. Mention calorie deficit or surplus when relevant.
8. Predict progress if the current trend continues.
9. Use a supportive and motivating tone.
10. Remember that each user is independent and recommendations must be personalized.
11. Return strictly a JSON object with the following keys:
    - "summary" (Daily Summary)
    - "progress_analysis" (Progress Analysis)
    - "improvement_suggestions" (Improvement Suggestions)
    - "transformation_prediction" (Transformation Prediction)
    - "motivation" (Motivation Message)
    - "tomorrow_plan" (Tomorrow's Action Plan)`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `TODAY'S DATA:\n${JSON.stringify(todayData, null, 2)}` }
        ],
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error("Failed to generate report via Groq:", error);
    throw error;
  }
}

export async function estimateCaloriesWithAI({ userProfile, workoutData, formulaCalories }) {
  if (!GROQ_API_KEY) {
    console.warn("No Groq API Key found. Returning mock AI calorie data.");
    return {
      final_calories: formulaCalories,
      confidence: 80,
      estimated_range: { min: Math.round(formulaCalories * 0.9), max: Math.round(formulaCalories * 1.1) },
      method: "ACSM + Distance + RPE + Calibration",
      reasoning: ["Mock reasoning: AI key not configured."],
    };
  }

  const systemPrompt = `You are FitAI Elite v2, an advanced exercise physiology and calorie estimation engine.

MISSION
Provide the most realistic calorie estimate possible.
Never rely on a single formula.
Always combine multiple evidence-based methods and explain confidence.

STEP 1: VALIDATE INPUTS
If speed missing: Speed = Distance ÷ (Duration ÷ 60)
If distance missing and speed exists: Distance = Speed × (Duration ÷ 60)

STEP 2: DISTANCE METHOD
Walking Flat: Calories = 0.75 × Weight × Distance
Incline Walking (>10%): Calories = 0.90 × Weight × Distance
Steep Incline Walking (>15%): Calories = 1.00 × Weight × Distance
Running: Calories = 1.00 × Weight × Distance

STEP 3: ACSM METHOD
If speed and incline exist:
meters_per_min = Speed × 1000 ÷ 60
grade = Incline ÷ 100
VO2 = (0.1 × meters_per_min) + (1.8 × meters_per_min × grade) + 3.5
MET = VO2 ÷ 3.5
ACSM_Calories = MET × Weight × (Duration ÷ 60)

STEP 4: FITNESS ADJUSTMENT
Beginner = 1.00
Intermediate = 0.98
Advanced = 0.95
Athlete = 0.93
Adjusted_Calories = ACSM_Calories × Fitness_Multiplier

STEP 5: COMBINE METHODS
If Incline >= 15%: Combined = (0.90 × Adjusted_Calories) + (0.10 × Distance_Method)
If Incline 10-15%: Combined = (0.80 × Adjusted_Calories) + (0.20 × Distance_Method)
If Incline < 10%: Combined = (0.60 × Adjusted_Calories) + (0.40 × Distance_Method)

STEP 6: RPE ADJUSTMENT
RPE 1-3: Multiplier = 0.90
RPE 4-5: Multiplier = 1.00
RPE 6-7: Multiplier = 1.05
RPE 8: Multiplier = 1.10
RPE 9: Multiplier = 1.15
RPE 10: Multiplier = 1.20
Combined = Combined × RPE_Multiplier

STEP 7: PERSONAL CALIBRATION
Default: Calibration_Factor = 1.00
Final_Calories = Combined × Calibration_Factor

STEP 8: CONFIDENCE
Weight Known = +20
Distance Known = +15
Duration Known = +15
Speed Known = +15
Incline Known = +15
Fitness Level Known = +10
RPE Known = +10
Maximum = 100

STEP 9: ESTIMATED RANGE
Range_Min = Final_Calories × 0.90
Range_Max = Final_Calories × 1.10

STEP 10: AI REASONING
Explain: Why calories are high or low, Effect of incline, Effect of pace, Effect of body weight, Effect of workout intensity.
Never claim exact accuracy. Never claim medical precision.

OUTPUT JSON (strict format):
{
  "final_calories": number,
  "estimated_range": {
    "min": number,
    "max": number
  },
  "confidence": number,
  "method": "ACSM + Distance + RPE + Calibration",
  "reasoning": [
    "reason 1",
    "reason 2",
    "reason 3"
  ]
}`;

  const userContent = `INPUT
Weight_kg: ${userProfile.current_weight_kg || userProfile.weight || 'N/A'}
Height_cm: ${userProfile.height_cm || 'N/A'}
Age: ${userProfile.age || 'N/A'}
Gender: ${userProfile.gender || 'N/A'}
Activity_Type: ${workoutData.type || 'N/A'}
Duration_min: ${workoutData.duration || 'N/A'}
Distance_km: ${workoutData.distance || 'N/A'}
Speed_kmh: ${workoutData.speed || 'N/A'}
Incline_percent: ${workoutData.incline || '0'}
Fitness_Level: ${userProfile.fitness_level || 'Intermediate'}
RPE: ${workoutData.rpe || '5'}
User_Calibration_Factor: 1.00`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error("Failed to estimate calories via Groq:", error);
    return {
      final_calories: formulaCalories,
      confidence: 50,
      estimated_range: { min: Math.round(formulaCalories * 0.9), max: Math.round(formulaCalories * 1.1) },
      method: "ACSM + Distance + RPE + Calibration",
      reasoning: ["AI estimation failed. Falling back to formula."],
    };
  }
}

export async function generateEmailInsights(userProfile, dailyLogs) {
  if (!GROQ_API_KEY) {
    return {
      quote: "The only bad workout is the one that didn't happen.",
      analysis: "You had a great day today based on the logs! Consistency is key.",
      tip: "Drink a glass of water first thing in the morning."
    };
  }

  const systemPrompt = `You are FitAI Pro, creating insights for a user's daily email report.
Based on their stats, generate:
1. A short, powerful fitness quote (author unknown or famous).
2. A 2-sentence analysis of their today's activities. If they didn't do much, encourage them for tomorrow. If they did a lot, praise them.
3. A single, highly actionable Pro Tip for tomorrow.

Return strictly a JSON object:
{
  "quote": "string",
  "analysis": "string",
  "tip": "string"
}`;

  const userContent = `User Goal: ${userProfile.goal_type}
Calories Burned: ${dailyLogs?.total_calories_burned || 0}
Calories Intake: ${dailyLogs?.total_calories_intake || 0}
Workouts Today: ${dailyLogs?.activities?.map(a => a.name).join(', ') || 'None'}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error("Failed to generate email insights:", error);
    return {
      quote: "Every day is a fresh start.",
      analysis: "We couldn't generate personalized insights right now, but keep pushing forward!",
      tip: "Stay hydrated."
    };
  }
}

export async function analyzeWaterWithAI(userProfile, waterLogs, targetMl) {
  if (!GROQ_API_KEY) {
    console.warn("No Groq API Key found. Returning mock HydroAI data.");
    return {
      hydration_score: 85,
      total_water_ml: 1500,
      target_water_ml: targetMl || 2000,
      target_completion_percent: 75,
      largest_single_intake_ml: 500,
      longest_gap_minutes: 180,
      morning_hydration_rating: "good",
      workout_hydration_rating: "good",
      sleep_hydration_rating: "good",
      distribution_rating: "good",
      risk_flags: [],
      smart_suggestions: ["Drink more water evenly across the day."],
      ai_reasoning: ["You are on track to meet your hydration goal."]
    };
  }

  const systemPrompt = `You are HydroAI Pro, an intelligent hydration analysis engine.

Your job is to analyze a user's water intake patterns and provide personalized hydration recommendations.

YOUR TASK
Analyze:
1. Total water consumed.
2. Percentage of daily target achieved.
3. Distribution quality throughout the day.
4. Largest single drinking event.
5. Longest hydration gap.
6. Hydration around workouts.
7. Hydration before sleep.
8. Morning hydration quality.
9. Risk of over-drinking in short periods.
10. Risk of under-hydration.
11. Consistency score.
12. Hydration score (0-100).

ANALYSIS RULES
Morning Hydration: Good if 250-750ml consumed within 60 minutes of waking.
Single Drinking Event: Excellent: 250-600ml. Acceptable: 600-1000ml. Warning: >1000ml within 15 minutes.
Hydration Gaps: Excellent: <2 hours. Acceptable: 2-4 hours. Poor: >4 hours.
Workout Hydration: Before: 250-500ml. During: 150-300ml every 15-20 min. After: 500-1000ml.
Sleep Hydration: Good: 250-500ml within 2 hours before sleep. Avoid: >1000ml immediately before sleep.
Hydration Distribution Score: Evaluate whether water was spread evenly across the day.

PERSONALIZED AI REASONING
Explain:
- Why hydration score was assigned.
- Which habits are helping.
- Which habits should improve.
- Whether intake supports: Weight Loss, Muscle Gain, General Health

SMART SUGGESTIONS
Generate personalized recommendations (e.g., "Your largest water intake was 1.4L in one sitting. Spreading intake more evenly may improve comfort...").

RULES
Never provide medical advice.
Never claim perfect accuracy.
Use evidence-based hydration guidance.
Personalize recommendations using weight, goals, activity level, workout duration, climate, and hydration history.
If data is missing, reduce confidence and explain why.

OUTPUT JSON:
{
  "hydration_score": 85,
  "total_water_ml": 2000,
  "target_water_ml": 2500,
  "target_completion_percent": 80,
  "largest_single_intake_ml": 500,
  "longest_gap_minutes": 180,
  "morning_hydration_rating": "good",
  "workout_hydration_rating": "good",
  "sleep_hydration_rating": "good",
  "distribution_rating": "good",
  "risk_flags": [],
  "smart_suggestions": [],
  "ai_reasoning": ["reason 1", "reason 2"]
}`;

  const userContent = `USER PROFILE
User ID: ${userProfile.id || 'N/A'}
Age: ${userProfile.age || 'N/A'}
Gender: ${userProfile.gender || 'N/A'}
Height_cm: ${userProfile.height_cm || 'N/A'}
Weight_kg: ${userProfile.current_weight_kg || userProfile.weight || 'N/A'}
Goal Type: ${userProfile.goal_type || 'N/A'}
Fitness Level: ${userProfile.fitness_level || 'N/A'}
Daily Activity Level: ${userProfile.activity_level || 'N/A'}
Workout Duration Minutes: ${userProfile.daily_workout_minutes || 'N/A'}
Climate: ${userProfile.climate || 'N/A'}
Sleep Time: ${userProfile.sleep_last_sleep_time || 'N/A'}
Wake Time: ${userProfile.sleep_last_wake_time || 'N/A'}

DAILY WATER TARGET
Recommended Water Target: ${targetMl / 1000}L

WATER LOGS
${JSON.stringify(waterLogs.map(log => ({ time: log.time || new Date(log.logged_at).toLocaleTimeString('en-US', {hour12: false, hour: '2-digit', minute:'2-digit'}), amount_ml: log.amount_ml })), null, 2)}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error("Failed to analyze water via Groq:", error);
    throw error;
  }
}

export async function analyzeSleepWithAI(userProfile, sleepData) {
  if (!GROQ_API_KEY) {
    return {
      sleep_quality: "good",
      ai_message: "Your sleep looks decent, but keep aiming for 7-9 hours!",
      confidence_bonus: 1
    };
  }

  const systemPrompt = `You are SleepAI Pro. Analyze the user's sleep duration, timing, and consistency.
Return strictly a JSON object:
{
  "sleep_quality": "poor|good|excellent",
  "ai_message": "A short, motivating assessment of their sleep.",
  "confidence_bonus": 0
}`;

  const userContent = `User Age: ${userProfile.age || 'N/A'}
Slept At: ${sleepData.sleep_time}
Woke Up At: ${sleepData.wake_time}
Duration: ${sleepData.duration_hours} hours
Target: Sleep before 11:15 PM, 7-9 hours duration.`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        response_format: { type: "json_object" }
      })
    });
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error("Failed to analyze sleep via Groq:", error);
    return { sleep_quality: "good", ai_message: "Keep up the good sleep habits!", confidence_bonus: 1 };
  }
}

export async function askFitAIAssistant(conversationHistory, userProfile) {
  if (!GROQ_FITAI_KEY) {
    console.warn("No Groq FitAI Key found. Returning mock response.");
    return {
      summary: "I am not connected to the AI yet.",
      confidence: "0%",
      reasoning: "Missing VITE_GROQ_FITAI_KEY in Vercel settings.",
      recommendation: "Please add the key.",
      nextAction: "Add VITE_GROQ_FITAI_KEY to Vercel and redeploy."
    };
  }

  const systemPrompt = `You are FitAI Elite, an advanced, highly knowledgeable, and motivational personal trainer and health assistant.
You provide very concise, structured, and actionable advice.
Always consider the user's profile if available: Age ${userProfile?.age || 'N/A'}, Goal: ${userProfile?.goal_type || 'N/A'}, Diet: ${userProfile?.diet_preference || 'N/A'}.

You must ALWAYS return your response as a valid JSON object matching exactly this structure:
{
  "summary": "A 1-sentence high-level answer.",
  "reasoning": "A 1-2 sentence explanation of why you suggest this.",
  "confidence": "A percentage like '95%' indicating how sure you are.",
  "recommendation": "A 1-sentence actionable recommendation.",
  "nextAction": "The immediate next step the user should take right now."
}
Do not include markdown blocks, just the raw JSON object.`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_FITAI_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory
        ],
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error("Failed to fetch FitAI response via Groq:", error);
    throw error;
  }
}
