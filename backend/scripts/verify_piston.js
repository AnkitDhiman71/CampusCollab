const { executeCode } = require('../utils/codeExecutionService');

async function runTests() {
  console.log('========================================================');
  console.log('VERIFYING CAMPUSCARE PISTON CODE EXECUTION');
  console.log('========================================================\n');

  const tests = [
    {
      lang: 'python',
      name: 'Python 3',
      code: 'name = input()\nprint(f"Hello {name} from Python! 15 * 3 = {15 * 3}")',
      stdin: 'CampusCare Student',
    },
    {
      lang: 'cpp',
      name: 'C++',
      code: '#include <iostream>\n#include <string>\nint main() { std::string s; std::getline(std::cin, s); std::cout << "C++ Received: " << s << " | 100 + 200 = " << (100 + 200) << std::endl; return 0; }',
      stdin: 'Test Engineer',
    },
    {
      lang: 'c',
      name: 'C (GCC)',
      code: '#include <stdio.h>\nint main() { printf("Hello from C! 7 * 8 = %d\\n", 7 * 8); return 0; }',
      stdin: '',
    },
    {
      lang: 'java',
      name: 'Java',
      code: 'import java.util.Scanner;\npublic class Solution {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    String user = sc.hasNextLine() ? sc.nextLine() : "World";\n    System.out.println("Hello " + user + " from Java!");\n  }\n}',
      stdin: "Ankit\n",
    },
  ];

  for (const t of tests) {
    console.log(`[TESTING] ${t.name}...`);
    const start = Date.now();
    const res = await executeCode({
      code: t.code,
      language: t.lang,
      stdin: t.stdin,
    });
    const duration = Date.now() - start;

    if (res.success) {
      console.log(`✅ [PASS] ${t.name} (${duration}ms)`);
      console.log(`   Provider: ${res.provider}`);
      console.log(`   Output:   ${res.output.replace(/\n/g, ' ')}`);
      console.log(`   ExitCode: ${res.exitCode}\n`);
    } else {
      console.log(`❌ [FAIL] ${t.name} (${duration}ms)`);
      console.log(`   Error:    ${res.output}\n`);
    }
  }

  console.log('========================================================');
  console.log('VERIFICATION FINISHED');
  console.log('========================================================');
}

runTests();
