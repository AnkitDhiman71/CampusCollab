const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const fastGeminiCache = new Map();

/**
 * Call Google Gemini API with fallback across high-speed model aliases and strict timeout
 */
async function callGemini(prompt, systemInstruction = '', timeoutMs = 8000) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured in backend/.env');
  }

  // Check cache for identical prompts
  const cacheKey = `${systemInstruction}:::${prompt}`;
  if (fastGeminiCache.has(cacheKey)) {
    return fastGeminiCache.get(cacheKey);
  }

  // Active high-speed generation models
  const models = [
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemini-2.5-flash-lite',
  ];

  let lastError = null;

  for (const model of models) {
    let timeoutId;
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), timeoutMs);

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
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        const errMsg = data?.error?.message || `Gemini API returned status ${response.status}`;
        lastError = new Error(errMsg);
        continue; // Try next fast model alias
      }

      const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (generatedText) {
        const result = generatedText.trim();
        // Cache up to 100 recent entries
        if (fastGeminiCache.size > 100) {
          const firstKey = fastGeminiCache.keys().next().value;
          fastGeminiCache.delete(firstKey);
        }
        fastGeminiCache.set(cacheKey, result);
        return result;
      }
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);
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


/**
 * AI Test Case Generator
 * Generates structured, high-quality test cases based on problem statement, starter code, and language.
 */
async function generateTestCases({ title = '', description = '', language = 'javascript', starterCode = '' }) {
  try {
    const prompt = `You are a technical assessment test-suite generator.
Generate 3 to 4 comprehensive, realistic test cases for the following programming problem.

Title: ${title || 'Programming Challenge'}
Target Language: ${language}
Problem Statement & Requirements:
${description}

Starter Code:
${starterCode || 'None provided'}

Requirements for each test case:
1. "input": The exact standard input string, function arguments, or CLI input to feed to the program.
2. "expectedOutput": The exact expected stdout console output or function return value.
3. "explanation": 1 concise sentence explaining what this test case tests (e.g. Standard case, Edge case with negative numbers, Empty string/array, Boundary condition).

Format your response ONLY as a valid JSON array with NO markdown, NO code fences, NO comments.
Format:
[
  {
    "input": "...",
    "expectedOutput": "...",
    "explanation": "..."
  }
]`;

    const rawResponse = await callGemini(prompt, 'You are an automated test case generator that strictly outputs valid JSON arrays with no markdown or formatting wrapper.');

    // Clean any markdown backticks if returned
    let cleaned = rawResponse.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const testCases = JSON.parse(cleaned);

    if (Array.isArray(testCases) && testCases.length > 0) {
      return {
        success: true,
        testCases: testCases.map((tc) => ({
          input: String(tc.input ?? ''),
          expectedOutput: String(tc.expectedOutput ?? ''),
          explanation: String(tc.explanation ?? ''),
        })),
        provider: 'gemini',
      };
    }

    throw new Error('Parsed result was not a non-empty array');
  } catch (err) {
    console.warn('[GeminiService] AI Test Case generation failed, using intelligent heuristic fallback:', err.message);
    const fallbackCases = generateLocalTestCases(title, description, language);
    return {
      success: true,
      testCases: fallbackCases,
      provider: 'local_heuristic',
      warning: `AI generator note: ${err.message}`,
    };
  }
}

/**
 * Heuristic fallback for generating test cases when offline or API is unavailable
 */
function generateLocalTestCases(title = '', description = '', language = '') {
  const text = `${title} ${description}`.toLowerCase();

  if (text.includes('reverse') || text.includes('palindrome')) {
    return [
      { input: '"CampusCollab"', expectedOutput: '"balloCsupmaC"', explanation: 'Standard mixed-case word reversal' },
      { input: '"a"', expectedOutput: '"a"', explanation: 'Edge Case: Single character string' },
      { input: '""', expectedOutput: '""', explanation: 'Corner Case: Empty string' },
      { input: '"racecar"', expectedOutput: '"racecar"', explanation: 'Palindrome symmetry verification' },
    ];
  }

  if (text.includes('min') || text.includes('max') || text.includes('array')) {
    return [
      { input: '[3, 7, 2, 9, 1, 5]', expectedOutput: 'min: 1, max: 9', explanation: 'Standard unsorted positive integer array' },
      { input: '[-10, -5, -20, -1]', expectedOutput: 'min: -20, max: -1', explanation: 'Edge Case: All negative integers' },
      { input: '[42]', expectedOutput: 'min: 42, max: 42', explanation: 'Corner Case: Single element array' },
      { input: '[5, 5, 5, 5]', expectedOutput: 'min: 5, max: 5', explanation: 'Boundary: Identical array values' },
    ];
  }

  if (text.includes('sum') || text.includes('add') || text.includes('two sum')) {
    return [
      { input: 'nums = [2, 7, 11, 15], target = 9', expectedOutput: '[0, 1]', explanation: 'Standard target sum at the beginning' },
      { input: 'nums = [3, 2, 4], target = 6', expectedOutput: '[1, 2]', explanation: 'Standard target sum in middle/end elements' },
      { input: 'nums = [3, 3], target = 6', expectedOutput: '[0, 1]', explanation: 'Edge Case: Identical element target match' },
    ];
  }

  return [
    { input: 'Standard Input #1', expectedOutput: 'Expected Output #1', explanation: 'Typical nominal execution scenario' },
    { input: 'Edge Case Input (null, 0, or empty)', expectedOutput: 'Boundary Result', explanation: 'Boundary & minimum condition verification' },
    { input: 'Large / Scale Input', expectedOutput: 'Valid Transformed Output', explanation: 'Performance and scale robustness test' },
  ];
}

module.exports = {
  callGemini,
  explainCodeSnippet,
  evaluateAssessmentCode,
  generateTestCases,
};

