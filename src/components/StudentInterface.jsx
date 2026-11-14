import { useState } from "react";
import AskQuestionModal from "./AskQuestionModal";
import FacultyDirectory from "./FacultyDirectory";
import AppointmentsView from "./AppointmentsView";
import FaqView from "./FaqView";

function StudentInterface({
  user,
  userProfile,
  userQuestions,
  loadingQuestions,
  onSubmitQuestion,
  onLogout
}) {
  const [active, setActive] = useState("Dashboard");
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [showAskModal, setShowAskModal] = useState(false);
  const [initialSubject, setInitialSubject] = useState("");
  const [initialFaculty, setInitialFaculty] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const studentName =
    userProfile?.name || user?.displayName || user?.email?.split("@")[0] || "Student";

  const initials = studentName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const totalQuestions = userQuestions.length;
  const pendingCount = userQuestions.filter((q) => q.status === "Pending").length;
  const inProgressCount = userQuestions.filter((q) => q.status === "In Progress").length;
  const resolvedCount = userQuestions.filter((q) => q.status === "Answered").length;

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

  const filteredQuestions = userQuestions.filter((q) => {
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "Pending" && q.status === "Pending") ||
      (statusFilter === "In Progress" && q.status === "In Progress") ||
      (statusFilter === "Answered" && q.status === "Answered");

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
    { name: "Faculty Directory", icon: "♙" },
    { name: "Appointments", icon: "▣" },
    { name: "FAQs", icon: "?" }
  ];

  return (
    <div className={`app student-theme ${!sidebarVisible ? "sidebar-hidden" : ""}`}>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">A</span>
          <div>
            <div>AskMyFaculty</div>
            <div className="portal-subtag student-tag">Student Portal</div>
          </div>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={() => setSidebarVisible(false)}
            title="Hide Sidebar"
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
              onClick={() => setActive(item.name)}
            >
              <span>{item.icon}</span>
              {item.name}
              {item.name === "My Questions" && pendingCount > 0 && (
                <span className="nav-badge orange-badge">{pendingCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <strong>Need help?</strong>
            <p>Find answers to common academic questions.</p>
            <button onClick={() => setActive("FAQs")}>
              Visit Help Center →
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
                    Ask doubts to your faculty, follow replies, and manage consultations.
                  </p>
                </div>

                <button
                  className="primary-button"
                  onClick={() => handleOpenAskModal()}
                >
                  ＋ Ask a Question
                </button>
              </div>

              <div className="stats">
                <div className="stat-card">
                  <span className="stat-icon purple">✉</span>
                  <p>Total Questions</p>
                  <h2>{totalQuestions}</h2>
                  <small>Across all enrolled subjects</small>
                </div>

                <div className="stat-card">
                  <span className="stat-icon orange">◷</span>
                  <p>Pending Responses</p>
                  <h2>{pendingCount}</h2>
                  <small>Awaiting faculty response</small>
                </div>

                <div className="stat-card">
                  <span className="stat-icon green">✓</span>
                  <p>Resolved</p>
                  <h2>{resolvedCount}</h2>
                  <small>Questions answered by faculty</small>
                </div>
              </div>

              <div className="section-heading">
                <div>
                  <h2>Recent Questions & Answers</h2>
                  <p className="muted">
                    Track faculty responses to your submitted doubts.
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
                    <button
                      className="primary-button"
                      style={{ marginTop: "12px" }}
                      onClick={() => handleOpenAskModal()}
                    >
                      Ask your first question
                    </button>
                  </div>
                ) : (
                  userQuestions.slice(0, 5).map((r) => (
                    <article className="request-card" key={r.id}>
                      <div className="request-symbol">✉</div>

                      <div className="request-info">
                        <div className="request-meta">
                          <span className="subject-tag">
                            {r.subjectCode} • {r.subjectName}
                          </span>
                          <span>•</span>
                          <span>Faculty: <strong>{r.facultyName}</strong></span>
                        </div>

                        <h3 className="query-title">{r.question}</h3>

                        <p className="query-date">
                          Asked:{" "}
                          {r.createdAt?.toDate
                            ? r.createdAt.toDate().toLocaleString()
                            : "Just now"}
                        </p>

                        {r.answer && (
                          <div className="faculty-answer-preview">
                            <div className="answer-header">
                              <span className="answer-author-badge">
                                👨‍🏫 Answer from {r.answeredBy || r.facultyName}
                              </span>
                              {r.answeredAt?.toDate && (
                                <span className="answer-time">
                                  {r.answeredAt.toDate().toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <p className="answer-text">{r.answer}</p>
                          </div>
                        )}
                      </div>

                      <span
                        className={`status ${r.status
                          ?.toLowerCase()
                          .replace(" ", "-") || "pending"}`}
                      >
                        {r.status || "Pending"}
                      </span>
                    </article>
                  ))
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
                    <button onClick={() => handleOpenAskModal()}>
                      ＋
                      <span>
                        <strong>Ask a question</strong>
                        <small>Direct query to faculty</small>
                      </span>
                    </button>

                    <button onClick={() => setActive("Appointments")}>
                      ▣
                      <span>
                        <strong>Office Hours</strong>
                        <small>Book consultation</small>
                      </span>
                    </button>

                    <button onClick={() => setActive("FAQs")}>
                      ?
                      <span>
                        <strong>Browse FAQs</strong>
                        <small>Instant answers</small>
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
                    Review faculty answers, follow pending doubts, and search past queries.
                  </p>
                </div>

                <button
                  className="primary-button"
                  onClick={() => handleOpenAskModal()}
                >
                  ＋ Ask New Question
                </button>
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
                    className={`pill-btn ${statusFilter === "Pending" ? "active" : ""}`}
                    onClick={() => setStatusFilter("Pending")}
                  >
                    Pending ({pendingCount})
                  </button>
                  <button
                    className={`pill-btn ${statusFilter === "In Progress" ? "active" : ""}`}
                    onClick={() => setStatusFilter("In Progress")}
                  >
                    In Progress ({inProgressCount})
                  </button>
                  <button
                    className={`pill-btn ${statusFilter === "Answered" ? "active" : ""}`}
                    onClick={() => setStatusFilter("Answered")}
                  >
                    Answered ({resolvedCount})
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
                  filteredQuestions.map((r) => (
                    <article className="request-card full-card" key={r.id}>
                      <div className="request-symbol">✉</div>

                      <div className="request-info">
                        <div className="request-meta">
                          <span className="subject-tag">
                            {r.subjectCode}: {r.subjectName}
                          </span>
                          <span>•</span>
                          <span>Faculty: <strong>{r.facultyName}</strong></span>
                        </div>

                        <h3 className="query-title">{r.question}</h3>

                        <p className="query-date">
                          Submitted on:{" "}
                          {r.createdAt?.toDate
                            ? r.createdAt.toDate().toLocaleString()
                            : "Recently"}
                        </p>

                        {r.answer ? (
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
                            <div className="answer-content-body">
                              {r.answer}
                            </div>
                          </div>
                        ) : (
                          <div className="pending-notice">
                            ⏳ Awaiting response from {r.facultyName}. Usually replies within 24-48 hours.
                          </div>
                        )}
                      </div>

                      <div className="request-card-right">
                        <span
                          className={`status ${r.status
                            ?.toLowerCase()
                            .replace(" ", "-") || "pending"}`}
                        >
                          {r.status || "Pending"}
                        </span>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
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
        </section>
      </main>

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
