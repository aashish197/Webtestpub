import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API health check route
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Student AI Advisor Route
  app.post("/api/student-ai-advisor", async (req, res) => {
    try {
      const { type, classes, exams, profile, timeStats } = req.body;

      // Check if GEMINI_API_KEY is configured
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        try {
          const { GoogleGenAI } = await import("@google/genai");
          const ai = new GoogleGenAI({ apiKey });

          let prompt = "";
          if (type === "free_time_suggestions") {
            prompt = `You are an encouraging, expert academic mentor and routine coach for a student in Nepal (${profile?.grade || "High School / +2"}).
The student's schedule:
- School & Tuition Classes: ${JSON.stringify(classes?.map((c: any) => ({ subject: c.subject, type: c.type, time: `${c.startTime}-${c.endTime}` })) || [])}
- Estimated Daily Study Time: ${timeStats?.totalStudyHours || 5} hours
- Estimated Daily Rest/Sleep: ${timeStats?.restHours || 8} hours
- Available Free Time: ${timeStats?.freeHours || 4} hours
- Academic Goals: ${profile?.examGoals || "Excellence in exams"}

Generate 3-4 specific, actionable, and refreshing recommendations for the student to optimize their free time, maintain high mental energy, and balance studies with recreation.
Return JSON with this exact schema:
{
  "summary": "Short 1-2 sentence encouraging overview",
  "recommendations": [
    {
      "title": "Title of suggestion",
      "category": "Micro-Revision | Physical Refresh | Spaced Practice | Relaxation",
      "recommendedMinutes": 25,
      "details": "Concrete steps to take",
      "actionTip": "Quick motivational takeaway"
    }
  ],
  "routineBalanceFeedback": "Short feedback on whether the current schedule is healthy or at risk of burnout"
}`;
          } else if (type === "exam_feedback") {
            prompt = `You are an expert academic evaluator analyzing terminal examination and unit test marks for a student (${profile?.grade || "Grade 10/11/12"}).
Marks Data:
${JSON.stringify(exams || [], null, 2)}

Provide an insightful performance breakdown with:
1. Identifying top strong subjects and topics.
2. Pinpointing critical areas needing immediate review.
3. A realistic 3-step revision plan for the next upcoming exams.
Return JSON with this exact schema:
{
  "summary": "Overall evaluation summary",
  "overallGpaGrade": "Estimated grade/performance tier",
  "strengths": ["Strength 1", "Strength 2"],
  "weaknesses": ["Area to improve 1", "Area to improve 2"],
  "actionablePlan": [
    {
      "step": "Step name",
      "subject": "Target subject",
      "frequency": "e.g. 30 mins daily",
      "strategy": "Specific method to master the weak topics"
    }
  ],
  "encouragement": "A warm, motivating Nepali student encouragement quote or sentence"
}`;
          } else {
            prompt = `You are an academic routine specialist.
Student Time Stats:
- Total Study Hours (School + Tuition + Self-Study): ${timeStats?.totalStudyHours || 6} hrs
- Rest & Sleep: ${timeStats?.restHours || 8} hrs
- Leisure / Free Time: ${timeStats?.freeHours || 3} hrs
- School/College Classes: ${classes?.length || 0} scheduled classes

Provide a 24-hour balance assessment and 2 tips for optimal energy management.
Return JSON:
{
  "balanceScore": 85,
  "status": "Well-Balanced | High Study Load | Under-utilized",
  "summary": "Short summary",
  "tips": ["Tip 1", "Tip 2"]
}`;
          }

          const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
            },
          });

          if (response.text) {
            const parsed = JSON.parse(response.text);
            return res.json({ success: true, source: "gemini", data: parsed });
          }
        } catch (apiErr: any) {
          console.warn("Gemini API call failed, falling back to rule-based engine:", apiErr?.message);
        }
      }

      // Intelligent Rule-Based Fallback when API key is missing or quota is exceeded
      if (type === "free_time_suggestions") {
        const freeHours = timeStats?.freeHours || 4;
        const recommendations = [
          {
            title: "The 25-Minute Spaced Retention Block",
            category: "Micro-Revision",
            recommendedMinutes: 25,
            details: "Spend 25 minutes reviewing notes from your hardest class earlier today. Flashcard practice prevents the forgetting curve.",
            actionTip: "Write down 3 core formulas or terms without looking at your book.",
          },
          {
            title: "Post-School Mental Decompression Walk",
            category: "Physical Refresh",
            recommendedMinutes: 20,
            details: "Take a 20-minute brisk walk outside or do light stretching before starting evening tuition or homework. Lowers cortisol and reboots focus.",
            actionTip: "Step away from phone screens during this window.",
          },
          {
            title: "Active Practice: 3 Challenging Past Questions",
            category: "Spaced Practice",
            recommendedMinutes: 35,
            details: "Rather than re-reading chapters, solve 3 past SEE / Board exam numericals or short answers under a timed stopwatch.",
            actionTip: "Analyze any mistakes immediately.",
          },
          {
            title: "Relaxing Wind-Down & Routine Preparation",
            category: "Relaxation",
            recommendedMinutes: 30,
            details: `Organize your school bag and set out stationery for tomorrow. Prepare for restful sleep around ${profile?.targetBedTime || "22:30"}.`,
            actionTip: "Turn off bright blue screens 30 minutes before sleeping.",
          },
        ];

        return res.json({
          success: true,
          source: "built-in",
          data: {
            summary: `You have ~${freeHours} hours of discretionary free time outside school, tuition, and sleep. Using just 45 minutes of it intentionally will yield huge exam gains!`,
            recommendations,
            routineBalanceFeedback: timeStats?.totalStudyHours > 8 
              ? "Your study load is currently quite heavy. Make sure to protect your sleep time to prevent mental fatigue."
              : "Your schedule has a healthy balance between structured class hours and open time.",
          },
        });
      } else if (type === "exam_feedback") {
        const examList = Array.isArray(exams) ? exams : [];
        const avgPercentage = examList.length > 0
          ? Math.round(examList.reduce((acc: number, e: any) => acc + (e.percentage || 0), 0) / examList.length)
          : 80;

        const lowScoring = examList.filter((e: any) => (e.percentage || 0) < 80);
        const highScoring = examList.filter((e: any) => (e.percentage || 0) >= 80);

        return res.json({
          success: true,
          source: "built-in",
          data: {
            summary: `Overall performance stands at an impressive ${avgPercentage}% average across recorded tests.`,
            overallGpaGrade: avgPercentage >= 90 ? "A+ (Outstanding)" : avgPercentage >= 80 ? "A (Excellent)" : avgPercentage >= 70 ? "B+ (Very Good)" : "B (Good)",
            strengths: highScoring.length > 0
              ? highScoring.map((e: any) => `${e.subject} (${e.percentage}% in ${e.termName})`)
              : ["Consistency in attending scheduled classes"],
            weaknesses: lowScoring.length > 0
              ? lowScoring.map((e: any) => `${e.subject} (${e.percentage}%) - needs focused numerical and formula revision`)
              : ["Ensure continuous practice to maintain high scores across all terminal exams"],
            actionablePlan: [
              {
                step: "Diagnostic Review",
                subject: lowScoring[0]?.subject || "Optional Mathematics",
                frequency: "35 mins daily",
                strategy: "Re-solve all questions missed in the last terminal exam without referring to solution manuals.",
              },
              {
                step: "Formula & Theorem Index",
                subject: "All Subjects",
                frequency: "15 mins before bed",
                strategy: "Keep a dedicated pocket notebook for key formulas, definitions, and geometric theorem statements.",
              },
              {
                step: "Timed Mock Unit Test",
                subject: "Core Subjects",
                frequency: "Every Saturday morning",
                strategy: "Simulate test conditions for 45 minutes to build exam speed and eradicate silly calculation errors.",
              },
            ],
            encouragement: "Success in exams is the sum of small efforts repeated day in and day out. You are on track to achieve great results!",
          },
        });
      } else {
        return res.json({
          success: true,
          source: "built-in",
          data: {
            balanceScore: 88,
            status: "Well-Balanced",
            summary: "Good equilibrium between class hours, personal study, and necessary rest.",
            tips: [
              "Maintain consistent wake-up and bed times even on weekends.",
              "Take 5-minute micro-breaks between 45-minute study intervals.",
            ],
          },
        });
      }
    } catch (err: any) {
      console.error("Error in /api/student-ai-advisor:", err);
      res.status(500).json({ error: "Internal server error", message: err.message });
    }
  });

  // Vite middleware for development vs static files for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
