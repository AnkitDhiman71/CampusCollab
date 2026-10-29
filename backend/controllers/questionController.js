const Question = require('../models/questionModel');

const DEFAULT_QUESTIONS = [
  {
    name: 'DSA: Two Sum Target Pair',
    title: 'Two Sum: Find Target Index Pair',
    category: 'Algorithms & Arrays',
    difficulty: 'Easy',
    language: 'cpp',
    duration: 25,
    description: `Problem Statement:
Given an array of integers and an integer target, return the 0-based indices of the two numbers such that they add up to the target.
You may assume that each input would have exactly one solution, and you may not use the same element twice.

Input Format:
- Line 1: Two space-separated integers, n (number of elements) and target.
- Line 2: n space-separated integers representing the array elements.

Output Format:
- Print the two 0-based indices separated by a space (in increasing order).

Example:
Input:
4 9
2 7 11 15

Output:
0 1`,
    starterTemplates: {
      cpp: `#include <iostream>
#include <vector>
#include <unordered_map>

using namespace std;

int main() {
    int n, target;
    if (!(cin >> n >> target)) return 0;
    vector<int> nums(n);
    unordered_map<int, int> mp;
    int a = -1, b = -1;
    for (int i = 0; i < n; i++) {
        cin >> nums[i];
        int diff = target - nums[i];
        if (a == -1 && mp.count(diff)) {
            a = mp[diff];
            b = i;
        }
        mp[nums[i]] = i;
    }
    cout << a << " " << b << endl;
    return 0;
}
`,
      python: `import sys

def solve():
    tokens = sys.stdin.read().split()
    if not tokens:
        return
    n = int(tokens[0])
    target = int(tokens[1])
    nums = [int(x) for x in tokens[2:2+n]]
    lookup = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in lookup:
            print(f"{lookup[diff]} {i}")
            return
        lookup[num] = i

if __name__ == "__main__":
    solve()
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int target = sc.nextInt();
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < n; i++) {
            int num = sc.nextInt();
            int diff = target - num;
            if (map.containsKey(diff)) {
                System.out.println(map.get(diff) + " " + i);
                return;
            }
            map.put(num, i);
        }
    }
}
`,
      c: `#include <stdio.h>

int main() {
    int n, target;
    if (scanf("%d %d", &n, &target) != 2) return 0;
    int nums[1000];
    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);
    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            if (nums[i] + nums[j] == target) {
                printf("%d %d\\n", i, j);
                return 0;
            }
        }
    }
    return 0;
}
`,
      javascript: `const fs = require('fs');

function solve() {
    const tokens = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
    if (tokens.length < 3) return;
    const n = parseInt(tokens[0], 10);
    const target = parseInt(tokens[1], 10);
    const nums = tokens.slice(2, 2 + n).map(Number);
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const diff = target - nums[i];
        if (map.has(diff)) {
            console.log(map.get(diff) + " " + i);
            return;
        }
        map.set(nums[i], i);
    }
}

solve();
`,
    },
    starterCode: `#include <iostream>
#include <vector>
#include <unordered_map>

using namespace std;

int main() {
    int n, target;
    if (!(cin >> n >> target)) return 0;
    vector<int> nums(n);
    unordered_map<int, int> mp;
    int a = -1, b = -1;
    for (int i = 0; i < n; i++) {
        cin >> nums[i];
        int diff = target - nums[i];
        if (a == -1 && mp.count(diff)) {
            a = mp[diff];
            b = i;
        }
        mp[nums[i]] = i;
    }
    cout << a << " " << b << endl;
    return 0;
}
`,
    testCases: [
      {
        input: `4 9\n2 7 11 15`,
        expectedOutput: `0 1`,
        explanation: 'nums[0] + nums[1] = 2 + 7 = 9 at indices 0 and 1.',
      },
      {
        input: `3 6\n3 2 4`,
        expectedOutput: `1 2`,
        explanation: 'nums[1] + nums[2] = 2 + 4 = 6 at indices 1 and 2.',
      },
      {
        input: `2 6\n3 3`,
        expectedOutput: `0 1`,
        explanation: 'Equal elements at index 0 and 1 sum to 6.',
      },
      {
        input: `5 -8\n-1 -2 -3 -4 -5`,
        expectedOutput: `2 4`,
        explanation: 'Negative integers: (-3) + (-5) = -8 at indices 2 and 4.',
      },
      {
        input: `4 0\n0 4 3 0`,
        expectedOutput: `0 3`,
        explanation: 'Zero values at index 0 and 3 sum to 0.',
      },
    ],
  },
  {
    name: 'DSA: Array Minimum & Maximum',
    title: 'Find Minimum and Maximum in Array',
    category: 'Algorithms & Arrays',
    difficulty: 'Easy',
    language: 'cpp',
    duration: 20,
    description: `Problem Statement:
Given an array of integers, find the minimum and maximum elements in the array.
Operate with optimal O(n) time complexity.

Input Format:
- Line 1: An integer n representing the size of the array.
- Line 2: n space-separated integers representing the array.

Output Format:
- Print the result in the exact format: "Min: X, Max: Y"

Example:
Input:
5
34 12 89 5 67

Output:
Min: 5, Max: 89`,
    starterTemplates: {
      cpp: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    int n;
    if (!(cin >> n)) return 0;
    vector<int> arr(n);
    for (int i = 0; i < n; i++) cin >> arr[i];
    int minVal = *min_element(arr.begin(), arr.end());
    int maxVal = *max_element(arr.begin(), arr.end());
    cout << "Min: " << minVal << ", Max: " << maxVal << endl;
    return 0;
}
`,
      python: `import sys

def solve():
    tokens = sys.stdin.read().split()
    if not tokens:
        return
    n = int(tokens[0])
    arr = [int(x) for x in tokens[1:1+n]]
    print(f"Min: {min(arr)}, Max: {max(arr)}")

if __name__ == "__main__":
    solve()
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int min = Integer.MAX_VALUE;
        int max = Integer.MIN_VALUE;
        for (int i = 0; i < n; i++) {
            int x = sc.nextInt();
            if (x < min) min = x;
            if (x > max) max = x;
        }
        System.out.println("Min: " + min + ", Max: " + max);
    }
}
`,
      c: `#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    int min = 1000000000, max = -1000000000;
    for (int i = 0; i < n; i++) {
        int x;
        scanf("%d", &x);
        if (x < min) min = x;
        if (x > max) max = x;
    }
    printf("Min: %d, Max: %d\\n", min, max);
    return 0;
}
`,
      javascript: `const fs = require('fs');

