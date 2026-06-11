import { jsPDF } from 'jspdf'

export const generateDailyPDF = async (userData, stats, aiData) => {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  
  // PAGE 1: Intro
  doc.setFillColor(10, 10, 10)
  doc.rect(0, 0, pageWidth, 300, 'F')
  doc.setTextColor(118, 185, 0)
  doc.setFontSize(24)
  doc.text("DAILY TRANSFORMATION REPORT", pageWidth / 2, 40, { align: 'center' })
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.text(`Warrior: ${userData.name || 'User'}`, pageWidth / 2, 60, { align: 'center' })
  doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, 70, { align: 'center' })
  
  // PAGE 2: Stats
  doc.addPage()
  doc.setFillColor(20, 20, 20)
  doc.rect(0, 0, pageWidth, 300, 'F')
  doc.setTextColor(118, 185, 0)
  doc.setFontSize(20)
  doc.text("TODAY'S SUMMARY", 20, 30)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.text(`Calories Intake: ${stats.intake || 0} kcal`, 20, 50)
  doc.text(`Calories Burned: ${stats.burned || 0} kcal`, 20, 60)
  doc.text(`Calorie Deficit/Surplus: ${stats.goal - (stats.intake || 0) + (stats.burned || 0)} kcal`, 20, 70)
  doc.text(`Past Weight: ${stats.pastWeight || 0} kg`, 20, 90)
  doc.text(`Current Weight: ${stats.currentWeight || 0} kg`, 20, 100)
  doc.text(`Difference: ${((stats.currentWeight || 0) - (stats.pastWeight || 0)).toFixed(1)} kg`, 20, 110)

  // Helper for adding AI sections without overflowing
  const addSection = (title, content, currentY) => {
    if (!content) return currentY
    doc.setTextColor(118, 185, 0)
    doc.setFontSize(14)
    doc.text(title, 20, currentY)
    currentY += 7
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    const splitText = doc.splitTextToSize(content, pageWidth - 40)
    doc.text(splitText, 20, currentY)
    currentY += (splitText.length * 6) + 10
    return currentY
  }

  // PAGE 3: AI Advice & Analysis
  doc.addPage()
  doc.setFillColor(20, 20, 20)
  doc.rect(0, 0, pageWidth, 300, 'F')
  doc.setTextColor(118, 185, 0)
  doc.setFontSize(20)
  doc.text("AI ANALYSIS & ADVICE", 20, 30)
  
  let yPos = 50
  if (aiData) {
    yPos = addSection("Summary", aiData.summary, yPos)
    yPos = addSection("Progress Analysis", aiData.progress_analysis, yPos)
    yPos = addSection("Needs Improvement", aiData.improvement_suggestions, yPos)
  }

  // PAGE 4: Highlight & Journey
  doc.addPage()
  doc.setFillColor(10, 10, 10)
  doc.rect(0, 0, pageWidth, 300, 'F')
  doc.setTextColor(118, 185, 0)
  doc.setFontSize(20)
  doc.text("JOURNEY & MOTIVATION", 20, 30)
  
  yPos = 50
  if (aiData) {
    yPos = addSection("Tomorrow's Plan", aiData.tomorrow_plan, yPos)
    yPos = addSection("Transformation Prediction", aiData.transformation_prediction, yPos)
    yPos = addSection("Motivation", aiData.motivation, yPos)
  }

  // Save the PDF
  doc.save(`Fitness_Report_${new Date().toISOString().split('T')[0]}.pdf`)
}
