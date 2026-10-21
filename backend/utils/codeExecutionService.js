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

    if (normLang === 'c') {
      const srcFile = path.join(TEMP_EXEC_DIR, `run_${id}.c`);
      const exeFile = path.join(TEMP_EXEC_DIR, `run_${id}.exe`);
      fs.writeFileSync(srcFile, code, 'utf8');

      // Compile with GCC
      execFile('gcc', [srcFile, '-o', exeFile], { timeout: 6000 }, (compileErr, compileStdout, compileStderr) => {
        if (compileErr) {
          try { fs.unlinkSync(srcFile); } catch (e) {}
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
      const exeFile = path.join(TEMP_EXEC_DIR, `run_${id}.exe`);
      fs.writeFileSync(srcFile, code, 'utf8');

      // Compile with G++
      execFile('g++', [srcFile, '-o', exeFile], { timeout: 7000 }, (compileErr, compileStdout, compileStderr) => {
        if (compileErr) {
          try { fs.unlinkSync(srcFile); } catch (e) {}
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

      runProcessWithStdin('python', [srcFile], stdin, 5000, (err, stdout, stderr, exitCode) => {
        try { fs.unlinkSync(srcFile); } catch (e) {}
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
 * Main executeCode entrypoint
 */
async function executeCode({ code, language = 'javascript', stdin = '' }) {
  const startTime = Date.now();
  const normLang = (language || 'javascript').toLowerCase().trim();

  // 1. Try Instant Local Compilation first
  try {
    const localRes = await runLocally({ code, language: normLang, stdin });
    return {
      ...localRes,
      executionTimeMs: Date.now() - startTime,
    };
  } catch (localErr) {
    console.warn(`[CodeExecution] Local run unavailable: ${localErr.message}. Trying remote sandbox...`);
  }

  // 2. Fallback to Wandbox remote sandbox
  const WANDBOX_COMPILERS = {
    c: 'gcc-head',
    cpp: 'gcc-head',
    'c++': 'gcc-head',
    python: 'cpython-3.12.7',
    py: 'cpython-3.12.7',
    javascript: 'nodejs-head',
    js: 'nodejs-head',
  };

  const compiler = WANDBOX_COMPILERS[normLang] || 'nodejs-head';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch('https://wandbox.org/api/compile.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ compiler, code: code || '', stdin: stdin || '' }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const result = await response.json();
      const elapsed = Date.now() - startTime;

      if (result.compiler_error && (!result.program_output && !result.program_message)) {
        return {
          success: false,
          isCompileError: true,
          language,
          output: `Compilation Error:\n${result.compiler_error}`,
          executionTimeMs: elapsed,
          provider: 'remote_compiler',
        };
      }

      const output = (result.program_output || result.program_message || result.compiler_message || '').trim();
      return {
        success: result.status === '0',
        language,
        output: output || '✓ Code executed with 0 errors.',
        exitCode: result.status,
        executionTimeMs: elapsed,
        provider: 'remote_compiler',
      };
    }
  } catch (remoteErr) {
    console.warn(`[CodeExecution] Remote sandbox unreachable: ${remoteErr.message}`);
  }

  // 3. Fallback to AI Simulation
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