function solve() {
    const tokens = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
    if (!tokens || tokens.length < 2) return;
    const n = parseInt(tokens[0], 10);
    const arr = tokens.slice(1, 1 + n).map(Number);
    console.log(\`Min: \${Math.min(...arr)}, Max: \${Math.max(...arr)}\`);
}

solve();
`,
    },
    starterCode: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    int n;
    if (!(cin >> n)) return 0;
    vector<int> arr(n);
    for (int i = 0; i < n; i++) cin >> arr[i];
    int minVal = *min_element(arr.begin(), arr.end());
    int maxVal = *max_element(arr.begin(), arr.end());
    cout << "Min: " << minVal << ", Max: " << maxVal << endl;
    return 0;
}
`,
    testCases: [
      {
        input: `5\n34 12 89 5 67`,
        expectedOutput: `Min: 5, Max: 89`,
        explanation: 'Standard array with positive numbers. Minimum is 5, maximum is 89.',
      },
      {
        input: `5\n-10 -3 -50 -1 -22`,
        expectedOutput: `Min: -50, Max: -1`,
        explanation: 'All negative values: minimum is -50, maximum is -1.',
      },
      {
        input: `1\n42`,
        expectedOutput: `Min: 42, Max: 42`,
        explanation: 'Single element boundary condition: min and max are identical.',
      },
      {
        input: `6\n7 0 7 -5 0 -5`,
        expectedOutput: `Min: -5, Max: 7`,
        explanation: 'Array with duplicate values, zeros, and negative numbers.',
      },
    ],
  },
  {
    name: 'DSA: Valid Palindrome Verification',
    title: 'Valid Palindrome: Two Pointers',
    category: 'Strings & Two Pointers',
    difficulty: 'Easy',
    language: 'cpp',
    duration: 20,
    description: `Problem Statement:
