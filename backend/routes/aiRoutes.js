import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Settings from '../models/Settings.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Offline Fallback Data mapping trigger words to structured markdown
const OFFLINE_DATABASE = {
  binary_search: `### Understanding Binary Search (Offline Mode)

Binary Search is an efficient **divide-and-conquer** algorithm used to find the position of a target value within a **sorted array**. 

#### How it Works:
1. Compare the target value with the middle element of the array.
2. If the target matches the middle element, its position is returned.
3. If the target is less than the middle element, search the left half.
4. If the target is greater than the middle element, search the right half.

\`\`\`python
def binary_search(arr, target):
    low = 0
    high = len(arr) - 1
    
    while low <= high:
        mid = (low + high) // 2
        guess = arr[mid]
        if guess == target: return mid
        if guess > target: high = mid - 1
        else: low = mid + 1
    return -1
\`\`\`

#### Complexity Analysis:
| Metric | Complexity | Explanation |
| :--- | :--- | :--- |
| **Best Case Time** | $O(1)$ | Target is the middle element. |
| **Average Case Time** | $O(\\log N)$ | Search space halves each step. |
| **Worst Case Time** | $O(\\log N)$ | Reduces to 1 element. |
| **Space Complexity** | $O(1)$ | Iterative space usage. |
`,

  graph_theory_mcq: `Here are 5 custom multiple-choice questions on Graph Theory to test your understanding. You can complete them using the interactive widget below:

\`\`\`json-mcq
[
  {
    "question": "What is the maximum number of edges in a simple undirected graph with N vertices?",
    "options": ["N", "N * (N - 1)", "N * (N - 1) / 2", "2^N"],
    "answer": 2
  },
  {
    "question": "Which traversal uses a FIFO queue to explore nodes level-by-level?",
    "options": ["Depth-First Search (DFS)", "Breadth-First Search (BFS)", "In-order Traversal", "Dijkstra's Algorithm"],
    "answer": 1
  },
  {
    "question": "A connected graph with no cycles is defined as a:",
    "options": ["Clique", "Tree", "Bipartite Graph", "Complete Graph"],
    "answer": 1
  },
  {
    "question": "Which of the following algorithms is used to find the Minimum Spanning Tree (MST)?",
    "options": ["Dijkstra's Algorithm", "Bellman-Ford", "Kruskal's Algorithm", "Floyd-Warshall"],
    "answer": 2
  },
  {
    "question": "What is the time complexity of Dijkstra's algorithm implemented with a binary heap?",
    "options": ["O(V^2)", "O(E + V log V)", "O(V log V)", "O(E log V)"],
    "answer": 3
  }
]
\`\`\`
`,

  pdf_summary: `### Document Analysis & Summary
Based on the text content uploaded, I have processed the contents and generated this outline.

#### 📝 Executive Summary
The document serves as a study guide covering core aspects of searching mechanisms, indexing architectures, and database execution plans.

#### 💡 Key Takeaways
- **Efficiency Metrics**: Logarithmic complexity is critical for scalable data pipelines.
- **Indices**: B-Trees and Hash indices structure high-performance searching engines.
- **Binary Search Applicability**: Always requires sorted arrays. Pre-sorting overhead is only justified if search frequency is high.
`,

  default_plan: `### Study Plan: Master Data Structures (2-Week Schedule)

Here is a structured study roadmap optimized for your profile:

| Day | Topic | Objectives | Study Materials | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Days 1-3** | Complexity & Arrays | Understand Big-O notations, binary search, and list traversals. | CS-101 Module 2 | ⏳ Pending |
| **Days 4-7** | Stacks & Queues | Implement memory buffers, priority heaps. | CS-202 Module 1 | ⏳ Pending |
| **Days 8-11** | Trees & Traversals | Master Binary Search Trees, BFS level-order, and DFS node recursion. | CS-202 Trees Primer | ⏳ Pending |
| **Days 12-14** | Assessment Prep | Take mock exams, trace sorting pointer diagrams, review quiz notes. | Live Quizzes Area | ⏳ Pending |
`
};

const getOfflineResponse = (prompt) => {
  const clean = prompt.toLowerCase();
  if (clean.includes('binary search')) return OFFLINE_DATABASE.binary_search;
  if (clean.includes('mcq') || clean.includes('multiple choice') || clean.includes('quiz') || clean.includes('graph theory')) return OFFLINE_DATABASE.graph_theory_mcq;
  if (clean.includes('summarize') || clean.includes('pdf') || clean.includes('summary') || clean.includes('document')) return OFFLINE_DATABASE.pdf_summary;
  if (clean.includes('study plan') || clean.includes('plan') || clean.includes('schedule') || clean.includes('roadmap')) return OFFLINE_DATABASE.default_plan;
  
  return `### Aegis AI Tutor Agent (Offline Mode)

I am currently running in **Offline Fallback Mode**. To fetch live responses, please paste a valid **Gemini API Key** into the System Settings under the Super Admin portal!

#### Try one of these commands:
* **"Explain Binary Search"**
* **"Create 5 MCQs on Graph Theory"** (Renders an interactive quiz in the chat!)
* **"Summarize this PDF"**
* **"Create a study plan for Data Structures"**
`;
};

// @desc    Interact with Gemini AI Tutor
// @route   POST /api/ai/chat
// @access  Private
router.post('/chat', protect, async (req, res) => {
  const { prompt, fileText } = req.body;

  try {
    // Determine which API key to use (MongoDB setting override -> env fallback)
    const settings = await Settings.findOne({});
    const apiKey = (settings && settings.geminiApiKey) || process.env.GEMINI_API_KEY;

    let fullPrompt = prompt;
    if (fileText) {
      fullPrompt = `The student uploaded a document with content:\n"${fileText}"\n\nStudent prompt: ${prompt}`;
    }

    if (!apiKey || apiKey.trim() === '') {
      // Offline simulation fallback
      return res.json({ response: getOfflineResponse(fullPrompt) });
    }

    // Call Google Gemini API
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: `You are Aegis AI Tutor, an expert educational teaching assistant embedded inside a Learning Management System (LMS).
Your goal is to help students learn algorithms, code concepts, data structures, and manage studies.
Always explain concepts clearly and professionally using full Markdown formatting (headings, lists, code snippets, tables, etc.).

IMPORTANT MCQ FORMATTING RULES:
If the user asks you to create multiple-choice questions (MCQs), quizzes, or practice tests:
1. Provide a brief introduction.
2. In addition to any text explanation, you MUST provide the questions as a JSON code block with the language label "json-mcq" at the very end of your response.
3. The format of the "json-mcq" block MUST be a valid JSON array of objects, containing:
   - "question": string text
   - "options": array of 4 string options
   - "answer": integer index of the correct option (0-indexed)

Example structure of the JSON block:
\`\`\`json-mcq
[
  {
    "question": "What is the binary representation of 5?",
    "options": ["101", "110", "011", "111"],
    "answer": 0
  }
]
\`\`\`
Follow this format strictly so the application can render the quiz interactively.`
    });

    const result = await model.generateContent(fullPrompt);
    const responseText = result.response.text();
    
    res.json({ response: responseText });
  } catch (error) {
    console.error('Gemini API Error, falling back to mock:', error);
    res.json({ 
      response: `*(Failed to communicate with Gemini API: ${error.message}. Running offline fallback...)*\n\n` + getOfflineResponse(prompt) 
    });
  }
});

export default router;
