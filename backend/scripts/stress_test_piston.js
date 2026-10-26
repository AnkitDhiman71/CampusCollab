/**
 * Piston Code Execution Stress & Concurrency Benchmark for CampusCare
 * 
 * Simulates concurrent student code executions (e.g. 10, 50, 100, 150 students)
 * against your self-hosted Piston Docker container.
 * 
 * Usage:
 *   node backend/scripts/stress_test_piston.js [concurrency] [language]
 * 
 * Examples:
 *   node backend/scripts/stress_test_piston.js 20 python
 *   node backend/scripts/stress_test_piston.js 50 c
 *   node backend/scripts/stress_test_piston.js 150 mixed
 */

const { executeCode } = require('../utils/codeExecutionService');

const args = process.argv.slice(2);
const CONCURRENCY = parseInt(args[0], 10) || 20;
const TARGET_LANG = (args[1] || 'mixed').toLowerCase();

const SNIPPETS = {
  python: {
    lang: 'python',
    code: 'sum_val = sum(i * 2 for i in range(100))\nprint(f"Computed: {sum_val}")',
  },
  c: {
    lang: 'c',
    code: '#include <stdio.h>\nint main() { printf("C Result: %d\\n", 123 * 456); return 0; }',
  },
  cpp: {
    lang: 'cpp',
    code: '#include <iostream>\nint main() { std::cout << "C++ Result: " << (500 * 20) << std::endl; return 0; }',
  },
  java: {
    lang: 'java',
    code: 'public class Main { public static void main(String[] args) { System.out.println("Java OK: " + (100 * 100)); } }',
  },
};

const LANG_CHOICES = ['python', 'c', 'cpp', 'java'];

function getTestPayload(index) {
  if (TARGET_LANG !== 'mixed' && SNIPPETS[TARGET_LANG]) {
    return SNIPPETS[TARGET_LANG];
  }
  const chosen = LANG_CHOICES[index % LANG_CHOICES.length];
  return SNIPPETS[chosen];
}

async function runBenchmark() {
  console.log('================================================================');
  console.log(' CAMPUSCARE PISTON CONCURRENCY & STRESS TEST');
  console.log('================================================================');
  console.log(` • Simulated Concurrent Students: ${CONCURRENCY}`);
  console.log(` • Target Language:               ${TARGET_LANG.toUpperCase()}`);
  console.log(` • Engine URL:                    http://localhost:2000`);
  console.log('----------------------------------------------------------------');
  console.log(`Firing ${CONCURRENCY} simultaneous code executions in parallel...\n`);

  const wallStart = Date.now();
  const tasks = [];

  for (let i = 0; i < CONCURRENCY; i++) {
    const payload = getTestPayload(i);
    tasks.push(
      (async (studentId) => {
        const start = Date.now();
        try {
          const res = await executeCode({
            code: payload.code,
            language: payload.lang,
          });
          const latency = Date.now() - start;
          return {
            studentId,
            language: payload.lang,
            success: Boolean(res.success),
            latency,
            output: res.output,
            exitCode: res.exitCode,
            error: res.success ? null : res.output,
          };
        } catch (err) {
          return {
            studentId,
            language: payload.lang,
            success: false,
            latency: Date.now() - start,
            error: err.message,
          };
        }
      })(i + 1)
    );
  }

  const results = await Promise.all(tasks);
  const totalWallTime = (Date.now() - wallStart) / 1000;

  // Analytics
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);
  const latencies = results.map((r) => r.latency).sort((a, b) => a - b);

  const avgLatency = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(0);
  const minLatency = latencies[0];
  const maxLatency = latencies[latencies.length - 1];
  const p50 = latencies[Math.floor(latencies.length * 0.5)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || maxLatency;
  const throughput = (CONCURRENCY / totalWallTime).toFixed(2);

  console.log('================================================================');
  console.log(' BENCHMARK RESULTS');
  console.log('================================================================');
  console.log(` ✅ Successful Executions: ${successful.length} / ${CONCURRENCY} (${((successful.length / CONCURRENCY) * 100).toFixed(1)}%)`);
  if (failed.length > 0) {
    console.log(` ❌ Failed Executions:     ${failed.length} / ${CONCURRENCY}`);
    console.log(`    Sample Failure Reason: ${failed[0].error}`);
  }
  console.log('----------------------------------------------------------------');
  console.log(` ⏱️  Total Wall Time:       ${totalWallTime.toFixed(2)} seconds`);
  console.log(` ⚡ Throughput:            ${throughput} executions / second`);
  console.log(` 📊 Latency Statistics:`);
  console.log(`    • Min Latency:         ${minLatency} ms`);
  console.log(`    • Median (P50):        ${p50} ms`);
  console.log(`    • 95th Percentile:     ${p95} ms`);
  console.log(`    • Max Latency:         ${maxLatency} ms`);
  console.log(`    • Average Latency:     ${avgLatency} ms`);
  console.log('================================================================');

  if (successful.length === CONCURRENCY) {
    console.log('🎉 VERDICT: Piston handled all simultaneous student executions cleanly!');
  } else if (successful.length / CONCURRENCY >= 0.9) {
    console.log('⚠️ VERDICT: Handled >90% of requests. Minor timeout tuning recommended.');
  } else {
    console.log('⚠️ VERDICT: High queue depth. Scaling/container tuning needed for this concurrency.');
  }
}

runBenchmark();
