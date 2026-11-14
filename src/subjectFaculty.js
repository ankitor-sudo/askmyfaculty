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
