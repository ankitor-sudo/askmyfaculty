export const subjectFaculty = [
  {
    code: "CSE202",
    name: "OOPs",
    faculty: ["Anshu Kumar Singh", "Dr. Robin Kumar"]
  },
  {
    code: "CSE205",
    name: "DSA",
    faculty: ["Anshu Kumar Singh", "Deepak Kumar"]
  },
  {
    code: "CSE306",
    name: "Computer Networks",
    faculty: ["Aman Rao", "Mohammad Sohel"]
  },
  {
    code: "INT335",
    name: "Design Thinking",
    faculty: ["Dr. Anuj Sharma", "Ravinder Singh"]
  },
  {
    code: "MTH401",
    name: "Discrete Mathematics",
    faculty: ["Dr. Bikram Singh", "Dr. Manpreet Kaur"]
  },
  {
    code: "PEL132",
    name: "Communication Skills",
    faculty: ["Divya Divu", "Nirmal Kaur"]
  },
  {
    code: "CSE423",
    name: "Virtualization and Cloud Computing",
    faculty: ["Bharat Sharma", "Pushpendra Pandey"]
  }
];

export const allFaculty = Array.from(
  new Set(subjectFaculty.flatMap(s => s.faculty))
).sort();

export function getSubjectsForFaculty(facultyName) {
  if (!facultyName) return [];
  return subjectFaculty.filter(s => s.faculty.includes(facultyName));
}

export const subjectKeywords = {
  INT335: [
    "design thinking", "design think", "empathize", "empathy", "ideate", "ideation",
    "prototype", "prototyping", "user persona", "persona", "problem statement",
    "pov statement", "point of view", "empathy map", "user journey", "journey map",
    "human centered", "stanford d.school", "how might we", "hmw"
  ],
  CSE306: [
    "network", "networks", "networking", "tcp", "udp", "osi", "osi model", "ip address",
    "ipv4", "ipv6", "subnet", "subnetting", "3-way handshake", "three way handshake",
    "router", "switch", "packet", "dns", "http", "https", "arp", "mac address",
    "socket", "sockets", "port", "flow control", "congestion control", "lan", "wan"
  ],
  CSE205: [
    "dsa", "data structure", "data structures", "algorithm", "algorithms",
    "heap", "heaps", "priority queue", "heapsort", "binary search", "bst", "binary tree",
    "linked list", "singly linked", "doubly linked", "stack", "queue", "deque",
    "graph", "bfs", "dfs", "dijkstra", "sorting", "merge sort", "quicksort", "bubble sort",
    "insertion sort", "dynamic programming", "time complexity", "big o", "asymptotic",
    "hash table", "hash map", "hashing", "trie", "avl", "recursion"
  ],
  CSE202: [
    "oops", "oop", "polymorphism", "inheritance", "encapsulation", "abstraction",
    "constructor", "destructor", "virtual function", "method overriding", "overloading",
    "access specifier", "abstract class", "friend function", "vtable"
  ],
  MTH401: [
    "discrete math", "discrete mathematics", "discrete", "combinatorics",
    "permutation", "combination", "set theory", "equivalence relation", "relation",
    "truth table", "propositional logic", "predicate logic", "mathematical induction",
    "recurrence relation", "pigeonhole principle", "boolean algebra", "graph coloring"
  ],
  PEL132: [
    "communication skills", "communication", "resume", "cv", "interview", "email writing",
    "presentation skills", "7 cs of communication", "verbal communication",
    "non verbal communication", "soft skills", "body language", "listening skills",
    "group discussion", "gd"
  ],
  CSE423: [
    "virtualization", "cloud computing", "cloud", "hypervisor", "type 1 hypervisor",
    "type 2 hypervisor", "docker", "container", "containers", "kubernetes", "aws",
    "azure", "iaas", "paas", "saas", "virtual machine", "vm", "vmware", "kvm", "esxi"
  ]
};

/**
 * Automatically detects the academic course and assigned faculty from question text
 */
export function detectSubjectFromText(text) {
  if (!text || typeof text !== "string") return null;
  const lower = text.toLowerCase();

  let bestMatch = null;
  let highestScore = 0;

  for (const [code, keywords] of Object.entries(subjectKeywords)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        score += kw.length >= 8 ? 3 : 2;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = code;
    }
  }

  if (bestMatch && highestScore >= 2) {
    const subject = subjectFaculty.find((s) => s.code === bestMatch);
    if (subject) {
      return {
        ...subject,
        primaryFaculty: subject.faculty[0]
      };
    }
  }

  return null;
}
