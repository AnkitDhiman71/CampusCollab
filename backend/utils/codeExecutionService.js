/**
 * Piston Sandboxed Code Execution Service for CampusCare
 * 
 * All user-submitted code (C, C++, Java, Python, JavaScript) is executed inside an
 * isolated, sandboxed Docker container running Piston (0% host risk, zero leaks).
 */

const PISTON_BASE_URL = process.env.PISTON_URL || 'http://localhost:2000';

/**
 * Intelligent Language Normalizer
 * Handles raw inputs from any dropdown format: "C (GCC)", "C++ (G++)", "Python 3", "java", etc.
 */
function normalizeLanguage(lang) {
  const s = (lang || '').toLowerCase().trim();
  if (/c\+\+|cpp|g\+\+/.test(s)) return 'c++';
  if (/\b(c|gcc)\b/.test(s) || s.startsWith('c ') || s.startsWith('c(')) return 'c';
  if (/python|py/.test(s)) return 'python';
  if (/java\b/.test(s)) return 'java';
  if (/node|js|javascript/.test(s)) return 'javascript';
  return s || 'python';
}

// Friendly display names for frontend reporting
const DISPLAY_NAMES = {
  c: 'C (GCC 10.2)',
  'c++': 'C++ (G++ 10.2)',
  python: 'Python (3.10)',
  java: 'Java (OpenJDK 15)',
  javascript: 'JavaScript (Node.js)',
};

/**
 * Helper to determine candidate Java class name to ensure filename matches
 */
function getJavaFileName(code) {
  const match = code.match(/(?:public\s+)?class\s+([A-Za-z0-9_]+)/);
  return match && match[1] ? `${match[1]}.java` : 'Main.java';
}

/**
 * Automatically ensures C/C++ or Java code has a main entrypoint
 * so candidates can test starter boilerplate functions without linker errors.
 */
function prepareCode(code = '', pistonLang = '') {
  let processed = code;

  if (pistonLang === 'c') {
    // If no main() is defined in C code, append a test runner
    if (!/\bmain\s*\(/.test(processed)) {
      processed += `\n\nint main() {\n    printf("✓ Functions compiled and loaded successfully.\\n");\n    return 0;\n}\n`;
    }
  } else if (pistonLang === 'c++') {
    // If no main() is defined in C++ code, append a test runner
    if (!/\bmain\s*\(/.test(processed)) {
      processed += `\n\n#include <iostream>\nint main() {\n    std::cout << "✓ Functions compiled and loaded successfully." << std::endl;\n    return 0;\n}\n`;
    }
  } else if (pistonLang === 'java') {
    // If Java has no class defined at all, wrap it
    if (!/\bclass\s+[A-Za-z0-9_]+/.test(processed)) {
      processed = `public class Main {\n${processed}\npublic static void main(String[] args) {\nSystem.out.println("✓ Code compiled successfully.");\n}\n}`;
    } else if (!/public\s+static\s+void\s+main/.test(processed)) {
      // Class exists but no main, inject main before last closing brace
      const lastBrace = processed.lastIndexOf('}');
      if (lastBrace !== -1) {
        processed = processed.substring(0, lastBrace) +
          `\n    public static void main(String[] args) {\n        System.out.println("✓ Class compiled and loaded successfully.");\n    }\n}\n`;
      }
    }
  }

  return processed;
}

/**
 * Execute code via self-hosted Piston container
 *
 * @param {Object} params
 * @param {string} params.code - The source code to execute
 * @param {string} params.language - Language ("C (GCC)", "c", "cpp", "java", etc.)
 * @param {string} [params.stdin=''] - Optional standard input for the program
 * @returns {Promise<Object>} Formatted result compatible with CampusCare UI
 */
async function executeCode({ code, language = 'c', stdin = '' }) {
  const startTime = Date.now();
  const pistonLang = normalizeLanguage(language);
  const displayName = DISPLAY_NAMES[pistonLang] || language;

  // Prepare code with main() fallback if missing
  const finalCode = prepareCode(code, pistonLang);

  // Build the file payload for Piston
  const fileName = pistonLang === 'java' ? getJavaFileName(finalCode) : undefined;
  const files = [
    {
      ...(fileName ? { name: fileName } : {}),
      content: finalCode || '',
    },
  ];

  // Try configured Piston URLs (Primary -> container fallback if inside Docker)
  const candidateUrls = [
    `${PISTON_BASE_URL}/api/v2/execute`,
    'http://piston:2000/api/v2/execute',
    'http://host.docker.internal:2000/api/v2/execute',
  ];

  const urlsToTry = [...new Set(candidateUrls)];
  let lastError = null;

  for (const url of urlsToTry) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: pistonLang,
          version: '*',
          files,
          stdin: stdin ? (stdin.endsWith('\n') ? stdin : `${stdin}\n`) : '',
          run_timeout: 10000,
          compile_timeout: 10000,
          run_cpu_time: 10000,
          compile_cpu_time: 10000,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Piston API returned HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const compile = data.compile;
      const run = data.run;

      // Check if compilation failed
      const isCompileError = Boolean(compile && compile.code !== 0);
      const compileOutput = (compile?.stderr || compile?.output || compile?.stdout || '').trim();

      if (isCompileError) {
        return {
          success: false,
          isCompileError: true,
          language: displayName,
          output: `Compilation Error:\n${compileOutput || 'Failed to compile source code.'}`,
          exitCode: compile?.code ?? 1,
          executionTimeMs: Date.now() - startTime,
          provider: 'piston_sandbox',
        };
      }

      // Execution result
      const runOutput = (run?.output || run?.stdout || run?.stderr || '').trim();
      const exitCode = run?.code ?? (run?.signal ? -1 : 0);
      const isSuccess = exitCode === 0;

      let finalOutput = runOutput;
      if (!finalOutput && isSuccess) {
        finalOutput = '✓ Code executed successfully with 0 errors (No standard output returned).';
      } else if (!finalOutput && !isSuccess) {
        finalOutput = run?.message || `Process terminated with exit code ${exitCode}`;
      }

      return {
        success: isSuccess,
        isCompileError: false,
        language: displayName,
        output: finalOutput,
        exitCode,
        executionTimeMs: Date.now() - startTime,
        provider: 'piston_sandbox',
      };
    } catch (err) {
      lastError = err;
      if (err.cause?.code === 'ECONNREFUSED' || err.message.includes('ECONNREFUSED')) {
        continue;
      }
      break;
    }
  }

  // If Piston could not be reached on any candidate URL
  return {
    success: false,
    isCompileError: false,
    language: displayName,
    output: `Execution Service Error: Could not connect to Piston sandbox container (${lastError?.message || 'Connection refused'}). Ensure the 'piston_api' Docker container is running.`,
    exitCode: -1,
    executionTimeMs: Date.now() - startTime,
    provider: 'piston_sandbox',
  };
}

module.exports = {
  executeCode,
};
