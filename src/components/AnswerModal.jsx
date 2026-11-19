import { useState } from "react";

function AnswerModalContent({
  queryItem,
  onClose,
  onSubmitAnswer,
  submitting
}) {
  const [answerText, setAnswerText] = useState(queryItem.answer || "");
  const [status, setStatus] = useState(
    queryItem.status === "Pending" ? "Answered" : queryItem.status
  );
  const [showAiAnswer, setShowAiAnswer] = useState(false);

  const quickTemplates = [
    "Please review chapter 4 of the course materials and let me know if you still have doubts.",
    "Good question! To solve this, make sure you consider the edge cases where...",
    "Let's discuss this during my upcoming office hours so we can go through it step by step.",
    "This was discussed in our last lecture. You can find the reference notes on the portal."
  ];

  const handleTemplateClick = (tpl) => {
    setAnswerText((prev) => (prev ? `${prev}\n\n${tpl}` : tpl));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!answerText.trim()) {
      alert("Please provide an answer before submitting.");
      return;
    }
    const success = await onSubmitAnswer(queryItem.id, answerText.trim(), status);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="question-modal faculty-answer-modal"
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="close-button" onClick={onClose}>
          ×
        </button>

        <p className="eyebrow">FACULTY PORTAL • RESOLVE QUERY</p>
        <h2>Respond to Student</h2>

        <div className="original-query-box">
          <div className="query-meta-header">
            <span className="student-badge">👤 {queryItem.studentName || "Student"}</span>
            <span className="subject-badge">{queryItem.subjectCode}: {queryItem.subjectName}</span>
          </div>
          <p className="original-question-text">"{queryItem.question}"</p>
          <small className="query-timestamp">
            Asked on:{" "}
            {queryItem.createdAt?.toDate
              ? queryItem.createdAt.toDate().toLocaleString()
              : "Recently"}
          </small>
        </div>

        {/* Transferred AI Answer Context */}
        {queryItem.aiAnswer && (
          <div className="faculty-ai-context-box">
            <div className="ai-context-header">
              <span className="ai-tag-badge">🤖 Initial AI Answer Provided</span>
              <button
                type="button"
                className="ai-toggle-btn"
                onClick={() => setShowAiAnswer(!showAiAnswer)}
              >
                {showAiAnswer ? "Hide AI text ▲" : "View what AI replied ▼"}
              </button>
            </div>
            {showAiAnswer && (
              <div className="ai-context-body">
                {queryItem.aiAnswer}
              </div>
            )}
            <div className="transfer-reason-note">
              ⚡ Student escalated this query: <em>{queryItem.transferReason || "Needs professor clarification"}</em>
            </div>
          </div>
        )}

        <div className="template-chips">
          <label className="field-label-small">QUICK TEMPLATES</label>
          <div className="chips-row">
            {quickTemplates.map((tpl, idx) => (
              <button
                key={idx}
                type="button"
                className="chip-btn"
                onClick={() => handleTemplateClick(tpl)}
              >
                + Template {idx + 1}
              </button>
            ))}
          </div>
        </div>

        <label>Your Detailed Explanation / Solution</label>
        <textarea
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          placeholder="Write your explanation, provide references, or share instructions..."
          rows="6"
          required
        />

        <div className="status-selector-row">
          <label>Update Query Status:</label>
          <div className="status-radio-group">
            <label className={`radio-pill ${status === "Answered" ? "selected" : ""}`}>
              <input
                type="radio"
                name="queryStatus"
                value="Answered"
                checked={status === "Answered"}
                onChange={(e) => setStatus(e.target.value)}
              />
              ✓ Mark as Answered
            </label>

            <label className={`radio-pill ${status === "In Progress" ? "selected" : ""}`}>
              <input
                type="radio"
                name="queryStatus"
                value="In Progress"
                checked={status === "In Progress"}
                onChange={(e) => setStatus(e.target.value)}
              />
              ◷ In Progress / Needs Follow-up
            </label>
          </div>
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
            className="faculty-primary-button"
            disabled={submitting}
          >
            {submitting ? "Saving..." : "Submit Response →"}
          </button>
        </div>
      </form>
    </div>
  );
}

function AnswerModal({
  isOpen,
  onClose,
  queryItem,
  onSubmitAnswer,
  submitting
}) {
  if (!isOpen || !queryItem) return null;

  return (
    <AnswerModalContent
      key={queryItem.id}
      queryItem={queryItem}
      onClose={onClose}
      onSubmitAnswer={onSubmitAnswer}
      submitting={submitting}
    />
  );
}

export default AnswerModal;
