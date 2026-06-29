/**
 * AI Analysis Service
 * Uses OpenAI Vision API with Gemini as fallback
 * Analyzes facial features and generates personalized recommendations
 */

// ─── ANALYSIS PROMPT ──────────────────────────────────────────

function buildAnalysisPrompt(age, gender, goal) {
  return `You are an expert personal styling and appearance consultant AI. Analyze this selfie photo and provide a detailed, actionable glow-up analysis.

USER CONTEXT:
- Age: ${age}
- Gender: ${gender}
- Primary Goal: ${goal}

INSTRUCTIONS:
Analyze the photo and return a JSON response with the following structure. Be specific, actionable, and encouraging. Focus on improvements, NOT ratings or scores.

Return ONLY valid JSON with this exact structure:
{
  "face_shape": "oval|round|square|heart|oblong|diamond",
  "skin_type": "normal|oily|dry|combination",
  "skin_tone": "fair|light|medium|olive|tan|dark",
  "undertone": "warm|cool|neutral",
  
  "strengths": [
    {
      "label": "Feature Name",
      "description": "Why this is a strength - be specific and encouraging",
      "score": 8.5
    }
  ],
  
  "improvements": [
    {
      "category": "hair|skin|beard|eyebrows|glasses|colors|accessories|photo|confidence|shopping",
      "label": "Improvement Title",
      "description": "Brief description of what to change",
      "impact": "high|medium|low",
      "recommendations": [
        "Specific actionable recommendation 1",
        "Specific actionable recommendation 2",
        "Specific actionable recommendation 3"
      ],
      "products": [
        {"name": "Product Name", "type": "budget|mid|premium", "price_range": "₹200-500"}
      ]
    }
  ],
  
  "hair_recommendations": {
    "current_assessment": "Description of current hairstyle",
    "recommended_styles": ["Style 1", "Style 2", "Style 3"],
    "why": "Why these suit the face shape",
    "maintenance_tips": ["Tip 1", "Tip 2"]
  },
  
  "skin_routine": {
    "morning": [
      {"step": "Cleanser", "product_type": "Gentle foaming cleanser", "why": "reason"}
    ],
    "evening": [
      {"step": "Cleanser", "product_type": "Oil-based cleanser", "why": "reason"}
    ],
    "weekly": ["Exfoliate 2x/week", "Sheet mask 1x/week"]
  },
  
  "color_palette": {
    "best_colors": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
    "avoid_colors": ["#hex1", "#hex2"],
    "season": "spring|summer|autumn|winter",
    "explanation": "Why these colors work with skin tone and undertone"
  },
  
  "beard_recommendation": {
    "style": "clean-shave|stubble|short-beard|medium-beard|full-beard",
    "shape": "Description of ideal beard shape for face",
    "maintenance": "Maintenance tips"
  },
  
  "glasses_recommendation": {
    "frame_shapes": ["Shape 1", "Shape 2"],
    "frame_colors": ["Color 1", "Color 2"],
    "avoid": ["Shapes to avoid"]
  },
  
  "confidence_tips": [
    "Specific body language tip",
    "Posture tip",
    "Social confidence tip"
  ],
  
  "photo_tips": [
    "Best angle for this face shape",
    "Lighting tip",
    "Expression tip"
  ],
  
  "thirty_day_plan": {
    "week_1": ["Day 1-7 focus items"],
    "week_2": ["Day 8-14 focus items"],
    "week_3": ["Day 15-21 focus items"],
    "week_4": ["Day 22-30 focus items"]
  },
  
  "improvement_potential": 25,
  "overall_vibe": "A one-sentence encouraging summary of their overall potential"
}

GUIDELINES:
- Be encouraging and empowering, never judgmental
- Give AT LEAST 4 strengths
- Give AT LEAST 8 improvements across different categories
- Make recommendations specific to the ${goal} goal
- Consider ${gender} and age ${age} in all recommendations
- Include budget-friendly product suggestions (Indian market, ₹ pricing)
- Be culturally sensitive and inclusive
- NEVER give an attractiveness score or rating number`;
}