A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.
Given a string s, print "true" if it is a palindrome, or "false" otherwise.

Input Format:
- A single line containing string s.

Output Format:
- Print "true" or "false" (lowercase).

Example:
Input:
A man, a plan, a canal: Panama

Output:
true`,
    starterTemplates: {
      cpp: `#include <iostream>
#include <string>
#include <cctype>

using namespace std;

bool isPalindrome(const string& s) {
    string clean = "";
    for (char c : s) if (isalnum(c)) clean += tolower(c);
    int l = 0, r = (int)clean.size() - 1;
    while (l < r) {
        if (clean[l] != clean[r]) return false;
        l++; r--;
    }
    return true;
}

int main() {
    string s;
    if (getline(cin, s)) {
        cout << (isPalindrome(s) ? "true" : "false") << endl;
    }
    return 0;
}
`,
      python: `import sys

def solve():
    s = sys.stdin.read().strip()
    clean = "".join(ch.lower() for ch in s if ch.isalnum())
    print("true" if clean == clean[::-1] else "false")

if __name__ == "__main__":
    solve()
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.hasNextLine() ? sc.nextLine() : "";
        String clean = s.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
        int l = 0, r = clean.length() - 1;
        boolean pal = true;
        while (l < r) {
            if (clean.charAt(l) != clean.charAt(r)) {
                pal = false;
                break;
            }
            l++; r--;
        }
        System.out.println(pal ? "true" : "false");
    }
}
`,
      c: `#include <stdio.h>
#include <string.h>
#include <ctype.h>
#include <stdbool.h>

bool isPalindrome(const char* s) {
    int l = 0, r = strlen(s) - 1;
    while (l < r) {
        while (l < r && !isalnum((unsigned char)s[l])) l++;
        while (l < r && !isalnum((unsigned char)s[r])) r--;
        if (tolower((unsigned char)s[l]) != tolower((unsigned char)s[r])) return false;
        l++; r--;
    }
    return true;
}

int main() {
    char s[2048] = {0};
    if (fgets(s, sizeof(s), stdin)) {
        size_t len = strlen(s);
        if (len > 0 && s[len-1] == '\\n') s[len-1] = '\\0';
        printf("%s\\n", isPalindrome(s) ? "true" : "false");
    }
    return 0;
}
`,
      javascript: `const fs = require('fs');

function solve() {
    const s = fs.readFileSync(0, 'utf-8').trim();
    const clean = s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const isPal = clean === clean.split('').reverse().join('');
    console.log(isPal ? 'true' : 'false');
}

solve();
`,
    },
    starterCode: `#include <iostream>
#include <string>
#include <cctype>

using namespace std;

bool isPalindrome(const string& s) {
    string clean = "";
    for (char c : s) if (isalnum(c)) clean += tolower(c);
    int l = 0, r = (int)clean.size() - 1;
    while (l < r) {
        if (clean[l] != clean[r]) return false;
        l++; r--;
    }
    return true;
}

