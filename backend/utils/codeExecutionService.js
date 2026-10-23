const { execFile, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { callGemini } = require('./geminiService');

const TEMP_EXEC_DIR = path.join(os.tmpdir(), 'campus_collab_exec');
if (!fs.existsSync(TEMP_EXEC_DIR)) {
  try {
    fs.mkdirSync(TEMP_EXEC_DIR, { recursive: true });
  } catch (e) {
    console.warn('Could not create temp exec dir:', e.message);
  }
}

/**
 * Execute locally using native host compilers if installed (GCC, G++, Python, Node)
 */
function runLocally({ code, language, stdin = '' }) {
  return new Promise((resolve, reject) => {
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const normLang = (language || '').toLowerCase().trim();
    const isWindows = process.platform === 'win32';

    if (normLang === 'c') {
      const srcFile = path.join(TEMP_EXEC_DIR, `run_${id}.c`);
      const exeFile = path.join(TEMP_EXEC_DIR, isWindows ? `run_${id}.exe` : `run_${id}`);
      fs.writeFileSync(srcFile, code, 'utf8');

      // Compile with GCC
      execFile('gcc', [srcFile, '-o', exeFile], { timeout: 6000 }, (compileErr, compileStdout, compileStderr) => {
        if (compileErr) {
          try { fs.unlinkSync(srcFile); } catch (e) {}
          if (compileErr.code === 'ENOENT') {
            return reject(new Error('GCC compiler not installed on host'));
          }
          return resolve({
            success: false,
            isCompileError: true,
            language: 'C (GCC Local)',
            output: `Compilation Error:\n${compileStderr || compileErr.message}`,
            provider: 'local_gcc',
          });
        }

        // Run compiled binary
        runProcessWithStdin(exeFile, [], stdin, 5000, (err, stdout, stderr, exitCode) => {
          try { fs.unlinkSync(srcFile); fs.unlinkSync(exeFile); } catch (e) {}
          resolve({
            success: exitCode === 0,
            language: 'C (GCC Local)',
            output: (stdout || stderr || (exitCode === 0 ? '✓ Program executed with 0 errors.' : `Exit code: ${exitCode}`)).trim(),
            exitCode,
            provider: 'local_gcc',
          });
        });
      });
    } else if (normLang === 'cpp' || normLang === 'c++') {
      const srcFile = path.join(TEMP_EXEC_DIR, `run_${id}.cpp`);
      const exeFile = path.join(TEMP_EXEC_DIR, isWindows ? `run_${id}.exe` : `run_${id}`);
      fs.writeFileSync(srcFile, code, 'utf8');

      // Compile with G++
      execFile('g++', [srcFile, '-o', exeFile], { timeout: 7000 }, (compileErr, compileStdout, compileStderr) => {
        if (compileErr) {
          try { fs.unlinkSync(srcFile); } catch (e) {}
          if (compileErr.code === 'ENOENT') {
            return reject(new Error('G++ compiler not installed on host'));
          }
          return resolve({
            success: false,
            isCompileError: true,
            language: 'C++ (G++ Local)',
            output: `Compilation Error:\n${compileStderr || compileErr.message}`,
            provider: 'local_gpp',
          });
        }

        runProcessWithStdin(exeFile, [], stdin, 5000, (err, stdout, stderr, exitCode) => {
          try { fs.unlinkSync(srcFile); fs.unlinkSync(exeFile); } catch (e) {}
          resolve({
            success: exitCode === 0,
            language: 'C++ (G++ Local)',
            output: (stdout || stderr || (exitCode === 0 ? '✓ Program executed with 0 errors.' : `Exit code: ${exitCode}`)).trim(),
            exitCode,
            provider: 'local_gpp',
          });
        });
      });
    } else if (normLang === 'python' || normLang === 'py' || normLang === 'python3') {
      const srcFile = path.join(TEMP_EXEC_DIR, `run_${id}.py`);
      fs.writeFileSync(srcFile, code, 'utf8');

      const pyBin = isWindows ? 'python' : 'python3';
      runProcessWithStdin(pyBin, [srcFile], stdin, 5000, (err, stdout, stderr, exitCode) => {
        try { fs.unlinkSync(srcFile); } catch (e) {}
        if (err && err.code === 'ENOENT') {
          return reject(new Error('Python not installed on host'));
        }
        resolve({
          success: exitCode === 0,
          language: 'Python 3 (Local)',
          output: (stdout || stderr || (exitCode === 0 ? '✓ Program executed with 0 errors.' : `Exit code: ${exitCode}`)).trim(),
          exitCode,
          provider: 'local_python',
        });
      });
    } else if (normLang === 'javascript' || normLang === 'js') {
      const srcFile = path.join(TEMP_EXEC_DIR, `run_${id}.js`);
      fs.writeFileSync(srcFile, code, 'utf8');

      runProcessWithStdin('node', [srcFile], stdin, 5000, (err, stdout, stderr, exitCode) => {
        try { fs.unlinkSync(srcFile); } catch (e) {}
        resolve({
          success: exitCode === 0,
          language: 'JavaScript (Node Local)',
          output: (stdout || stderr || (exitCode === 0 ? '✓ Program executed with 0 errors.' : `Exit code: ${exitCode}`)).trim(),
          exitCode,
          provider: 'local_node',
        });
      });
    } else {
      reject(new Error(`Unsupported local language: ${language}`));
    }
  });
}

function runProcessWithStdin(cmd, args, stdin, timeoutMs, cb) {
  let stdout = '';
  let stderr = '';
  let killed = false;

  const child = spawn(cmd, args);

  const timer = setTimeout(() => {
    killed = true;
    child.kill('SIGKILL');
  }, timeoutMs);

  if (stdin) {
    child.stdin.write(stdin);
    child.stdin.end();
  } else {
    child.stdin.end();
  }

  child.stdout.on('data', (data) => {
    stdout += data.toString();
  });

  child.stderr.on('data', (data) => {
    stderr += data.toString();
  });

  child.on('error', (err) => {
    clearTimeout(timer);
    cb(err, stdout, stderr || err.message, -1);
  });

  child.on('close', (code) => {
    clearTimeout(timer);
    if (killed) {
      stderr += `\n[Time Limit Exceeded]: Process was terminated after exceeding ${timeoutMs / 1000} seconds.`;
    }
    cb(null, stdout, stderr, code);
  });
}

/**
/**
 * Judge0 Cloud Sandbox (Used when JUDGE0_API_KEY / RAPIDAPI_KEY is configured in .env)
 */
async function runWithJudge0({ code, language, stdin = '' }) {
  const apiKey = process.env.JUDGE0_API_KEY || process.env.RAPIDAPI_KEY;
  if (!apiKey) return null;

  const JUDGE0_LANG_IDS = {
    c: 50,
    cpp: 54,
    'c++': 54,
    python: 71,
    py: 71,
    python3: 71,
    java: 62,
    javascript: 63,
    js: 63,
    node: 63,
    typescript: 74,
    ts: 74,
  };

  const normLang = (language || '').toLowerCase().trim();
  const langId = JUDGE0_LANG_IDS[normLang];
  if (!langId) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const response = await fetch('https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
    },
    body: JSON.stringify({
      source_code: code || '',
      language_id: langId,
      stdin: stdin || '',
      cpu_time_limit: 5,
      memory_limit: 128000,
    }),
    signal: controller.signal,
  });

  clearTimeout(timeoutId);
  if (!response.ok) return null;

  const data = await response.json();
  const isCompileErr = Boolean(data.compile_output && !data.stdout) || data.status?.id === 6;

  return {
    success: data.status?.id === 3,
    isCompileError: isCompileErr,
    language,
    output: (data.stdout || data.compile_output || data.stderr || (data.status?.id === 3 ? '✓ Code executed with 0 errors.' : data.status?.description || 'Execution failed.')).trim(),
    exitCode: data.exit_code ?? (data.status?.id === 3 ? 0 : 1),
    provider: 'judge0_cloud',
  };
}

