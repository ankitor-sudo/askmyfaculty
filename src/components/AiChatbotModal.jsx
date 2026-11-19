import { useState, useRef, useEffect, useMemo } from "react";
import { subjectFaculty, detectSubjectFromText } from "../subjectFaculty";
import { generateAiAnswer, getStoredApiKey, saveStoredApiKey } from "../services/aiService";
import MarkdownView from "./MarkdownView";

function getInitialWelcomeMessage(userName) {
  return {
    id: "welcome-1",
    sender: "bot",
    text: `Hello ${userName || "Student"}! 👋 I'm your **AskMyFaculty AI Academic Assistant**.\n\nAsk me any doubt about your coursework. I'll provide a fast, structured answer right away! If you're not satisfied, you can transfer your doubt directly to your assigned professor with a single click.`,
    timestamp: "Just now"
  };
}

export default function AiChatbotModal({
  userProfile,
  isOpen,
  onClose,
  onSubmitQuery,
  initialSubject = "",
  initialFaculty = ""
}) {
  const [selectedSubject, setSelectedSubject] = useState(
    initialSubject || (subjectFaculty[0]?.code ?? "CSE202")
  );

  const currentSubjectObj = useMemo(() => {
    return subjectFaculty.find((s) => s.code === selectedSubject);
  }, [selectedSubject]);

  const availableFaculty = useMemo(() => {
    return currentSubjectObj ? currentSubjectObj.faculty : [];
  }, [currentSubjectObj]);

  const [selectedFaculty, setSelectedFaculty] = useState(
    initialFaculty || (availableFaculty[0] ?? "")
  );

  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState(() => [
    getInitialWelcomeMessage(userProfile?.name)
  ]);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => getStoredApiKey());
  const [transferringId, setTransferringId] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);

  const messagesEndRef = useRef(null);

  const handleSubjectChange = (newSubject) => {
    setSelectedSubject(newSubject);
    const subObj = subjectFaculty.find((s) => s.code === newSubject);
    if (subObj && subObj.faculty.length > 0) {
      setSelectedFaculty(subObj.faculty[0]);
    } else {
      setSelectedFaculty("");
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (!isMinimized && isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, isMinimized, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (customText = null) => {
    const textToSend = typeof customText === "string" ? customText : inputMessage;
    if (!textToSend.trim() || loading) return;

    // Detect matching subject from the question
    const detected = detectSubjectFromText(textToSend);
    let targetSubject = selectedSubject;
    let targetSubjectName = currentSubjectObj?.name || selectedSubject;
    let targetFaculty = selectedFaculty;
    let wasAutoSwitched = false;

    if (detected) {
      targetSubject = detected.code;
      targetSubjectName = detected.name;
      targetFaculty = detected.primaryFaculty;

      if (detected.code !== selectedSubject || detected.primaryFaculty !== selectedFaculty) {
        wasAutoSwitched = true;
        setSelectedSubject(detected.code);
        setSelectedFaculty(detected.primaryFaculty);
      }
    }

    const userMsg = {
      id: "user-" + Date.now(),
      sender: "user",
      text: textToSend.trim(),
      subjectCode: targetSubject,
      subjectName: targetSubjectName,
      facultyName: targetFaculty,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setLoading(true);

    try {
      const response = await generateAiAnswer({
        question: textToSend.trim(),
        subjectCode: targetSubject,
        subjectName: targetSubjectName,
        facultyName: targetFaculty
      });

      const botMsg = {
        id: "bot-" + Date.now(),
        sender: "bot",
        text: response.answer,
        source: response.source,
        subjectCode: targetSubject,
        subjectName: targetSubjectName,
        facultyName: targetFaculty,
        originalQuestion: textToSend.trim(),
        autoSwitched: wasAutoSwitched,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        satisfaction: null
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: "bot-err-" + Date.now(),
          sender: "bot",
          text: `⚠️ Sorry, I encountered an issue: ${err.message}. Please try again or transfer this question directly to your faculty.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkSatisfied = (msgId) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === msgId ? { ...msg, satisfaction: "satisfied" } : msg
      )
    );
  };

  const handleTransferToTeacher = async (botMsg) => {
    if (!onSubmitQuery) return;
    setTransferringId(botMsg.id);

    try {
      const questionText = botMsg.originalQuestion || "Doubt regarding " + (botMsg.subjectName || "the course");
      const subCode = botMsg.subjectCode || selectedSubject;
      const subName = botMsg.subjectName || currentSubjectObj?.name || subCode;
      const faculty = botMsg.facultyName || selectedFaculty;

      await onSubmitQuery({
        subjectCode: subCode,
        subjectName: subName,
        facultyName: faculty,
        question: questionText,
        aiAnswer: botMsg.text,
        transferredFromAi: true,
        transferredToFaculty: true,
        transferReason: "Student unsatisfied with AI answer in Chatbot",
        status: "Pending"
      });

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMsg.id ? { ...msg, satisfaction: "transferred" } : msg
        )
      );

      setMessages((prev) => [
        ...prev,
        {
          id: "bot-transfer-" + Date.now(),
          sender: "bot",
          isSystem: true,
          text: `✅ **Transferred to Teacher!**\n\nYour question has been officially routed to **Prof. ${faculty}**'s priority inbox with the AI answer context. You can monitor the response status under **"My Questions"** on your dashboard!`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } catch (err) {
      alert("Failed to transfer query: " + err.message);
    } finally {
      setTransferringId(null);
    }
  };

  const handleSaveApiKey = () => {
    saveStoredApiKey(apiKeyInput);
    setShowSettings(false);
    alert("Gemini API key updated successfully!");
  };

  const quickPrompts = [
    "Explain Polymorphism with code example",
    "How does TCP 3-way handshake work?",
    "Explain Big-O of Binary Search vs Linear Search",
    "What are the 5 stages of Design Thinking?"
  ];

  return (
    <div className={`chatbot-window-container ${isMinimized ? "minimized" : ""}`}>
      {/* Chatbot Header */}
      <div className="chatbot-header">
        <div className="chatbot-header-info">
          <div className="chatbot-avatar-badge">🤖</div>
          <div>
            <div className="chatbot-title">
              AskMyFaculty AI Doubt Bot
              <span className="chatbot-status-dot" title="Ready to answer"></span>
            </div>
            <div className="chatbot-subtitle">
              Fast Answers & Smart Faculty Escalation
            </div>
          </div>
        </div>

        <div className="chatbot-header-actions">
          <button
            type="button"
            className="chatbot-icon-btn"
            title="Configure Gemini API Key"
            onClick={() => setShowSettings(!showSettings)}
          >
            ⚙️
          </button>
          <button
            type="button"
            className="chatbot-icon-btn"
            title={isMinimized ? "Expand" : "Minimize"}
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? "▲" : "—"}
          </button>
          <button
            type="button"
            className="chatbot-icon-btn close"
            title="Close Chat"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Optional API Key Configuration Panel */}
          {showSettings && (
            <div className="chatbot-settings-panel">
              <div className="settings-panel-title">
                <strong>Google Gemini API Setup (Optional)</strong>
                <button
                  type="button"
                  className="chatbot-text-btn"
                  onClick={() => setShowSettings(false)}
                >
                  ✕
                </button>
              </div>
              <p className="settings-desc">
                The chatbot operates out of the box with built-in curriculum knowledge.
                To use live Gemini 1.5 Flash models, enter your free Gemini API key below:
              </p>
              <div className="settings-input-group">
                <input
                  type="password"
                  placeholder="Paste Gemini API Key (AIzaSy...)"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="settings-key-input"
                />
                <button
                  type="button"
                  className="settings-save-btn"
                  onClick={handleSaveApiKey}
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Subject & Teacher Target Bar */}
          <div className="chatbot-course-selector-bar">
            <div className="course-select-item">
              <label>Course:</label>
              <select
                value={selectedSubject}
                onChange={(e) => handleSubjectChange(e.target.value)}
              >
                {subjectFaculty.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="course-select-item">
              <label>Assigned Faculty:</label>
              <select
                value={selectedFaculty}
                onChange={(e) => setSelectedFaculty(e.target.value)}
              >
                {availableFaculty.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Messages Body */}
          <div className="chatbot-messages-body">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chatbot-bubble-row ${
                  msg.sender === "user" ? "user-row" : "bot-row"
                } ${msg.isSystem ? "system-row" : ""}`}
              >
                {msg.sender === "bot" && (
                  <div className="bot-chat-avatar">🤖</div>
                )}

                <div className="chatbot-bubble">
                  {msg.sender === "bot" && msg.source && (
                    <div className="bubble-source-tag">
                      Powered by {msg.source}
                    </div>
                  )}

                  {msg.autoSwitched && (
                    <div className="auto-switched-course-badge">
                      ⚡ Auto-matched subject: <strong>{msg.subjectCode} — {msg.subjectName}</strong> (Prof. {msg.facultyName})
                    </div>
                  )}

                  <div className="bubble-content-text">
                    <MarkdownView content={msg.text} />
                  </div>

                  {/* Feedback / Transfer Controls for Bot Answers */}
                  {msg.sender === "bot" && !msg.isSystem && msg.originalQuestion && (
                    <div className="chatbot-satisfaction-box">
                      {msg.satisfaction === "satisfied" ? (
                        <div className="satisfaction-result satisfied-result">
                          ✓ Great! You marked this doubt as resolved.
                        </div>
                      ) : msg.satisfaction === "transferred" ? (
                        <div className="satisfaction-result transferred-result">
                          🔄 Question transferred to Prof. {msg.facultyName || selectedFaculty}.
                        </div>
                      ) : (
                        <div className="satisfaction-buttons-wrap">
                          <span className="satisfaction-prompt">
                            Are you satisfied with this answer?
                          </span>
                          <div className="satisfaction-actions">
                            <button
                              type="button"
                              className="btn-satisfied"
                              onClick={() => handleMarkSatisfied(msg.id)}
                            >
                              👍 Yes, Satisfied
                            </button>
                            <button
                              type="button"
                              className="btn-transfer"
                              disabled={transferringId === msg.id}
                              onClick={() => handleTransferToTeacher(msg)}
                            >
                              {transferringId === msg.id
                                ? "Transferring..."
                                : `👎 Not Satisfied → Transfer to Prof. ${msg.facultyName || "Faculty"} (${msg.subjectCode || ""})`}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <span className="bubble-timestamp">{msg.timestamp}</span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="chatbot-bubble-row bot-row">
                <div className="bot-chat-avatar">🤖</div>
                <div className="chatbot-bubble loading-bubble">
                  <span className="ai-thinking-dots">
                    <span>.</span>
                    <span>.</span>
                    <span>.</span>
                  </span>
                  AI Assistant is formulating your academic explanation...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="chatbot-quick-chips">
            {quickPrompts.map((prompt, index) => (
              <button
                key={index}
                type="button"
                className="quick-chip-btn"
                onClick={() => handleSendMessage(prompt)}
                disabled={loading}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form
            className="chatbot-input-footer"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <input
              type="text"
              placeholder="Ask any academic doubt or question..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={loading}
              className="chatbot-input-field"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="chatbot-send-btn"
            >
              ➤
            </button>
          </form>
        </>
      )}
    </div>
  );
}
