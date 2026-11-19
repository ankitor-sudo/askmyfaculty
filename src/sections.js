export const availableSections = [
  "K25PS",
  "K25HG",
  "K25SP",
  "K25AB",
  "K25TR",
  "K25CS",
  "K25IT",
  "K25DS"
];

export const defaultSection = "K25PS";

/**
 * Checks if an announcement targeted to certain sections matches the student's section
 */
export function isSectionMatching(targetSections, studentSection) {
  if (!targetSections || targetSections.length === 0) return true;
  if (targetSections.includes("All") || targetSections.includes("All Sections")) return true;
  if (!studentSection) return true;
  return targetSections.includes(studentSection);
}