int main() {
    string s;
    if (getline(cin, s)) {
        cout << (isPalindrome(s) ? "true" : "false") << endl;
    }
    return 0;
}
`,
    testCases: [
      {
        input: `A man, a plan, a canal: Panama`,
        expectedOutput: `true`,
        explanation: 'Cleaned text "amanaplanacanalpanama" is symmetrical.',
      },
      {
        input: `race a car`,
        expectedOutput: `false`,
        explanation: 'Cleaned text "raceacar" is not a palindrome.',
      },
      {
        input: ` `,
        expectedOutput: `true`,
        explanation: 'Empty or whitespace string after normalization is a palindrome.',
      },
      {
        input: `0P`,
        expectedOutput: `false`,
        explanation: '"0p" != "p0".',
      },
      {
        input: `Madam, I'm Adam`,
        expectedOutput: `true`,
        explanation: '"madamimadam" is symmetrical.',
      },
    ],
  },
  {
    name: 'DSA: In-Place String Reversal',
    title: 'In-Place String Reversal',
    category: 'Strings & Pointers',
    difficulty: 'Easy',
    language: 'cpp',
    duration: 20,
    description: `Problem Statement:
Write a program that takes a string s and prints the reversed string.

Input Format:
- A single line containing the input string.

Output Format:
- Print the reversed string.

Example:
Input:
CampusCollab

Output:
balloCsupmaC`,
    starterTemplates: {
      cpp: `#include <iostream>
#include <string>
#include <algorithm>

using namespace std;

int main() {
    string s;
    if (getline(cin, s)) {
        reverse(s.begin(), s.end());
        cout << s << endl;
    }
    return 0;
}
`,
      python: `import sys

def solve():
    s = sys.stdin.read().strip()
    print(s[::-1])

if __name__ == "__main__":
    solve()
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.hasNextLine() ? sc.nextLine() : "";
        System.out.println(new StringBuilder(s).reverse().toString());
    }
}
`,
      c: `#include <stdio.h>
#include <string.h>

int main() {
    char s[2048] = {0};
    if (fgets(s, sizeof(s), stdin)) {
        size_t len = strlen(s);
        if (len > 0 && s[len-1] == '\\n') s[--len] = '\\0';
        int l = 0, r = len - 1;
        while (l < r) {
            char t = s[l];
            s[l] = s[r];
            s[r] = t;
            l++; r--;
        }
        printf("%s\\n", s);
    }
    return 0;
}
`,
      javascript: `const fs = require('fs');

function solve() {
    const s = fs.readFileSync(0, 'utf-8').trim();
    console.log(s.split('').reverse().join(''));
}

solve();
`,
    },
    starterCode: `#include <iostream>
#include <string>
#include <algorithm>

using namespace std;

int main() {
    string s;
    if (getline(cin, s)) {
        reverse(s.begin(), s.end());
        cout << s << endl;
    }
    return 0;
}
`,
    testCases: [
      {
        input: `CampusCollab`,
        expectedOutput: `balloCsupmaC`,
        explanation: 'Mixed case word reversed.',
      },
      {
        input: `hello`,
        expectedOutput: `olleh`,
        explanation: 'Odd length lowercase word.',
      },
      {
        input: `A`,
        expectedOutput: `A`,
        explanation: 'Single character unchanged.',
      },
      {
        input: `123456789`,
        expectedOutput: `987654321`,
        explanation: 'Digits reversed.',
      },
    ],
  },
  {
    name: 'DSA: Valid Parentheses Matching',
    title: 'Valid Parentheses: Stack Matching',
    category: 'Data Structures & Stack',
    difficulty: 'Medium',
    language: 'cpp',
    duration: 30,
    description: `Problem Statement:
Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.
An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

Input Format:
- A single line containing the bracket string s.

Output Format:
- Print "true" if the bracket string is valid, or "false" otherwise.

Example:
Input:
()[]{}

Output:
true`,
    starterTemplates: {
      cpp: `#include <iostream>
#include <stack>
#include <string>

using namespace std;

bool isValid(const string& s) {
    stack<char> st;
    for (char c : s) {
        if (c == '(' || c == '{' || c == '[') {
            st.push(c);
        } else {
            if (st.empty()) return false;
            char top = st.top();
            st.pop();
            if (c == ')' && top != '(') return false;
            if (c == '}' && top != '{') return false;
            if (c == ']' && top != '[') return false;
        }
    }
    return st.empty();
}

int main() {
    string s;
    if (cin >> s) {
        cout << (isValid(s) ? "true" : "false") << endl;
    }
    return 0;
}
`,
      python: `import sys

def solve():
    s = sys.stdin.read().strip()
    stack = []
    pairs = {')': '(', '}': '{', ']': '['}
    for c in s:
        if c in '({[':
            stack.append(c)
        elif c in ')}]':
            if not stack or stack[-1] != pairs[c]:
                print("false")
                return
            stack.pop()
    print("true" if not stack else "false")

if __name__ == "__main__":
    solve()
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.hasNext() ? sc.next() : "";
        Deque<Character> st = new ArrayDeque<>();
        boolean ok = true;
        for (char c : s.toCharArray()) {
            if (c == '(' || c == '{' || c == '[') {
                st.push(c);
            } else {
                if (st.isEmpty()) { ok = false; break; }
                char top = st.pop();
                if (c == ')' && top != '(') { ok = false; break; }
                if (c == '}' && top != '{') { ok = false; break; }
                if (c == ']' && top != '[') { ok = false; break; }
            }
        }
        System.out.println((ok && st.isEmpty()) ? "true" : "false");
    }
}
`,
      c: `#include <stdio.h>
#include <string.h>
#include <stdbool.h>

bool isValid(const char* s) {
    char stack[2048];
    int top = -1;
    for (int i = 0; s[i] != '\\0'; i++) {
        char c = s[i];
        if (c == '(' || c == '{' || c == '[') {
            stack[++top] = c;
        } else if (c == ')' || c == '}' || c == ']') {
            if (top < 0) return false;
            char t = stack[top--];
            if (c == ')' && t != '(') return false;
            if (c == '}' && t != '{') return false;
            if (c == ']' && t != '[') return false;
        }
    }
    return top == -1;
}

int main() {
    char s[2048] = {0};
    if (scanf("%s", s) == 1) {
        printf("%s\\n", isValid(s) ? "true" : "false");
    }
    return 0;
}
`,
      javascript: `const fs = require('fs');

function solve() {
    const s = fs.readFileSync(0, 'utf-8').trim();
    const stack = [];
    const pairs = { ')': '(', '}': '{', ']': '[' };
    for (const c of s) {
        if (c === '(' || c === '{' || c === '[') {
            stack.push(c);
        } else if (c === ')' || c === '}' || c === ']') {
            if (stack.length === 0 || stack[stack.length - 1] !== pairs[c]) {
                console.log('false');
                return;
            }
            stack.pop();
        }
    }
    console.log(stack.length === 0 ? 'true' : 'false');
}

solve();
`,
    },
    starterCode: `#include <iostream>
#include <stack>
#include <string>

using namespace std;

bool isValid(const string& s) {
    stack<char> st;
    for (char c : s) {
        if (c == '(' || c == '{' || c == '[') {
            st.push(c);
        } else {
            if (st.empty()) return false;
            char top = st.top();
            st.pop();
            if (c == ')' && top != '(') return false;
            if (c == '}' && top != '{') return false;
            if (c == ']' && top != '[') return false;
        }
    }
    return st.empty();
}

int main() {
    string s;
    if (cin >> s) {
        cout << (isValid(s) ? "true" : "false") << endl;
    }
    return 0;
}
`,
    testCases: [
      {
        input: `()`,
        expectedOutput: `true`,
        explanation: 'Simple valid parenthesis pair.',
      },
      {
        input: `()[]{}`,
        expectedOutput: `true`,
        explanation: 'Multiple sequential valid bracket pairs.',
      },
      {
        input: `(]`,
        expectedOutput: `false`,
        explanation: 'Mismatched closing bracket: round opened but square closed.',
      },
      {
        input: `([)]`,
        expectedOutput: `false`,
        explanation: 'Interleaved invalid nesting.',
      },
      {
        input: `{[]}`,
        expectedOutput: `true`,
        explanation: 'Properly nested brackets.',
      },
    ],
  },
  {
    name: 'DSA: Binary Search Lookup',
    title: 'Binary Search: Efficient Lookup',
    category: 'Algorithms & Divide and Conquer',
    difficulty: 'Easy',
    language: 'cpp',
    duration: 20,
    description: `Problem Statement:
Given a sorted array of n integers and a target value, write a function to search for the target in the array.
If the target exists, return its 0-based index. Otherwise, return -1.
You must write an algorithm with O(log n) runtime complexity using Binary Search.

Input Format:
- Line 1: Two space-separated integers, n (number of elements) and target.
- Line 2: n space-separated sorted integers.

Output Format:
- Print the index of target, or -1 if not found.

Example:
Input:
5 9
1 3 5 7 9

Output:
4`,
    starterTemplates: {
      cpp: `#include <iostream>
#include <vector>

using namespace std;

int main() {
    int n, target;
    if (!(cin >> n >> target)) return 0;
    vector<int> arr(n);
    for (int i = 0; i < n; i++) cin >> arr[i];
    int l = 0, r = n - 1, ans = -1;
    while (l <= r) {
        int mid = l + (r - l) / 2;
        if (arr[mid] == target) {
            ans = mid;
            break;
        } else if (arr[mid] < target) {
            l = mid + 1;
        } else {
            r = mid - 1;
        }
    }
    cout << ans << endl;
    return 0;
}
`,
      python: `import sys

def solve():
    tokens = sys.stdin.read().split()
    if not tokens:
        return
    n = int(tokens[0])
    target = int(tokens[1])
    arr = [int(x) for x in tokens[2:2+n]]
    low = 0
    high = n - 1
    ans = -1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            ans = mid
            break
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    print(ans)

if __name__ == "__main__":
    solve()
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int target = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
        int l = 0, r = n - 1, ans = -1;
        while (l <= r) {
            int mid = l + (r - l) / 2;
            if (arr[mid] == target) {
                ans = mid;
                break;
            } else if (arr[mid] < target) {
                l = mid + 1;
            } else {
                r = mid - 1;
            }
        }
        System.out.println(ans);
    }
}
`,
      c: `#include <stdio.h>

int main() {
    int n, target;
    if (scanf("%d %d", &n, &target) != 2) return 0;
    int arr[1000];
    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);
    int l = 0, r = n - 1, ans = -1;
    while (l <= r) {
        int mid = l + (r - l) / 2;
        if (arr[mid] == target) {
            ans = mid;
            break;
        } else if (arr[mid] < target) {
            l = mid + 1;
        } else {
            r = mid - 1;
        }
    }
    printf("%d\\n", ans);
    return 0;
}
`,
      javascript: `const fs = require('fs');

function solve() {
    const tokens = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
    if (tokens.length < 3) return;
    const n = parseInt(tokens[0], 10);
    const target = parseInt(tokens[1], 10);
    const arr = tokens.slice(2, 2 + n).map(Number);
    let l = 0, r = n - 1, ans = -1;
    while (l <= r) {
        const mid = Math.floor((l + r) / 2);
        if (arr[mid] === target) {
            ans = mid;
            break;
        } else if (arr[mid] < target) {
            l = mid + 1;
        } else {
            r = mid - 1;
        }
    }
    console.log(ans);
}

solve();
`,
    },
    starterCode: `#include <iostream>
#include <vector>

using namespace std;

int main() {
    int n, target;
    if (!(cin >> n >> target)) return 0;
    vector<int> arr(n);
    for (int i = 0; i < n; i++) cin >> arr[i];
    int l = 0, r = n - 1, ans = -1;
    while (l <= r) {
        int mid = l + (r - l) / 2;
        if (arr[mid] == target) {
            ans = mid;
            break;
        } else if (arr[mid] < target) {
            l = mid + 1;
        } else {
            r = mid - 1;
        }
    }
    cout << ans << endl;
    return 0;
}
`,
    testCases: [
      {
        input: `5 9\n1 3 5 7 9`,
        expectedOutput: `4`,
        explanation: '9 is found at index 4.',
      },
      {
        input: `6 2\n-1 0 2 5 9 12`,
        expectedOutput: `2`,
        explanation: '2 is found at index 2.',
      },
      {
        input: `5 4\n1 3 5 7 9`,
        expectedOutput: `-1`,
        explanation: '4 does not exist in the array, returns -1.',
      },
      {
        input: `1 10\n10`,
        expectedOutput: `0`,
        explanation: 'Single element array match at index 0.',
      },
      {
        input: `1 5\n10`,
        expectedOutput: `-1`,
        explanation: 'Single element mismatch returns -1.',
      },
    ],
  },
];

