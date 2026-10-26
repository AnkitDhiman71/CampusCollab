const Question = require('../models/questionModel');

const DEFAULT_QUESTIONS = [
  {
    name: 'Frontend: React State & Array Filter',
    title: 'React & JS: State Filter & Transformation',
    category: 'Frontend',
    difficulty: 'Medium',
    language: 'javascript',
    duration: 30,
    description: `Problem Statement:
You are building an active filter for a student talent directory.
Implement a function filterCandidates(candidates, filterCriteria) that:
1. Takes an array of student objects: { name: string, skills: string[], rankingPoints: number, isAvailable: boolean }
2. Filters for candidates where isAvailable === true AND rankingPoints >= filterCriteria.minPoints
3. If filterCriteria.requiredSkill is provided, the candidate's skills array must include that skill (case-insensitive).
4. Returns the filtered list sorted in descending order of rankingPoints.

Sample Input:
const candidates = [
  { name: 'Alice', skills: ['React', 'Node'], rankingPoints: 850, isAvailable: true },
  { name: 'Bob', skills: ['Python'], rankingPoints: 920, isAvailable: false },
  { name: 'Charlie', skills: ['React', 'TypeScript'], rankingPoints: 780, isAvailable: true }
];

filterCandidates(candidates, { minPoints: 700, requiredSkill: 'React' });

Expected Output:
[
  { name: 'Alice', ... },
  { name: 'Charlie', ... }
]`,
    starterCode: `function filterCandidates(candidates, filterCriteria) {
  // Write your code here
  
}

// Test cases below
const testCandidates = [
  { name: 'Alice', skills: ['React', 'Node'], rankingPoints: 850, isAvailable: true },
  { name: 'Bob', skills: ['Python'], rankingPoints: 920, isAvailable: false },
  { name: 'Charlie', skills: ['React', 'TypeScript'], rankingPoints: 780, isAvailable: true }
];

console.log(filterCandidates(testCandidates, { minPoints: 700, requiredSkill: 'React' }));
`,
  },
  {
    name: 'Algorithm: Two Sum / Target Match',
    title: 'Data Structures: Two Sum Index Pair',
    category: 'Algorithms',
    difficulty: 'Easy',
    language: 'javascript',
    duration: 20,
    description: `Problem Statement:
Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.
You may assume that each input would have exactly one solution, and you may not use the same element twice.
Aim for O(n) time complexity using a Hash Map / Object.

Example:
Input: nums = [2, 7, 11, 15], target = 9
Output: [0, 1] (because nums[0] + nums[1] === 9)

Input: nums = [3, 2, 4], target = 6
Output: [1, 2]`,
    starterCode: `function twoSum(nums, target) {
  // Your O(n) solution here
  
}

console.log('Test 1:', twoSum([2, 7, 11, 15], 9)); // Expected: [0, 1]
console.log('Test 2:', twoSum([3, 2, 4], 6));       // Expected: [1, 2]
`,
  },
  {
    name: 'Async: Promise Queue / Retry Fetch',
    title: 'Async JavaScript: Retry Function with Backoff',
    category: 'Async & APIs',
    difficulty: 'Medium',
    language: 'javascript',
    duration: 35,
    description: `Problem Statement:
Implement an async utility function retryWithBackoff(fn, maxRetries, delayMs).
It executes an asynchronous function fn:
1. If fn succeeds, it resolves with the result.
2. If fn throws an error, it waits delayMs milliseconds and retries up to maxRetries times.
3. If all attempts fail, it rejects with the last encountered error.

Write the function and test it below.`,
    starterCode: `async function retryWithBackoff(fn, maxRetries = 3, delayMs = 500) {
  // Your retry implementation here
  
}

// Simulated unstable API
let attempt = 0;
async function fetchMockData() {
  attempt++;
  if (attempt < 3) throw new Error('Network timeout on attempt ' + attempt);
  return { status: 200, data: 'CampusCare API Ready' };
}

retryWithBackoff(fetchMockData, 3, 200)
  .then(res => console.log('Success:', res))
  .catch(err => console.error('Failed after retries:', err.message));
`,
  },
  {
    name: 'Python: Word Frequency & Clean Text',
    title: 'Python: Word Counter & Frequency Analysis',
    category: 'Data Processing',
    difficulty: 'Easy',
    language: 'python',
    duration: 25,
    description: `Problem Statement:
Implement a function count_word_frequency(sentence) in Python that:
1. Cleans the text by removing punctuation (periods, commas, exclamation marks).
2. Converts all words to lowercase.
3. Returns a dictionary mapping each word to the number of occurrences.

Example:
Input: "The quick brown fox jumps over the lazy dog."
Output: {'the': 2, 'quick': 1, 'brown': 1, 'fox': 1, 'jumps': 1, 'over': 1, 'lazy': 1, 'dog': 1}`,
    starterCode: `import string

def count_word_frequency(sentence):
    # Your code here
    pass

text = "The quick brown fox jumps over the lazy dog."
print(count_word_frequency(text))
`,
  },
  {
    name: 'C++: Valid Palindrome & Two Pointers',
    title: 'C++: Efficient Two-Pointer Palindrome Verification',
    category: 'Algorithms',
    difficulty: 'Easy',
    language: 'cpp',
    duration: 20,
    description: `Problem Statement:
A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.
Alphanumeric characters include letters and numbers.
Given a string s, return true if it is a palindrome, or false otherwise.

Example:
Input: s = "A man, a plan, a canal: Panama"
Output: true (Explanation: "amanaplanacanalpanama" is a palindrome)`,
    starterCode: `#include <iostream>
#include <string>
#include <cctype>

bool isPalindrome(std::string s) {
    // Your code here
    return true;
}

int main() {
    std::string s1 = "A man, a plan, a canal: Panama";
    std::cout << "Test 1: " << (isPalindrome(s1) ? "true" : "false") << std::endl;
    return 0;
}
`,
  },
  {
    name: 'C: Reverse String & Pointers',
    title: 'C (GCC): In-Place String Reversal with Pointers',
    category: 'Algorithms',
    difficulty: 'Easy',
    language: 'c',
    duration: 20,
    description: `Problem Statement:
Write a C function void reverseString(char* s) that reverses a null-terminated string in-place using two pointers.
Do not allocate another array for the reverse string. You must do this by modifying the input array in-place with O(1) extra memory.

Example:
Input: "campus"
Output: "supmac"`,
    starterCode: `#include <stdio.h>
#include <string.h>

void reverseString(char* s) {
    // Write your in-place pointer reversal here
    
}

int main() {
    char str[] = "CampusCollab";
    printf("Original: %s\\n", str);
    reverseString(str);
    printf("Reversed: %s\\n", str);
    return 0;
}
`,
  },
];

// Helper: Seed and sync initial questions into MongoDB if missing
const seedDefaultQuestionsIfNeeded = async () => {
  for (const q of DEFAULT_QUESTIONS) {
    await Question.findOneAndUpdate(
      { name: q.name },
      { $setOnInsert: q },
      { upsert: true, new: true }
    );
  }
};

// GET /api/questions or /api/admin/questions
const getAllQuestions = async (req, res) => {
  try {
    await seedDefaultQuestionsIfNeeded();
    const questions = await Question.find().sort({ createdAt: -1 });
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
      category: (category && category.trim()) || 'General',
      difficulty: difficulty || 'Medium',
      language: language || 'javascript',
      duration: Number(duration) || 30,
      description: description.trim(),
      starterCode: starterCode || '',
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