/**
 * Free Remote Cloud Sandbox (0% Host CPU usage, zero setup, runs on external Linux container)
 */
async function runWithCloudSandbox({ code, language, stdin = '' }) {
  const normLang = (language || 'javascript').toLowerCase().trim();
  const WANDBOX_COMPILERS = {
    c: 'gcc-head',
    cpp: 'gcc-head',
    'c++': 'gcc-head',
    python: 'cpython-3.12.7',
    py: 'cpython-3.12.7',
    python3: 'cpython-3.12.7',
    java: 'openjdk-jdk-22+36',
    javascript: 'nodejs-20.17.0',
    js: 'nodejs-20.17.0',
    node: 'nodejs-20.17.0',
    typescript: 'typescript-5.5.4',
    ts: 'typescript-5.5.4',
  };

  const compiler = WANDBOX_COMPILERS[normLang] || 'nodejs-20.17.0';

  // Normalize Java code: allow candidates to write "public class Main" or any class name
  let processedCode = code || '';
  if (normLang === 'java') {
    processedCode = processedCode.replace(/public\s+class\s+([A-Za-z0-9_]+)/g, 'class $1');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  const response = await fetch('https://wandbox.org/api/compile.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      compiler,
      code: processedCode,
      stdin: stdin || '',
      options: normLang === 'cpp' || normLang === 'c++' ? 'warning,gnu++20' : undefined,
    }),
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error(`Remote sandbox returned HTTP ${response.status}`);
  }

  const result = await response.json();

  if (result.compiler_error && (!result.program_output && !result.program_message)) {
    return {
      success: false,
      isCompileError: true,
      language,
      output: `Compilation Error:\n${result.compiler_error}`,
      provider: 'cloud_sandbox',
    };
  }

  const output = (result.program_output || result.program_message || result.compiler_message || '').trim();
  return {
    success: result.status === '0',
    language,
    output: output || '✓ Code executed with 0 errors.',
    exitCode: result.status,
    provider: 'cloud_sandbox',
  };
}