// Helper: Seed and sync initial questions into MongoDB if missing or outdated
const seedDefaultQuestionsIfNeeded = async () => {
  try {
    // Clean up obsolete non-DSA records
    await Question.deleteMany({
      name: {
        $in: [
          'Frontend: React State & Array Filter',
          'Async: Promise Queue / Retry Fetch',
          'Python: Word Frequency & Clean Text',
          'C++: Valid Palindrome & Two Pointers',
          'C: Reverse String & Pointers',
          'C: Array Min & Max Pointers',
          'Algorithm: Two Sum / Target Match',
        ],
      },
    });

    for (const q of DEFAULT_QUESTIONS) {
      const existing = await Question.findOne({ name: q.name });
      if (!existing) {
        await Question.create(q);
      } else {
        existing.title = q.title;
        existing.category = q.category;
        existing.difficulty = q.difficulty;
        existing.duration = q.duration;
        existing.description = q.description;
        existing.starterTemplates = q.starterTemplates;
        existing.starterCode = q.starterCode;
        existing.testCases = q.testCases;
        await existing.save();
      }
    }
  } catch (err) {
    console.warn('Note: Could not seed questions to MongoDB:', err.message);
  }
};

// GET /api/questions or /api/admin/questions
const getAllQuestions = async (req, res) => {
  try {
    await seedDefaultQuestionsIfNeeded();
    const questions = await Question.find().sort({ createdAt: 1 });
    return res.json({
      success: true,
      count: questions.length,
      questions,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/questions/:id
const getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }
    return res.json({ success: true, question });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/questions
const createQuestion = async (req, res) => {
  try {
    const {
      name,
      title,
      category,
      difficulty,
      language,
      duration,
      description,
      starterCode,
      starterTemplates,
      testCases,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Preset / display name is required.' });
    }
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Challenge title is required.' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Problem description and test instructions are required.' });
    }

    const newQuestion = await Question.create({
      name: name.trim(),
      title: title.trim(),
      category: (category && category.trim()) || 'Algorithms',
      difficulty: difficulty || 'Medium',
      language: language || 'cpp',
      duration: Number(duration) || 30,
      description: description.trim(),
      starterCode: starterCode || '',
      starterTemplates: starterTemplates || {},
      testCases: Array.isArray(testCases) ? testCases : [],
      createdBy: req.user ? req.user._id : null,
    });

    return res.status(201).json({
      success: true,
      message: 'Assessment question saved to database successfully!',
      question: newQuestion,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/questions/:id
const updateQuestion = async (req, res) => {
  try {
    const {
      name,
      title,
      category,
      difficulty,
      language,
      duration,
      description,
      starterCode,
      starterTemplates,
      testCases,
    } = req.body;

    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    if (name !== undefined) question.name = name.trim();
    if (title !== undefined) question.title = title.trim();
    if (category !== undefined) question.category = category.trim();
    if (difficulty !== undefined) question.difficulty = difficulty;
    if (language !== undefined) question.language = language;
    if (duration !== undefined) question.duration = Number(duration) || 30;
    if (description !== undefined) question.description = description.trim();
    if (starterCode !== undefined) question.starterCode = starterCode;
    if (starterTemplates !== undefined) question.starterTemplates = starterTemplates;
    if (testCases !== undefined && Array.isArray(testCases)) question.testCases = testCases;

    await question.save();

    return res.json({
      success: true,
      message: 'Question updated successfully!',
      question,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/questions/:id
const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    await Question.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      message: 'Question deleted successfully from database!',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  DEFAULT_QUESTIONS,
  seedDefaultQuestionsIfNeeded,
  getAllQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
};
