import { useState } from "react";
import { subjectFaculty, detectSubjectFromText } from "../subjectFaculty";

function AskQuestionModalContent({
  onClose,
  onSubmit,
  submitting,
  initialSubject,
  initialFaculty
}) {
  const [subject, setSubject] = useState(initialSubject || "");
  const [faculty, setFaculty] = useState(initialFaculty || "");
  const [question, setQuestion] = useState("");
  const [enableAiFastAnswer, setEnableAiFastAnswer] = useState(true);
  const [autoDetectedPill, setAutoDetectedPill] = useState(null);

  const handleSubjectChange = (e) => {
    const val = e.target.value;
    setSubject(val);
    setFaculty("");
    setAutoDetectedPill(null);
  };

  const selectedSubject = subjectFaculty.find((item) => item.code === subject);
  const availableFaculty = selectedSubject ? selectedSubject.faculty : [];

  const handleQuestionChange = (e) => {
    const val = e.target.value;
    setQuestion(val);

    const detected = detectSubjectFromText(val);
    if (detected && (!subject || detected.code !== subject)) {
      setSubject(detected.code);
      setFaculty(detected.primaryFaculty);
      setAutoDetectedPill(`⚡ Auto-selected ${detected.code}: ${detected.name} (Prof. ${detected.primaryFaculty})`);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || !subject || !faculty) {
      alert("Please select a subject, faculty, and provide your question.");
      return;
    }
    const success = await onSubmit({
      subjectCode: subject,
      subjectName: selectedSubject?.name || subject,
      facultyName: faculty,
      question: question.trim(),
      enableAiFastAnswer
    });
    if (success) {
      setQuestion("");
      setSubject("");
      setFaculty("");
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="question-modal"
        onSubmit={handleFormSubmit}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="close-button" onClick={onClose}>
          ×
        </button>

        <p className="eyebrow">ACADEMIC SUPPORT • STUDENT QUERY</p>
        <h2>Ask a Question</h2>
        <p className="muted">
          Ask your doubt to your assigned faculty member with optional fast AI resolution.
        </p>

        <label>Subject</label>
        <select value={subject} onChange={handleSubjectChange} required>
          <option value="">Select a subject</option>
          {subjectFaculty.map((item) => (
            <option key={item.code} value={item.code}>
              {item.code} — {item.name}
            </option>
          ))}
        </select>

        <label>Faculty Member</label>
        <select
          value={faculty}
          onChange={(e) => setFaculty(e.target.value)}
          disabled={!subject}
          required
        >
          <option value="">
            {subject ? "Select a faculty member" : "First select a subject"}
          </option>
          {availableFaculty.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <label>Your Question or Academic Doubt</label>
        <textarea
          value={question}
          onChange={handleQuestionChange}
          placeholder="Explain your doubt, mention relevant topics or code snippet..."
          required
          rows="5"
        />

        {autoDetectedPill && (
          <div className="modal-auto-detected-pill">
            {autoDetectedPill}
          </div>
        )}

        {/* AI Fast-Answer Option Box */}
        <div className="ai-fast-answer-toggle-box">
          <label className="ai-toggle-label">
            <input
              type="checkbox"
              checked={enableAiFastAnswer}
              onChange={(e) => setEnableAiFastAnswer(e.target.checked)}
            />
            <div className="ai-toggle-text">
              <strong>🤖 Enable AI Fast-Answer (Recommended)</strong>
              <span>
                Generates a quick academic explanation. If you're not satisfied, you can transfer it to Prof. {faculty || "your teacher"} anytime!
              </span>
            </div>
          </label>
        </div>

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
            className="primary-button submit-button"
            disabled={submitting}
          >
            {submitting
              ? "Processing Query..."
              : enableAiFastAnswer
              ? "⚡ Submit with AI Fast-Answer"
              : "Send Directly to Faculty →"}
          </button>
        </div>
      </form>
    </div>
  );
}

function AskQuestionModal({
  isOpen,
  onClose,
  onSubmit,
  submitting,
  initialSubject = "",
  initialFaculty = ""
}) {
  if (!isOpen) return null;

  return (
    <AskQuestionModalContent
      key={`${initialSubject}-${initialFaculty}`}
      onClose={onClose}
      onSubmit={onSubmit}
      submitting={submitting}
      initialSubject={initialSubject}
      initialFaculty={initialFaculty}
    />
  );
}

export default AskQuestionModal;
