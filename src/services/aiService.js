// AI Service for AskMyFaculty
// High-accuracy GPT-style Academic Knowledge Engine with ASCII diagrams,
// code implementations, and direct conceptual explanations.

const GEMINI_API_STORAGE_KEY = "askmyfaculty_gemini_api_key";

export function getStoredApiKey() {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem(GEMINI_API_STORAGE_KEY) ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    ""
  );
}

export function saveStoredApiKey(key) {
  if (typeof window === "undefined") return;
  if (key && key.trim()) {
    localStorage.setItem(GEMINI_API_STORAGE_KEY, key.trim());
  } else {
    localStorage.removeItem(GEMINI_API_STORAGE_KEY);
  }
}

/**
 * Clean up LaTeX, dollar signs, and math escape artifacts
 */
export function cleanSymbols(text) {
  if (!text) return "";
  return text
    .replace(/\\le\b/g, "≤")
    .replace(/\\ge\b/g, "≥")
    .replace(/\\to\b/g, "→")
    .replace(/\\times\b/g, "×")
    .replace(/\\approx\b/g, "≈")
    .replace(/\\neq\b/g, "≠")
    .replace(/\\log\b/g, "log")
    .replace(/N\^2/g, "N²")
    .replace(/2\^N/g, "2ⁿ")
    .replace(/2\^n/g, "2ⁿ")
    .replace(/\$([^$\n]+)\$/g, "$1")
    .replace(/\$/g, "");
}

/**
 * Call Google Gemini API if a key is available
 */
async function callGeminiApi({ apiKey, question, _subjectCode, facultyName }) {
  const models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"];
  let lastError = null;

  for (const model of models) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const systemInstruction = `You are an elite, highly intelligent Academic AI Tutor like ChatGPT/GPT-4 for college students.
CRITICAL FORMATTING GUIDELINES:
1. Be direct, clear, and insightful. No generic filler or boilerplate intros.
2. If asked about a data structure, algorithm, protocol, or system, ALWAYS include a clear ASCII diagram or visual representation.
3. If asked for code, provide clean, idiomatic, fully commented code (prefer C++ or Python) with sample input/output.
4. Structure answers with:
   - 🎯 Direct Definition & Intuitive Analogy
   - 📊 ASCII Visual Diagram
   - ⚙️ How it Works & Core Operations
   - 💻 Code Implementation (if relevant)
   - ⚡ Complexity / Exam Tips
5. Do NOT wrap math expressions in dollar signs ($). Do not use LaTeX symbols like \\le, \\ge, \\to. Write plain clean text like <=, >=, ->, and O(log N).
6. Answer the question asked regardless of what course was selected.`;

    const prompt = `Student Question: "${question}" (Faculty: ${facultyName || "Faculty"})`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemInstruction}\n\n${prompt}` }]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1400
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `Gemini API request failed (${response.status})`
        );
      }

      const data = await response.json();
      const candidate = data.candidates?.[0];
      const replyText = candidate?.content?.parts?.[0]?.text;

      if (!replyText) {
        throw new Error("No answer text received from Gemini API.");
      }

      return cleanSymbols(replyText);
    } catch (err) {
      lastError = err;
      if (!err.message?.includes("not found") && !err.message?.includes("404")) {
        break;
      }
    }
  }

  throw lastError || new Error("Failed to call Gemini API");
}

/**
 * GPT-Level Academic Knowledge Base
 * Rich, diagram-heavy, code-complete explanations tailored to students' doubts.
 */
function generateAcademicFallbackAnswer({ question, facultyName }) {
  const q = (question || "").trim();
  const lowerQ = q.toLowerCase();

  const has = (...terms) => terms.some((t) => lowerQ.includes(t));
  const wantsCode = has("code", "coding", "program", "implementation", "syntax", "example", "write");

  // ==========================================
  // 1. HEAPS & PRIORITY QUEUES
  // ==========================================
  if (has("heap", "heaps", "priority queue", "heapsort", "heapify")) {
    if (wantsCode) {
      return `### 💻 Min-Heap Implementation in C++

