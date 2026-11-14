import { useState } from "react";
import { subjectFaculty } from "../subjectFaculty";

function AskQuestionModal({
  isOpen,
  onClose,
  onSubmit,
  submitting,
  initialSubject = "",
  initialFaculty = ""
}) {
  const [subject, setSubject] = useState(initialSubject);
  const [faculty, setFaculty] = useState(initialFaculty);
  const [question, setQuestion] = useState("");

  if (!isOpen) return null;

  const handleSubjectChange = (e) => {
    const val = e.target.value;
    setSubject(val);
    setFaculty("");
  };

  const selectedSubject = subjectFaculty.find((item) => item.code === subject);
  const availableFaculty = selectedSubject ? selectedSubject.faculty : [];

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
      question: question.trim()
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
          Your query will be sent directly to the selected faculty member.
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
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Explain your doubt, mention relevant topics or code snippet..."
          required
          rows="5"
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
            className="primary-button submit-button"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Send Question →"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AskQuestionModal;
