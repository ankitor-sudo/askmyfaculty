import { useState } from "react";
import { subjectFaculty } from "../subjectFaculty";
import { availableSections } from "../sections";

export default function SectionNoticesModal({
  isOpen,
  onClose,
  onSubmitNotice,
  submitting,
  facultyName,
  taughtSubjects = []
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedSubject, setSelectedSubject] = useState(
    taughtSubjects[0]?.code || "General"
  );
  const [targetSections, setTargetSections] = useState(["K25PS"]);
  const [priority, setPriority] = useState("General"); // "Urgent" | "Exam" | "Assignment" | "General"

  if (!isOpen) return null;

  const handleToggleSection = (section) => {
    if (section === "All") {
      setTargetSections(["All"]);
      return;
    }

    setTargetSections((prev) => {
      const withoutAll = prev.filter((s) => s !== "All");
      if (withoutAll.includes(section)) {
        const remaining = withoutAll.filter((s) => s !== section);
        return remaining.length === 0 ? ["All"] : remaining;
      } else {
        return [...withoutAll, section];
      }
    });
  };

  const handleSelectAllSections = () => {
    setTargetSections(["All"]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("Please provide both a notice title and description.");
      return;
    }

    const subObj = subjectFaculty.find((s) => s.code === selectedSubject);
    const success = await onSubmitNotice({
      title: title.trim(),
      content: content.trim(),
      subjectCode: selectedSubject,
      subjectName: subObj ? subObj.name : "General Announcement",
      targetSections: targetSections.length > 0 ? targetSections : ["All"],
      priority,
      facultyName
    });

    if (success) {
      setTitle("");
      setContent("");
      setTargetSections(["K25PS"]);
      setPriority("General");
      onClose();
    }
  };

  const priorityOptions = [
    { label: "📢 General Notice", value: "General" },
    { label: "🚨 Urgent Alert", value: "Urgent" },
    { label: "📝 Exam / Quiz", value: "Exam" },
    { label: "📁 Assignment", value: "Assignment" }
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="question-modal section-notice-modal"
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="close-button" onClick={onClose}>
          ×
        </button>

        <p className="eyebrow faculty-eyebrow">FACULTY DESK • SECTION ANNOUNCEMENTS</p>
        <h2>Post Section Notice</h2>
        <p className="muted">
          Broadcast important updates, deadlines, or test alerts directly to student notification feeds.
        </p>

        {/* Course / Subject */}
        <label>Course / Subject</label>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
        >
          <option value="General">General / All Courses</option>
          {subjectFaculty.map((sub) => (
            <option key={sub.code} value={sub.code}>
              {sub.code} — {sub.name}
            </option>
          ))}
        </select>

        {/* Target Sections */}
        <div className="section-selection-box">
          <div className="section-selection-header">
            <label>Target Sections:</label>
            <button
              type="button"
              className="select-all-btn"
              onClick={handleSelectAllSections}
            >
              Select All Sections
            </button>
          </div>
          <p className="field-hint">
            Select one or multiple class sections to receive this notice:
          </p>

          <div className="section-chips-grid">
            <button
              type="button"
              className={`section-chip-btn ${
                targetSections.includes("All") ? "selected" : ""
              }`}
              onClick={() => handleToggleSection("All")}
            >
              🌐 All Sections
            </button>
            {availableSections.map((sec) => (
              <button
                key={sec}
                type="button"
                className={`section-chip-btn ${
                  targetSections.includes(sec) && !targetSections.includes("All")
                    ? "selected"
                    : ""
                }`}
                onClick={() => handleToggleSection(sec)}
              >
                📌 Section {sec}
              </button>
            ))}
          </div>
        </div>

        {/* Priority / Tag */}
        <label>Notice Type / Priority</label>
        <div className="priority-pills-row">
          {priorityOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`priority-pill-btn ${priority === opt.value ? "selected" : ""}`}
              onClick={() => setPriority(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Notice Title */}
        <label>Notice Title</label>
        <input
          type="text"
          className="notice-input-title"
          placeholder="e.g. Lab Evaluation Rescheduled to Thursday, Room 302"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* Message Content */}
        <label>Detailed Announcement / Instructions</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write the complete announcement details, instructions, links, or syllabus guidelines..."
          rows="5"
          required
        />

        <div className="modal-actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="faculty-primary-button"
            disabled={submitting}
          >
            {submitting ? "Broadcasting..." : "📢 Broadcast Notice →"}
          </button>
        </div>
      </form>
    </div>
  );
}