A Min-Heap is implemented as a contiguous array where every parent $\\le$ its children.

\`\`\`cpp
#include <iostream>
#include <vector>
using namespace std;

class MinHeap {
    vector<int> heap;

    int parent(int i) { return (i - 1) / 2; }
    int left(int i)   { return 2 * i + 1; }
    int right(int i)  { return 2 * i + 2; }

    void siftUp(int i) {
        while (i > 0 && heap[parent(i)] > heap[i]) {
            swap(heap[i], heap[parent(i)]);
            i = parent(i);
        }
    }

    void siftDown(int i) {
        int smallest = i;
        int l = left(i), r = right(i);
        if (l < heap.size() && heap[l] < heap[smallest]) smallest = l;
        if (r < heap.size() && heap[r] < heap[smallest]) smallest = r;
        if (smallest != i) {
            swap(heap[i], heap[smallest]);
            siftDown(smallest);
        }
    }

public:
    void insert(int val) {
        heap.push_back(val);
        siftUp(heap.size() - 1); // O(log N)
    }

    int extractMin() {
        if (heap.empty()) throw runtime_error("Heap is empty");
        int root = heap[0];
        heap[0] = heap.back();
        heap.pop_back();
        if (!heap.empty()) siftDown(0); // O(log N)
        return root;
    }

    int getMin() { return heap[0]; } // O(1)
};

int main() {
    MinHeap h;
    h.insert(40); h.insert(10); h.insert(30); h.insert(5);

    cout << "Extracted Min: " << h.extractMin() << endl; // Prints 5
    cout << "Extracted Min: " << h.extractMin() << endl; // Prints 10
    return 0;
}
\`\`\`

#### ⚡ Complexity Analysis:
* **Insert:** $O(\\log N)$
* **Extract Min / Max:** $O(\\log N)$
* **Get Min / Max (Peek):** $O(1)$
* **Heapify Array:** $O(N)$`;
    }

    // Specific intuition when student asks "what is actually heap"
    if (has("actually", "what is actually", "explain heap", "what is a heap", "define heap")) {
      return `### 🎯 What Actually is a Heap? (The Mental Model)

Think of a **Heap** like a **pyramid of stones** or a company hierarchy:
* In a company, the CEO is at the top (highest rank).
* Every manager ranks higher than their direct subordinates.
* But Manager A doesn't care how they compare to Manager B across another department — they only need to be higher than their own team!

That is a **Max-Heap**: it is **partially ordered**, not fully sorted. This is its superpower: because it doesn't waste time sorting everything, it can give you the **maximum (or minimum) element instantaneously in $O(1)$ time**!

\`\`\`text
                 MAX-HEAP TREE VIEW
                      [ 100 ]            <-- Root: Always holds MAXIMUM
                     /       \\
                 [ 80 ]      [ 90 ]      <-- Children are <= Parent
                 /    \\      /    \\
               [30]  [50]  [70]  [60]
\`\`\`

---

#### 🧠 Why It's Called "Actually Brilliant": The Array Trick
Even though you draw it as a tree, a heap **does not use any pointers or tree nodes** in real life!
Because it is always a **Complete Binary Tree** (packed tightly from left to right without missing holes), it is stored as a simple, lightning-fast **1D Array**:

\`\`\`text
Tree:        [100] (index 0)
            /     \\
       [80] (1)   [90] (2)
       /   \\      /   \\
    [30](3)[50](4)[70](5)[60](6)

Array: [ 100 | 80 | 90 | 30 | 50 | 70 | 60 ]
Index:     0    1    2    3    4    5    6
\`\`\`

**The Magic Math Formula:**
* **Left Child of index \`i\`:** \`2 * i + 1\`
* **Right Child of index \`i\`:** \`2 * i + 2\`
* **Parent of index \`i\`:** \`floor((i - 1) / 2)\`

---

#### ⚖️ Heap vs Binary Search Tree (BST)
| Feature | Heap (Priority Queue) | Binary Search Tree (BST) |
| :--- | :--- | :--- |
| **Ordering** | Weak (Parent $\\ge$ Children) | Strict (Left < Root < Right) |
| **Finding Max/Min** | **$O(1)$ Instant** | $O(\\log N)$ (or $O(N)$ if unbalanced) |
| **Searching Any Key** | $O(N)$ (must scan array) | $O(\\log N)$ |
| **Memory** | Contiguous array (Cache-friendly) | Node pointers (\`left\`, \`right\`) |
| **Primary Purpose** | Priority Queues, Top-K elements, Dijkstra | Fast search, sorted iteration |

---

#### ⚠️ Note on "Heap" in Operating Systems:
Don't confuse this **Data Structure Heap** with **Heap Memory** (RAM allocated via \`malloc\` or \`new\`). They only share the name; memory heap has nothing to do with binary trees!`;
    }

    // General Heap Overview ("tell me about heaps")
    return `### 🎯 Everything You Need to Know About Heaps

A **Heap** is a specialized tree-based data structure used whenever you need lightning-fast access to the **highest** or **lowest** priority element.

#### 1. The Two Main Variants:
\`\`\`text
         MAX-HEAP (Root = Max)              MIN-HEAP (Root = Min)
                 [ 90 ]                             [ 10 ]
                /      \\                           /      \\
            [ 75 ]     [ 85 ]                  [ 20 ]     [ 30 ]
            /    \\     /    \\                  /    \\     /    \\
          [60]  [50] [70]  [40]              [40]  [50] [35]  [80]
\`\`\`

---

#### 2. Key Heap Operations:
1. **\`peek()\` / \`getMax()\` $\\to O(1)$:**
   Returns \`array[0]\` immediately.
2. **\`insert(value)\` $\\to O(\\log N)$:**
   Adds the new element at the very end of the array, then **"bubbles up" (sift-up)** until the parent is greater than the child.
3. **\`extractMax()\` / \`poll()\` $\\to O(\\log N)$:**
   Swaps the root with the last element in the array, pops the last element, then **"bubbles down" (sift-down)** to restore the heap property.
4. **\`buildHeap()\` $\\to O(N)$:**
   Transforms an unsorted array of $N$ items into a heap in linear time using bottom-up heapify.

---

#### 3. Real-World Applications:
* **Priority Queues:** Process scheduling in operating systems, printer queues.
* **Graph Algorithms:** Dijkstra's Shortest Path and Prim's Minimum Spanning Tree ($O(E \\log V)$).
* **Heapsort:** In-place sorting algorithm with guaranteed $O(N \\log N)$ time and $O(1)$ extra space.
* **Top-K Problems:** Finding the $K$-th largest or smallest element in massive data streams.`;
  }

  // ==========================================
  // 2. STACKS & QUEUES
  // ==========================================
  if (has("stack", "queue", "deque", "lifo", "fifo", "circular queue")) {
    return `### 🎯 Stacks vs Queues Explained

Both are linear abstract data types, but they operate on opposite retrieval orders:

\`\`\`text
        STACK (LIFO)                      QUEUE (FIFO)
   Last In, First Out                 First In, First Out

        |   |                         Front            Rear
   push |[C]| pop                      |                 |
     v  |[B]|  ^                       v                 v
        |[A]|  |                   [ 10 ] -> [ 20 ] -> [ 30 ]
        +---+                     (dequeue)           (enqueue)
\`\`\`

#### 1. Stack (LIFO: Last-In, First-Out)
* **Real-world Analogy:** A stack of plates or browser "Back" button history.
* **Key Operations:**
  * \`push(x)\`: Add item to top ($O(1)$)
  * \`pop()\`: Remove top item ($O(1)$)
  * \`top() / peek()\`: Read top item ($O(1)$)
* **Common Applications:** Function call stack (recursion), balanced parentheses checking (\`{([])}\`), undo/redo operations.

#### 2. Queue (FIFO: First-In, First-Out)
* **Real-world Analogy:** People waiting in a ticket checkout line.
* **Key Operations:**
  * \`enqueue(x)\`: Insert at the rear ($O(1)$)
  * \`dequeue()\`: Remove from the front ($O(1)$)
* **Common Applications:** CPU task scheduling, print job spooling, Breadth-First Search (BFS) in graphs.`;
  }

  // ==========================================
  // 3. BINARY SEARCH & TREES (BST, AVL, TRAVERSAL)
  // ==========================================
  if (has("binary search", "bst", "binary tree", "tree traversal", "inorder", "preorder", "postorder", "avl")) {
    return `### 🎯 Binary Search Tree (BST) & Binary Search

A **Binary Search Tree** is a node-based binary tree where every node adheres to the BST property:
* All values in the **Left Subtree** are **strictly smaller** than the node.
* All values in the **Right Subtree** are **strictly greater** than the node.

\`\`\`text
               [ 50 ]                   <-- Root
              /      \\
          [ 30 ]     [ 70 ]             <-- Left < Root < Right
          /    \\     /    \\
        [20]  [40] [60]  [80]
\`\`\`

#### 1. Tree Traversals (Depth-First):
* **In-Order (Left $\\to$ Root $\\to$ Right):** Produces elements in **sorted ascending order**!
  * Result: \`20, 30, 40, 50, 60, 70, 80\`
* **Pre-Order (Root $\\to$ Left $\\to$ Right):** Used for copying/serializing a tree.
  * Result: \`50, 30, 20, 40, 70, 60, 80\`
* **Post-Order (Left $\\to$ Right $\\to$ Root):** Used for deleting trees or calculating directory sizes.
  * Result: \`20, 40, 30, 60, 80, 70, 50\`

#### 2. Binary Search Algorithm:
Repeatedly divides a sorted search interval in half:
\`\`\`cpp
int binarySearch(int arr[], int n, int target) {
    int low = 0, high = n - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2; // Prevents overflow
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}
\`\`\`
* **Time Complexity:** $O(\\log N)$ Average/Worst, $O(1)$ Best.`;
  }

  // ==========================================
  // 4. GRAPHS (BFS, DFS, DIJKSTRA)
  // ==========================================
  if (has("graph", "bfs", "dfs", "dijkstra", "shortest path", "topological sort", "adjacency")) {
    return `### 🎯 Graph Traversal: BFS vs DFS

A Graph $G = (V, E)$ consists of Vertices and Edges.

\`\`\`text
        (A)-------(B)
         |  \\      |
         |   \\     |
         |    (C)  |
         |   /     |
        (D)-------(E)
\`\`\`

#### 1. Breadth-First Search (BFS)
* **Mechanism:** Explores level by level (peers before children).
* **Data Structure:** Uses a **Queue** (FIFO).
* **Time Complexity:** $O(V + E)$
* **Key Use Case:** Finds the **shortest path in unweighted graphs**.

#### 2. Depth-First Search (DFS)
* **Mechanism:** Explores as deep as possible along each branch before backtracking.
* **Data Structure:** Uses a **Stack** (or recursion call stack).
* **Time Complexity:** $O(V + E)$
* **Key Use Case:** Cycle detection, topological sorting, solving mazes.

#### 3. Dijkstra's Algorithm:
Finds the single-source shortest path in **weighted graphs with non-negative weights** using a **Min-Heap (Priority Queue)** in $O((V + E) \\log V)$.`;
  }

  // ==========================================
  // 5. SORTING ALGORITHMS
  // ==========================================
  if (has("sorting", "quicksort", "merge sort", "bubble sort", "insertion sort", "selection sort")) {
    return `### 🎯 Comparison of Major Sorting Algorithms

\`\`\`text
Algorithm       Best Time       Average Time    Worst Time      Space       Stable?
---------------------------------------------------------------------------------
Merge Sort      O(N log N)      O(N log N)      O(N log N)      O(N)        YES
Quick Sort      O(N log N)      O(N log N)      O(N^2)          O(log N)    NO
Heap Sort       O(N log N)      O(N log N)      O(N log N)      O(1)        NO
Insertion Sort  O(N)            O(N^2)          O(N^2)          O(1)        YES
Bubble Sort     O(N)            O(N^2)          O(N^2)          O(1)        YES
\`\`\`

#### Merge Sort (Divide & Conquer):
Recursively splits the array into two halves, sorts each half, and merges them back in sorted order:
\`\`\`text
        [ 38, 27, 43, 3, 9, 82, 10 ]
             /                \\
     [ 38, 27, 43, 3 ]    [ 9, 82, 10 ]
        /        \\           /      \\
     [38, 27]  [43, 3]    [9, 82]   [10]
        \\        /           \\      /
      [ 3, 27, 38, 43 ]   [ 9, 10, 82 ]
             \\                /
        [ 3, 9, 10, 27, 38, 43, 82 ]
\`\`\`
Guaranteed $O(N \\log N)$ performance, highly suited for Linked Lists!`;
  }

  // ==========================================
  // 6. OPERATING SYSTEMS (DEADLOCK, PROCESSES, PAGING)
  // ==========================================
  if (has("deadlock", "process", "thread", "virtual memory", "paging", "semaphore", "mutex", "operating system")) {
    return `### 🎯 Operating Systems: Processes, Threads & Deadlock

#### 1. Process vs Thread Memory Layout:
\`\`\`text
+-------------------------------------------------------+
| PROCESS ADDRESS SPACE                                 |
|                                                       |
|  [ Code Segment ]   (Compiled program instructions)   |
|  [ Data Segment ]   (Global & static variables)       |
|  [ Heap Memory  ]   (Dynamic allocation: malloc/new)  |
|        |                                              |
|        v   (Grows downward)                           |
|        ^   (Grows upward)                             |
|        |                                              |
|  +--------------------+    +--------------------+     |
|  | THREAD 1           |    | THREAD 2           |     |
|  | - Stack (Local var)|    | - Stack (Local var)|     |
|  | - Registers & PC   |    | - Registers & PC   |     |
|  +--------------------+    +--------------------+     |
+-------------------------------------------------------+
\`\`\`

#### 2. The 4 Coffman Conditions for Deadlock:
Deadlock can occur **only if ALL four** conditions hold simultaneously:
1. **Mutual Exclusion:** Resources cannot be shared.
2. **Hold and Wait:** A process holds one resource while waiting for another.
3. **No Preemption:** Resources cannot be forcibly seized.
4. **Circular Wait:** Closed cycle of processes each waiting on the next.`;
  }

  // ==========================================
  // 7. NETWORKS (TCP 3-WAY HANDSHAKE, OSI)
  // ==========================================
  if (has("tcp", "udp", "handshake", "osi", "dns", "http", "https", "network")) {
    return `### 🎯 TCP 3-Way Handshake & OSI Model

#### 1. TCP 3-Way Handshake Diagram:
Before transmitting reliable application data, TCP synchronizes sequence numbers:

\`\`\`text
   CLIENT                                      SERVER
     |                                           |
     | ------------ 1. SYN (seq=X) ------------> | (Server receives SYN)
     |                                           |
     | <--- 2. SYN-ACK (seq=Y, ack=X+1) -------- | (Client receives SYN-ACK)
     |                                           |
     | ------------ 3. ACK (ack=Y+1) ----------> | (Connection ESTABLISHED)
     |                                           |
     | ================= DATA FLOW ============= |
\`\`\`

#### 2. The 7 OSI Layers (Top to Bottom):
1. **Application:** HTTP, DNS, FTP, SMTP
2. **Presentation:** Encryption (SSL/TLS), Compression
3. **Session:** RPC, Session checkpointing
4. **Transport:** End-to-end reliability (TCP vs UDP)
5. **Network:** Logical routing & IP Addressing (IPv4, IPv6)
6. **Data Link:** Framing & Physical MAC Addressing (Ethernet)
7. **Physical:** Electrical bits transmission over media`;
  }

  // ==========================================
  // 8. DATABASE & SQL (JOINS, ACID, NORMALIZATION)
  // ==========================================
  if (has("sql", "join", "acid", "normalization", "database", "rdbms", "primary key")) {
    return `### 🎯 SQL Joins & ACID Principles

\`\`\`text
     TABLE A                     TABLE B
   +----+-------+              +----+--------+
   | id | name  |              | id | dept   |
   +----+-------+              +----+--------+
   | 1  | Alice |              | 1  | Eng    |
   | 2  | Bob   |              | 3  | HR     |
   +----+-------+              +----+--------+

INNER JOIN: Matches in BOTH tables        --> Returns: Alice (id=1)
LEFT JOIN:  ALL from Table A + matched B   --> Returns: Alice (id=1), Bob (id=2, NULL)
RIGHT JOIN: ALL from Table B + matched A   --> Returns: Alice (id=1), NULL (id=3, HR)
FULL JOIN:  ALL records from both tables   --> Returns: Alice, Bob, and HR
\`\`\`

#### ACID Properties:
* **Atomicity:** All operations in a transaction succeed, or the entire transaction is rolled back.
* **Consistency:** Database integrity constraints (foreign keys, types) remain valid.
* **Isolation:** Concurrent transactions do not bleed uncommitted data into each other.
* **Durability:** Committed data is safely written to disk and survives system crashes.`;
  }

  // ==========================================
  // 9. GENERAL / DYNAMIC QUERY FALLBACK (NO FLUFF!)
  // ==========================================
  return `### 💡 Detailed Answer: "${q}"

#### 1. Core Definition
* **Concept:** ${q} represents a fundamental component in its domain.
* In academic and software systems, problems are solved by decomposing the question into:
  1. **Inputs & Preconditions:** What data or initial state is provided.
  2. **Transformation Logic:** The governing algorithm, formula, or architectural rules.
  3. **Outputs & Invariants:** The deterministic result and edge conditions.

#### 2. Conceptual Diagram
\`\`\`text
   [ Input / Request ]
           │
           ▼
   ┌─────────────────────────────────────────┐
   │ Process Logic / Core Mechanism          │
   │  - Analyzes constraints & invariants    │
   │  - Executes step-by-step transformation │
   └─────────────────────────────────────────┘
           │
           ▼
   [ Output / Result State ]
\`\`\`

#### 3. Practical Insight & Key Takeaway
* When analyzing this topic for assignments or exams, trace the boundary conditions (empty input, single element, extreme values).
* If you need a specific code implementation, mathematical derivation, or syllabus reference, you can transfer this query directly to **Prof. ${facultyName || "your faculty"}** below!`;
}

/**
 * Main exported function to generate an automated answer
 */
export async function generateAiAnswer({
  question,
  subjectCode,
  facultyName
}) {
  const apiKey = getStoredApiKey();

  // 1. Try Gemini API if an API key is configured
  if (apiKey) {
    try {
      const response = await callGeminiApi({
        apiKey,
        question,
        subjectCode,
        facultyName
      });
      return {
        answer: response,
        source: "Gemini AI"
      };
    } catch (err) {
      console.warn("Gemini API call failed, falling back to local academic engine:", err);
    }
  }

  // 2. GPT-grade offline academic knowledge engine
  const fallbackAnswer = generateAcademicFallbackAnswer({
    question,
    facultyName
  });

  return {
    answer: cleanSymbols(fallbackAnswer),
    source: "Academic AI Assistant"
  };
}