/**
 * Main executeCode entrypoint
 * Prioritizes remote cloud execution so host CPU usage is 0%.
 * Automatically falls back to local compiler and AI simulation if offline.
 */
async function executeCode({ code, language = 'javascript', stdin = '' }) {
  const startTime = Date.now();
  const normLang = (language || 'javascript').toLowerCase().trim();

  // 1. Primary: Run on Judge0 if API key is present in .env
  try {
    const judge0Res = await runWithJudge0({ code, language: normLang, stdin });
    if (judge0Res) {
      return {
        ...judge0Res,
        executionTimeMs: Date.now() - startTime,
      };
    }
  } catch (judge0Err) {
    console.warn(`[CodeExecution] Judge0 error: ${judge0Err.message}. Trying cloud sandbox...`);
  }

  // 2. Primary Free: Run on Remote Cloud Sandbox (0% Host CPU usage)
  try {
    const sandboxRes = await runWithCloudSandbox({ code, language: normLang, stdin });
    if (sandboxRes) {
      return {
        ...sandboxRes,
        executionTimeMs: Date.now() - startTime,
      };
    }
  } catch (remoteErr) {
    console.warn(`[CodeExecution] Cloud sandbox unavailable: ${remoteErr.message}. Falling back to local compilers...`);
  }

  // 3. Fallback: Local Machine Compilation (Only if internet/remote is down)
  try {
    const localRes = await runLocally({ code, language: normLang, stdin });
    return {
      ...localRes,
      executionTimeMs: Date.now() - startTime,
    };
  } catch (localErr) {
    console.warn(`[CodeExecution] Local run unavailable: ${localErr.message}. Trying AI simulation...`);
  }

  // 4. Fallback: AI Simulation
  try {
    const prompt = `Simulate compiling and running this ${language} code. Output ONLY the console stdout or any compiler syntax error. No comments.
\`\`\`${language}
${code}
\`\`\``;
    const simulated = await callGemini(prompt);
    return {
      success: true,
      language,
      output: simulated || '✓ Code executed.',
      executionTimeMs: Date.now() - startTime,
      provider: 'ai_simulated',
    };
  } catch (aiErr) {
    return {
      success: false,
      language,
      output: `Execution Error: Could not run code. ${aiErr.message}`,
      executionTimeMs: Date.now() - startTime,
      provider: 'error',
    };
  }
}

module.exports = {
  executeCode,
};
