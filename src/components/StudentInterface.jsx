import { useState, useEffect, useMemo } from "react";
import AskQuestionModal from "./AskQuestionModal";
import AiChatbotModal from "./AiChatbotModal";
import FacultyDirectory from "./FacultyDirectory";
import AppointmentsView from "./AppointmentsView";
import FaqView from "./FaqView";
import NotificationsView from "./NotificationsView";
import MarkdownView from "./MarkdownView";
import SettingsView from "./SettingsView";
import { isSectionMatching } from "../sections";

function AiReviewTimer({ deadline, createdAt }) {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const end =
      deadline ||
      (createdAt?.toMillis
        ? createdAt.toMillis() + 15 * 60 * 1000
        : Date.now() + 15 * 60 * 1000);
    return Math.max(0, Math.floor((end - Date.now()) / 1000));
  });

  useEffect(() => {
    const end =
      deadline ||
      (createdAt?.toMillis
        ? createdAt.toMillis() + 15 * 60 * 1000
        : Date.now() + 15 * 60 * 1000);

    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((end - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline, createdAt]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const formattedSecs = secs < 10 ? `0${secs}` : secs;

  if (secondsLeft <= 0) {
    return (
      <span className="review-timer-badge expired">
        ⏱️ 15-min review window ended • You can transfer to teacher below
      </span>
    );
  }

  return (
    <span className="review-timer-badge active">
      ⏱️ Review Window: <strong>{mins}:{formattedSecs}</strong> remaining to transfer if unsatisfied
    </span>
  );
}

function StudentInterface({
  user,
  userProfile,
  userQuestions,
  loadingQuestions,
  announcements = [],
  studentSection = "K25PS",
  onUpdateSection,
  onUpdateProfile,
  onSubmitQuestion,
  onTransferQuestion,
  onMarkSatisfied,
  onLogout
}) {
  const [active, setActive] = useState("Dashboard");
  const [sidebarVisible, setSidebarVisible] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth > 768;
    }
    return true;
  });
  const [showAskModal, setShowAskModal] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [initialSubject, setInitialSubject] = useState("");
  const [initialFaculty, setInitialFaculty] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState(null);

  const unreadNoticeCount = useMemo(() => {
    let readIds = [];
    try {
      readIds = JSON.parse(localStorage.getItem("askmyfaculty_read_notices") || "[]");
    } catch {
      readIds = [];
    }
    return announcements.filter(
      (n) => isSectionMatching(n.targetSections, studentSection) && !readIds.includes(n.id)
    ).length;
  }, [announcements, studentSection]);

  const latestSectionNotice = useMemo(() => {
    return announcements.find((n) => isSectionMatching(n.targetSections, studentSection));
  }, [announcements, studentSection]);

  const studentName =
    userProfile?.name || userProfile?.email?.split("@")[0] || "Student";

  const initials = studentName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const totalQuestions = userQuestions.length;
  const pendingFacultyCount = userQuestions.filter(
    (q) => (q.status === "Pending" || q.transferredToFaculty) && !q.answer
  ).length;
  const aiAnsweredCount = userQuestions.filter(
    (q) => q.status === "AI Answered" && !q.transferredToFaculty && !q.answer
  ).length;
  const resolvedCount = userQuestions.filter(
    (q) => q.status === "Answered" || q.status === "Resolved (AI)"
  ).length;

  const handleOpenAskModal = (prefill = {}) => {
    setInitialSubject(prefill.subject || "");
    setInitialFaculty(prefill.faculty || "");
    setShowAskModal(true);
  };

  const handleQuestionSubmit = async (formData) => {
    try {
      setSubmitting(true);
      await onSubmitQuestion(formData);
      return true;
    } catch (err) {
      alert("Error submitting question: " + err.message);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransferClick = async (queryId) => {
    try {
      setActionInProgressId(queryId);
      await onTransferQuestion(queryId, "Student requested faculty explanation after AI response");
    } catch (err) {
      alert("Failed to transfer query: " + err.message);
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleSatisfiedClick = async (queryId) => {
    try {
      setActionInProgressId(queryId);
      await onMarkSatisfied(queryId);
    } catch (err) {
      alert("Failed to mark as satisfied: " + err.message);
    } finally {
      setActionInProgressId(null);
    }
  };

  const filteredQuestions = userQuestions.filter((q) => {
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "Pending" && (q.status === "Pending" || q.transferredToFaculty)) ||
      (statusFilter === "AI" && q.status === "AI Answered" && !q.transferredToFaculty) ||
      (statusFilter === "Answered" && (q.status === "Answered" || q.status === "Resolved (AI)"));

    const matchesSearch =
      q.question?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.subjectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.subjectCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.facultyName?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const menu = [
    { name: "Dashboard", icon: "▦" },
    { name: "My Questions", icon: "✉" },
    { name: "Notifications", icon: "🔔" },
    { name: "AI Doubt Bot", icon: "🤖" },
    { name: "Faculty Directory", icon: "♙" },
    { name: "Appointments", icon: "▣" },
    { name: "FAQs", icon: "?" },
    { name: "Settings", icon: "⚙" }
  ];

  const renderQuestionCard = (r, isCompact = false) => {
    const isTransferred = Boolean(r.transferredToFaculty);
    const isResolvedAi = r.status === "Resolved (AI)";
    const hasFacultyAnswer = Boolean(r.answer);
    const hasAiAnswer = Boolean(r.aiAnswer);
    const isAiReviewing = hasAiAnswer && !isTransferred && !isResolvedAi && !hasFacultyAnswer;

    return (
      <article
        className={`request-card ${!isCompact ? "full-card" : ""} ${
          isAiReviewing ? "ai-active-card" : ""
        }`}
        key={r.id}
      >
        <div className="request-symbol">
          {hasAiAnswer && !hasFacultyAnswer ? "🤖" : "✉"}
        </div>

        <div className="request-info">
          <div className="request-meta">
            <span className="subject-tag">
              {r.subjectCode}: {r.subjectName}
            </span>
            <span>•</span>
            <span>
              Target Faculty: <strong>{r.facultyName}</strong>
            </span>
            {isTransferred && (
              <span className="escalated-ai-badge">
                🔄 Transferred to Teacher
              </span>
            )}
            {isResolvedAi && (
              <span className="resolved-ai-badge">
                ✓ Resolved via AI
              </span>
            )}
          </div>

          <h3 className="query-title">{r.question}</h3>

          <p className="query-date">
            Submitted:{" "}
            {r.createdAt?.toDate
              ? r.createdAt.toDate().toLocaleString()
              : "Just now"}
          </p>

          {/* 1. Official Faculty Answer */}
          {hasFacultyAnswer && (
            <div className="faculty-answer-box">
              <div className="answer-badge-header">
                <span className="faculty-check-icon">✓</span>
                <strong>Faculty Response from {r.answeredBy || r.facultyName}</strong>
                {r.answeredAt?.toDate && (
                  <span className="answered-date-tag">
                    {r.answeredAt.toDate().toLocaleString()}
                  </span>
                )}
              </div>
              <div className="answer-content-body">{r.answer}</div>
            </div>
          )}

          {/* 2. AI Fast Answer Section */}
          {!hasFacultyAnswer && hasAiAnswer && (
            <div className="student-ai-answer-card">
              <div className="ai-answer-card-header">
                <div className="ai-badge-left">
                  <span className="ai-sparkle-icon">✨</span>
                  <strong>AskMyFaculty AI Fast-Answer</strong>
                  <span className="ai-speed-tag">Instant Academic Explanation</span>
                </div>
                {isAiReviewing && (
                  <AiReviewTimer
                    deadline={r.reviewDeadline}
                    createdAt={r.createdAt}
                  />
                )}
              </div>

              <div className="ai-answer-card-body">
                <MarkdownView content={r.aiAnswer} />
              </div>

              {/* Satisfaction & Transfer Action Bar */}
              {isAiReviewing && (
                <div className="ai-resolution-action-bar">
                  <div className="resolution-prompt-text">
                    <strong>Are you satisfied with this explanation?</strong>
                    <p>
                      If this clears your doubt, click <b>Satisfied</b>. If you need professor explanation, click <b>Transfer to Teacher</b>.
                    </p>
                  </div>

                  <div className="resolution-button-group">
                    <button
                      type="button"
                      className="btn-mark-satisfied"
                      disabled={actionInProgressId === r.id}
                      onClick={() => handleSatisfiedClick(r.id)}
                    >
                      {actionInProgressId === r.id ? "Saving..." : "👍 Yes, I'm Satisfied"}
                    </button>

                    <button
                      type="button"
                      className="btn-mark-transfer"
                      disabled={actionInProgressId === r.id}
                      onClick={() => handleTransferClick(r.id)}
                    >
                      {actionInProgressId === r.id
                        ? "Transferring..."
                        : `👎 Not Satisfied → Transfer to Prof. ${r.facultyName || "Faculty"} (${r.subjectCode})`}
                    </button>
                  </div>
                </div>
              )}

              {/* Status Notice if Already Transferred */}
              {isTransferred && !hasFacultyAnswer && (
                <div className="transfer-pending-banner">
                  <span className="banner-icon">⏳</span>
                  <div>
                    <strong>Transferred to Prof. {r.facultyName}</strong>
                    <p>
                      You marked the AI answer as unsatisfactory. Your question has been forwarded directly to Prof. {r.facultyName}'s queue.
                    </p>
                  </div>
                </div>
              )}

              {/* Status Notice if Resolved via AI */}
              {isResolvedAi && (
                <div className="resolved-ai-banner">
                  <span className="banner-icon">✓</span>
                  <div>
                    <strong>Resolved via AI Fast-Answer</strong>
                    <p>You marked this doubt as resolved. Keep up the great learning!</p>
                  </div>
                  <button
                    type="button"
                    className="reopen-transfer-btn"
                    onClick={() => handleTransferClick(r.id)}
                  >
                    Need teacher follow-up? Transfer →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 3. Normal Pending (No AI or direct faculty query) */}
          {!hasFacultyAnswer && !hasAiAnswer && (
            <div className="pending-notice">
              ⏳ Awaiting response from {r.facultyName}. Usually replies within 24-48 hours.
            </div>
          )}
        </div>

        <div className="request-card-right">
          <span
            className={`status ${
              isResolvedAi
                ? "answered"
                : isTransferred
                ? "pending"
                : isAiReviewing
                ? "in-progress"
                : r.status?.toLowerCase().replace(" ", "-") || "pending"
            }`}
          >
            {isResolvedAi
              ? "Resolved (AI)"
              : isTransferred
              ? "Transferred"
              : isAiReviewing
              ? "AI Answered"
              : r.status || "Pending"}
          </span>
        </div>
      </article>
    );
  };

  const handleNavSelect = (itemName) => {
    if (itemName === "AI Doubt Bot") {
      setShowChatbot(true);
    } else {
      setActive(itemName);
    }
    if (typeof window !== "undefined" && window.innerWidth <= 768) {
      setSidebarVisible(false);
    }
  };

  return (
    <div className={`app student-theme ${!sidebarVisible ? "sidebar-hidden" : ""}`}>
      {sidebarVisible && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarVisible(false)}
          aria-label="Close navigation menu"
        />
      )}
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">A</span>
          <div>
            <div>AskMyFaculty</div>
            <div className="portal-subtag student-tag">Student Portal</div>
          </div>
          <button
            type="button"
            className="mobile-sidebar-close-btn"
            onClick={() => setSidebarVisible(false)}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        <p className="menu-label">WORKSPACE</p>

        <nav>
          {menu.map((item) => (
            <button
              key={item.name}
              className={active === item.name ? "nav-item active" : "nav-item"}
              onClick={() => handleNavSelect(item.name)}
            >
              <span>{item.icon}</span>
              {item.name}
              {item.name === "My Questions" && pendingFacultyCount > 0 && (
                <span className="nav-badge orange-badge">{pendingFacultyCount}</span>
              )}
              {item.name === "Notifications" && unreadNoticeCount > 0 && (
                <span className="nav-badge red-badge">{unreadNoticeCount}</span>
              )}
              {item.name === "AI Doubt Bot" && (
                <span className="nav-badge ai-fast-badge">AI</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card ai-help-promo">
            <div className="promo-badge">NEW FEATURE</div>
            <strong>AI Academic Doubt Bot</strong>
            <p>Get instant explanations and transfer to teacher if needed!</p>
            <button onClick={() => setShowChatbot(true)}>
              Open Chatbot →
            </button>
          </div>

          <div className="profile">
            <div className="avatar">{initials}</div>
            <div className="profile-info">
              <strong>{studentName}</strong>
              <small>Student</small>
            </div>
            <button className="logout-button" onClick={onLogout} title="Logout">
              Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="sidebar-toggle-btn"
              onClick={() => setSidebarVisible(!sidebarVisible)}
              title={sidebarVisible ? "Collapse Sidebar" : "Expand Sidebar"}
              aria-label="Toggle Sidebar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>

            <div className="breadcrumb">
              Student Workspace <span>/</span> {active}
            </div>
          </div>

          <div className="top-actions">
            <button
              type="button"
              className="topbar-bell-btn"
              onClick={() => setActive("Notifications")}
              title={`Section ${studentSection} Notifications`}
            >
              🔔
              {unreadNoticeCount > 0 && (
                <span className="bell-badge-pill">{unreadNoticeCount}</span>
              )}
            </button>

            <div className="topbar-section-pill">
              📌 Sec: {studentSection}
            </div>

            <button
              type="button"
              className="topbar-chatbot-pill"
              onClick={() => setShowChatbot(true)}
              title="Chat with AI Doubt Bot"
            >
              🤖 Ask AI Doubt Bot
            </button>

            <div className="topbar-role-pill student-pill">
              🎓 Student Portal
            </div>
            <div className="avatar" title={studentName}>
              {initials}
            </div>
          </div>
        </header>

        <section className="content">
          {active === "Dashboard" && (
            <>
              <div className="welcome-row">
                <div>
                  <p className="eyebrow">STUDENT DASHBOARD</p>
                  <h1>Welcome, {studentName} 👋</h1>
                  <p className="muted">
                    Ask doubts to your faculty, get fast AI explanations, and transfer questions anytime.
                  </p>
                </div>

                <div className="header-button-group">
                  <button
                    className="ai-chat-launcher-btn"
                    onClick={() => setShowChatbot(true)}
                  >
                    🤖 Chat with AI Bot
                  </button>
                  <button
                    className="primary-button"
                    onClick={() => handleOpenAskModal()}
                  >
                    ＋ Ask a Question
                  </button>
                </div>
              </div>

              {latestSectionNotice && (
                <div
                  className="dashboard-section-notice-banner"
                  onClick={() => setActive("Notifications")}
                >
                  <span className="banner-alert-icon">📢</span>
                  <div className="banner-notice-info">
                    <strong>Notice for Section {studentSection}: {latestSectionNotice.title}</strong>
                    <p>{latestSectionNotice.content.slice(0, 140)}{latestSectionNotice.content.length > 140 ? "..." : ""}</p>
                  </div>
                  <span className="banner-view-link">View in Notifications →</span>
                </div>
              )}

              <div className="stats">
                <div className="stat-card">
                  <span className="stat-icon purple">✉</span>
                  <p>Total Questions</p>
                  <h2>{totalQuestions}</h2>
                  <small>Submitted queries</small>
                </div>

                <div className="stat-card">
                  <span className="stat-icon blue">🤖</span>
                  <p>AI Fast-Answered</p>
                  <h2>{aiAnsweredCount}</h2>
                  <small>In 15-min review window</small>
                </div>

                <div className="stat-card">
                  <span className="stat-icon orange">◷</span>
                  <p>Pending Faculty</p>
                  <h2>{pendingFacultyCount}</h2>
                  <small>Awaiting teacher response</small>
                </div>

                <div className="stat-card">
                  <span className="stat-icon green">✓</span>
                  <p>Resolved</p>
                  <h2>{resolvedCount}</h2>
                  <small>By AI or Professor</small>
                </div>
              </div>

              <div className="section-heading">
                <div>
                  <h2>Recent Questions & Doubt Resolutions</h2>
                  <p className="muted">
                    Track faculty responses and AI fast answers with teacher transfer options.
                  </p>
                </div>

                <button
                  className="text-button"
                  onClick={() => setActive("My Questions")}
                >
                  View all ({totalQuestions}) →
                </button>
              </div>

              <div className="request-list">
                {loadingQuestions ? (
                  <div className="empty-box">
                    <p>Loading your questions...</p>
                  </div>
                ) : userQuestions.length === 0 ? (
                  <div className="empty-box">
                    <p>You haven't submitted any questions yet.</p>
                    <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "14px" }}>
                      <button
                        className="ai-chat-launcher-btn"
                        onClick={() => setShowChatbot(true)}
                      >
                        🤖 Ask AI Tutor
                      </button>
                      <button
                        className="primary-button"
                        onClick={() => handleOpenAskModal()}
                      >
                        Ask your first question
                      </button>
                    </div>
                  </div>
                ) : (
                  userQuestions.slice(0, 5).map((r) => renderQuestionCard(r, true))
                )}
              </div>

              <div className="bottom-grid">
                <div className="info-card">
                  <div className="section-heading">
                    <div>
                      <h2>Quick Actions</h2>
                      <p className="muted">Get academic help faster.</p>
                    </div>
                  </div>

                  <div className="quick-actions">
                    <button onClick={() => setShowChatbot(true)}>
                      🤖
                      <span>
                        <strong>AI Doubt Bot</strong>
                        <small>Instant help & answers</small>
                      </span>
                    </button>

                    <button onClick={() => handleOpenAskModal()}>
                      ＋
                      <span>
                        <strong>Ask a question</strong>
                        <small>Fast AI + Faculty transfer</small>
                      </span>
                    </button>

                    <button onClick={() => setActive("Appointments")}>
                      ▣
                      <span>
                        <strong>Office Hours</strong>
                        <small>Book consultation</small>
                      </span>
                    </button>
                  </div>
                </div>

                <div className="info-card announcement">
                  <span className="announcement-icon">✦</span>
                  <h2>Faculty Directory</h2>
                  <p>
                    Find the right professor, check office hours and cabin locations,
                    and submit doubts directly.
                  </p>
                  <button onClick={() => setActive("Faculty Directory")}>
                    Browse Faculty Directory →
                  </button>
                </div>
              </div>
            </>
          )}

          {active === "My Questions" && (
            <div className="my-questions-view">
              <div className="welcome-row">
                <div>
                  <p className="eyebrow">QUESTION HISTORY</p>
                  <h1>My Academic Questions</h1>
                  <p className="muted">
                    Review faculty answers, inspect AI explanations, and transfer questions to teachers.
                  </p>
                </div>

                <div className="header-button-group">
                  <button
                    className="ai-chat-launcher-btn"
                    onClick={() => setShowChatbot(true)}
                  >
                    🤖 Chat with AI Bot
                  </button>
                  <button
                    className="primary-button"
                    onClick={() => handleOpenAskModal()}
                  >
                    ＋ Ask New Question
                  </button>
                </div>
              </div>

              <div className="filter-controls-bar">
                <div className="filter-pills">
                  <button
                    className={`pill-btn ${statusFilter === "all" ? "active" : ""}`}
                    onClick={() => setStatusFilter("all")}
                  >
                    All ({totalQuestions})
                  </button>
                  <button
                    className={`pill-btn ${statusFilter === "AI" ? "active" : ""}`}
                    onClick={() => setStatusFilter("AI")}
                  >
                    🤖 AI Answered ({aiAnsweredCount})
                  </button>
                  <button
                    className={`pill-btn ${statusFilter === "Pending" ? "active" : ""}`}
                    onClick={() => setStatusFilter("Pending")}
                  >
                    ⏳ Pending Faculty ({pendingFacultyCount})
                  </button>
                  <button
                    className={`pill-btn ${statusFilter === "Answered" ? "active" : ""}`}
                    onClick={() => setStatusFilter("Answered")}
                  >
                    ✓ Resolved ({resolvedCount})
                  </button>
                </div>

                <input
                  type="text"
                  className="search-input"
                  placeholder="Search your questions, faculty, subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="request-list">
                {loadingQuestions ? (
                  <div className="empty-box">
                    <p>Loading questions...</p>
                  </div>
                ) : filteredQuestions.length === 0 ? (
                  <div className="empty-box">
                    <p>No questions found matching your filter.</p>
                  </div>
                ) : (
                  filteredQuestions.map((r) => renderQuestionCard(r, false))
                )}
              </div>
            </div>
          )}

          {active === "Notifications" && (
            <NotificationsView
              announcements={announcements}
              studentSection={studentSection}
              onUpdateSection={onUpdateSection}
              onOpenAskModalWithPrefill={(prefill) => handleOpenAskModal(prefill)}
            />
          )}

          {active === "Faculty Directory" && (
            <FacultyDirectory
              onSelectFacultyToAsk={(data) => {
                handleOpenAskModal(data);
              }}
            />
          )}

          {active === "Appointments" && (
            <AppointmentsView role="student" />
          )}

          {active === "FAQs" && <FaqView />}

          {active === "Settings" && (
            <SettingsView
              user={user}
              userProfile={userProfile}
              studentSection={studentSection}
              onUpdateSection={onUpdateSection}
              onUpdateProfile={onUpdateProfile}
            />
          )}
        </section>
      </main>

      {/* Floating Bottom-Right Chatbot Widget Button */}
      <button
        type="button"
        className="floating-ai-chatbot-btn"
        onClick={() => setShowChatbot(true)}
        title="Chat with AskMyFaculty AI Tutor"
      >
        <span className="floating-bot-icon">🤖</span>
        <span className="floating-bot-label">Ask AI Doubt Bot</span>
        <span className="floating-pulse-dot"></span>
      </button>

      {/* Interactive AI Chatbot Window */}
      <AiChatbotModal
        isOpen={showChatbot}
        onClose={() => setShowChatbot(false)}
        userProfile={userProfile}
        onSubmitQuery={onSubmitQuestion}
        initialSubject={initialSubject}
        initialFaculty={initialFaculty}
      />

      {/* Ask Question Modal */}
      <AskQuestionModal
        isOpen={showAskModal}
        onClose={() => setShowAskModal(false)}
        onSubmit={handleQuestionSubmit}
        submitting={submitting}
        initialSubject={initialSubject}
        initialFaculty={initialFaculty}
      />
    </div>
  );
}

export default StudentInterface;
