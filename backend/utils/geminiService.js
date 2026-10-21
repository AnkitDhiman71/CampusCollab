const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

/**
 * Call Google Gemini API with fallback across model aliases
 */
async function callGemini(prompt, systemInstruction = '') {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured in backend/.env');
  }

  const models = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite'];
  let lastError = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const payload = {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      };

      if (systemInstruction) {
        payload.systemInstruction = {
          parts: [{ text: systemInstruction }],
        };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const errMsg = data?.error?.message || `Gemini API returned status ${response.status}`;
        lastError = new Error(errMsg);
        continue; // Try next model alias
      }

      const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (generatedText) {
        return generatedText.trim();
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Failed to generate response from Gemini AI');
}

/**
 * AI Code Explanation Generator
 */
async function explainCodeSnippet(code, language = 'javascript', context = '') {
  try {
    const prompt = `You are a friendly senior engineer and mentor for university developers on CampusCollab.
Explain the following ${language} code snippet clearly, engagingly, and concisely:

\`\`\`${language}
${code}
\`\`\`

${context ? `Context/Topic: ${context}\n` : ''}

Format your response in neat, well-structured Markdown:
1. 💡 **Summary**: 1-2 sentence high-level overview of what the snippet accomplishes.
2. ⚙️ **How It Works**: Clear bullet points breaking down each key logic step.
3. ⏱️ **Complexity & Performance**: Time/Space complexity analysis.
4. 🚀 **Pro Tips & Edge Cases**: 1-2 tips or edge cases to watch out for.

Keep it easy to read for students.`;

    const explanation = await callGemini(prompt);
    return {
      success: true,
      explanation,
      provider: 'gemini',
    };
  } catch (err) {
    console.warn('[GeminiService] Gemini API call failed, falling back to smart local analyzer:', err.message);
    // Intelligent heuristic local fallback
    const fallbackText = generateLocalCodeExplanation(code, language);
    return {
      success: true,
      explanation: fallbackText,
      provider: 'local_heuristic',
      warning: `Gemini API: ${err.message}`,
    };
  }
}

/**
 * AI Assessment Code Evaluator & Auto-Scoring
 */
async function evaluateAssessmentCode({
  title,
  description,
  language = 'javascript',
  submittedCode,
  outputLog = '',
  violationsCount = 0,
}) {
  try {
    const prompt = `You are an expert technical interviewer evaluating a student candidate's coding assessment for a campus project team.

Problem Title: ${title}
Problem Requirements:
${description}

Language: ${language}
Anti-Cheat Violations Detected during test: ${violationsCount} strikes.

Candidate's Submitted Code:
\`\`\`${language}
${submittedCode || '// Empty or no code submitted'}
\`\`\`

Test Run / Console Output Log:
${outputLog || 'No console output logged'}

Evaluate this submission rigorously. You MUST respond with ONLY a valid JSON object matching this exact schema (no markdown wrap, no backticks):
{
  "score": 85,
  "verdict": "Passed",
  "strengths": "Clean array filtering logic, adheres to constraints",
  "improvements": "Consider handling empty array and null objects gracefully",
  "timeComplexity": "O(n log n)",
  "spaceComplexity": "O(n)",
  "feedback": "Great submission! The code solves the required problem properly. Adding comments and edge case handling will make it production ready."
}`;

    const rawResponse = await callGemini(prompt);
    let cleanJson = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    // Apply violation strike penalties
    if (violationsCount > 0) {
      const penalty = violationsCount * 15;
      parsed.score = Math.max(0, (parsed.score || 70) - penalty);
      parsed.feedback += ` Note: Score reflects a deduction of ${penalty} points due to ${violationsCount} anti-cheat violation strikes during the session.`;
    }

    return {
      success: true,
      data: parsed,
      provider: 'gemini',
    };
  } catch (err) {
    console.warn('[GeminiService] AI Evaluation API failed, falling back to heuristic evaluation:', err.message);
    return {
      success: true,
      data: generateLocalEvaluation(submittedCode, violationsCount),
      provider: 'local_heuristic',
      warning: `Gemini API: ${err.message}`,
    };
  }
}

/**
 * Local fallback helpers
 */
function generateLocalCodeExplanation(code, language) {
  const lineCount = (code || '').split('\n').length;
  const hasAsync = /async|await|Promise|then/i.test(code);
  const hasLoop = /for\s*\(|while\s*\(|\.map\(|\.forEach\(|\.filter\(/i.test(code);
  const hasFunction = /function|=>|def\s+|void\s+|int\s+/i.test(code);

  return `### 💡 Summary
This is a **${language.toUpperCase()}** code snippet containing approximately **${lineCount} lines**. It implements ${
    hasFunction ? 'modular functional logic' : 'procedural operations'
  } ${hasAsync ? 'with asynchronous operations' : ''}.

### ⚙️ How It Works
- **Structure**: Defines ${hasFunction ? 'core functions/methods' : 'logical statements'} to process data.
- **Data Flow**: ${
    hasLoop
      ? 'Iterates over collections or structures to transform/filter elements.'
      : 'Executes sequence of control flows and operations.'
  }
- **Asynchrony**: ${
    hasAsync
      ? 'Handles promises or non-blocking I/O using modern async/await syntax.'
      : 'Executes synchronously within the execution thread.'
  }

### ⏱️ Complexity & Performance
- **Time Complexity**: ${hasLoop ? '~O(n) linear scan' : 'O(1) constant time'} depending on input volume.
- **Space Complexity**: Generally O(1) auxiliary space unless creating new collection allocations.

### 🚀 Pro Tips
- Ensure boundary and null/undefined values are verified.
- Use explicit variable names for team readability in peer projects.`;
}

function generateLocalEvaluation(code, violations) {
  const codeLen = (code || '').trim().length;
  let baseScore = codeLen > 100 ? 80 : codeLen > 40 ? 65 : 40;
  baseScore -= violations * 15;
  baseScore = Math.max(10, Math.min(100, baseScore));

  return {
    score: baseScore,
    verdict: baseScore >= 70 ? 'Passed' : 'Needs Work',
    strengths: codeLen > 60 ? 'Demonstrates functional solution attempt with appropriate syntax structure.' : 'Basic skeleton structure provided.',
    improvements: 'Ensure all test cases, empty inputs, and proctoring constraints are fully respected.',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    feedback: `The candidate provided a solution consisting of ${codeLen} characters. ${
      violations > 0
        ? `Warning: ${violations} proctoring violations were recorded.`
        : 'Assessment completed with a clean proctoring record.'
    }`,
  };
}

module.exports = {
  callGemini,
  explainCodeSnippet,
  evaluateAssessmentCode,
};