// ─── HELPER: Check if API key is a real key (not placeholder) ─

function isValidApiKey(key) {
  if (!key) return false;
  // Skip placeholder keys from .env.example
  const placeholders = ["sk-your", "your-", "placeholder", "xxx", "test"];
  return !placeholders.some((p) => key.toLowerCase().startsWith(p));
}

// ─── OPENAI VISION ANALYSIS ───────────────────────────────────

async function analyzeWithOpenAI(imageBase64, age, gender, goal) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !isValidApiKey(apiKey)) {
    throw new Error("OPENAI_API_KEY not configured or is a placeholder");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: buildAnalysisPrompt(age, gender, goal),
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 4096,
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `OpenAI API error: ${response.status} - ${errorData.error?.message || "Unknown error"}`
    );
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) throw new Error("Empty response from OpenAI");

  return {
    result: JSON.parse(content),
    model: "gpt-4o",
    tokens: data.usage?.total_tokens || 0,
  };
}

// ─── GEMINI VISION ANALYSIS ───────────────────────────────────

async function analyzeWithGemini(imageBase64, age, gender, goal) {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey || !isValidApiKey(apiKey)) {
    throw new Error("GOOGLE_AI_API_KEY not configured or is a placeholder");
  }

  // Use gemini-3.1-flash-lite (free tier, supports vision)
  const model = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: buildAnalysisPrompt(age, gender, goal) },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: imageBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Gemini API error: ${response.status} - ${errorData.error?.message || "Unknown error"}`
    );
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) throw new Error("Empty response from Gemini");

  return {
    result: JSON.parse(content),
    model: model,
    tokens: data.usageMetadata?.totalTokenCount || 0,
  };
}

// ─── MAIN ANALYSIS FUNCTION ───────────────────────────────────

/**
 * Analyze a selfie using AI (OpenAI primary, Gemini fallback)
 * @param {string} imageBase64 - Base64 encoded image
 * @param {number} age - User age
 * @param {string} gender - User gender
 * @param {string} goal - User goal
 * @returns {Promise<{result: object, model: string, tokens: number}>}
 */
export async function analyzeImage(imageBase64, age, gender, goal) {
  const startTime = Date.now();

  // Try OpenAI first (only if a real key is configured)
  if (process.env.OPENAI_API_KEY && isValidApiKey(process.env.OPENAI_API_KEY)) {
    try {
      const result = await analyzeWithOpenAI(imageBase64, age, gender, goal);
      result.processingTime = Date.now() - startTime;
      return result;
    } catch (error) {
      console.error("[AI] OpenAI failed, trying Gemini fallback:", error.message);
    }
  }

  // Gemini (primary free option)
  if (process.env.GOOGLE_AI_API_KEY && isValidApiKey(process.env.GOOGLE_AI_API_KEY)) {
    try {
      const result = await analyzeWithGemini(imageBase64, age, gender, goal);
      result.processingTime = Date.now() - startTime;
      return result;
    } catch (error) {
      console.error("[AI] Gemini also failed:", error.message);
      throw new Error("AI analysis failed. Please try again later.");
    }
  }

  throw new Error(
    "No valid AI API keys configured. Get a free key at https://aistudio.google.com/apikey and set GOOGLE_AI_API_KEY in your .env.local"
  );
}

// ─── VALIDATE AI RESPONSE ─────────────────────────────────────

/**
 * Validates that the AI response has the expected structure
 */
export function validateAnalysisResult(result) {
  const required = ["strengths", "improvements"];
  const missing = required.filter((key) => !result[key]);

  if (missing.length > 0) {
    return { valid: false, error: `Missing fields: ${missing.join(", ")}` };
  }

  if (!Array.isArray(result.strengths) || result.strengths.length < 2) {
    return { valid: false, error: "Insufficient strengths data" };
  }

  if (!Array.isArray(result.improvements) || result.improvements.length < 3) {
    return { valid: false, error: "Insufficient improvements data" };
  }

  return { valid: true };
}
