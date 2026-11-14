import { useState, useMemo } from "react";
import AnswerModal from "./AnswerModal";
import AppointmentsView from "./AppointmentsView";
import FaqView from "./FaqView";
import { getSubjectsForFaculty, subjectFaculty } from "../subjectFaculty";

function FacultyInterface({
  user,
  userProfile,
  allQueries,
  loadingQueries,
  onUpdateQueryAnswer,
  onUpdateQueryStatus,
  onLogout
}) {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const facultyName =
    userProfile?.facultyName || user?.displayName || user?.email?.split("@")[0] || "Faculty";
  const [queryScope, setQueryScope] = useState("assigned"); // "assigned" or "all"
  const [statusFilter, setStatusFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQueryForAnswer, setSelectedQueryForAnswer] = useState(null);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  const taughtSubjects = useMemo(() => {
    return getSubjectsForFaculty(facultyName);
  }, [facultyName]);

  const initials = facultyName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Queries assigned to this faculty
  const assignedQueries = useMemo(() => {
    return allQueries.filter((q) => {
      if (!q.facultyName) return false;
      return (
        q.facultyName.trim().toLowerCase() === facultyName.trim().toLowerCase()
      );
    });
  }, [allQueries, facultyName]);

  // Queries to display based on scope ("assigned" vs "all")
  const scopedQueries = queryScope === "assigned" ? assignedQueries : allQueries;

  // Filtered queries based on status, subject, search
  const filteredQueries = useMemo(() => {
    return scopedQueries.filter((q) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "Pending" && q.status === "Pending") ||
        (statusFilter === "In Progress" && q.status === "In Progress") ||
        (statusFilter === "Answered" && q.status === "Answered");

      const matchesSubject =
        subjectFilter === "all" || q.subjectCode === subjectFilter;

      const matchesSearch =
        q.question?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.studentEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.subjectName?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesStatus && matchesSubject && matchesSearch;
    });
  }, [scopedQueries, statusFilter, subjectFilter, searchQuery]);

  // Statistics for the faculty
  const totalAssigned = assignedQueries.length;
  const pendingAssigned = assignedQueries.filter((q) => q.status === "Pending").length;
  const inProgressAssigned = assignedQueries.filter((q) => q.status === "In Progress").length;
  const resolvedAssigned = assignedQueries.filter((q) => q.status === "Answered").length;

  const handleOpenAnswerModal = (q) => {
    setSelectedQueryForAnswer(q);
  };

  const handleSubmitAnswer = async (queryId, answerText, status) => {
    try {
      setSubmittingAnswer(true);
      await onUpdateQueryAnswer(queryId, answerText, status, facultyName);
      setSelectedQueryForAnswer(null);
      return true;
    } catch (err) {
      alert("Failed to submit response: " + err.message);
      return false;
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleQuickStatusChange = async (queryId, newStatus) => {
    try {
      await onUpdateQueryStatus(queryId, newStatus);
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  const menu = [
    { name: "Dashboard", icon: "▦" },
    { name: "Incoming Queries", icon: "✉" },
    { name: "Office Hours", icon: "▣" },
    { name: "My Subjects", icon: "♙" },
    { name: "Academic FAQs", icon: "?" }
  ];

  return (
    <div className={`app faculty-theme ${!sidebarVisible ? "sidebar-hidden" : ""}`}>
      <aside className="sidebar faculty-sidebar">
        <div className="brand">
          <span className="brand-icon faculty-brand-icon">F</span>
          <div>
            <div>AskMyFaculty</div>
            <div className="portal-subtag faculty-tag">Faculty Portal</div>
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

        <div className="faculty-identity-box">
          <div className="faculty-identity-label">LOGGED IN AS</div>
          <div className="faculty-identity-name">{facultyName}</div>
        </div>

        <p className="menu-label">FACULTY WORKSPACE</p>

        <nav>
          {menu.map((item) => (
            <button
              key={item.name}
              className={
                activeTab === item.name
                  ? "nav-item faculty-nav-active"
                  : "nav-item"
              }
              onClick={() => setActiveTab(item.name)}
            >
              <span>{item.icon}</span>
              {item.name}
              {item.name === "Incoming Queries" && pendingAssigned > 0 && (
                <span className="nav-badge orange-badge">{pendingAssigned}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card faculty-tip-card">
            <strong>Faculty Tip</strong>
            <p>
              Answering queries within 24 hours keeps student engagement high.
            </p>
          </div>

          <div className="profile">
            <div className="avatar faculty-avatar">{initials}</div>
            <div className="profile-info">
              <strong>{facultyName}</strong>
              <small>Faculty Member</small>
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
              className="sidebar-toggle-btn faculty-toggle-btn"
              onClick={() => setSidebarVisible(!sidebarVisible)}
              title={sidebarVisible ? "Disable Sidebar (Hide)" : "Enable Sidebar (Show)"}
            >
              <span className="toggle-icon">{sidebarVisible ? "◀" : "☰"}</span>
              <span className="toggle-text">{sidebarVisible ? "Hide Sidebar" : "Show Sidebar"}</span>
            </button>

            <div className="breadcrumb">
              Faculty Workspace <span>/</span> {activeTab}
            </div>
          </div>

          <div className="top-actions">
            <div className="topbar-role-pill faculty-pill">
              👨‍🏫 Faculty Portal
            </div>
            <div className="avatar faculty-avatar" title={facultyName}>
              {initials}
            </div>
          </div>
        </header>

        <section className="content">
          {activeTab === "Dashboard" && (
            <>
              <div className="welcome-row">
                <div>
                  <p className="eyebrow faculty-eyebrow">FACULTY PORTAL • OVERVIEW</p>
                  <h1>Welcome, {facultyName} 👋</h1>
                  <p className="muted">
                    Review and resolve student queries, coordinate office hours, and track course doubts.
                  </p>
                </div>

                <div className="header-badge-group">
                  <span className="status-live-badge">● Available for Queries</span>
                </div>
              </div>

              <div className="stats faculty-stats">
                <div className="stat-card">
                  <span className="stat-icon purple">📥</span>
                  <p>Assigned Queries</p>
                  <h2>{totalAssigned}</h2>
                  <small>Questions specifically for you</small>
                </div>

                <div className="stat-card">
                  <span className="stat-icon orange">⏳</span>
                  <p>Needs Response</p>
                  <h2>{pendingAssigned}</h2>
                  <small>Pending student questions</small>
                </div>

                <div className="stat-card">
                  <span className="stat-icon blue">◷</span>
                  <p>In Progress</p>
                  <h2>{inProgressAssigned}</h2>
                  <small>Under ongoing review</small>
                </div>

                <div className="stat-card">
                  <span className="stat-icon green">✓</span>
                  <p>Resolved</p>
                  <h2>{resolvedAssigned}</h2>
                  <small>Successfully answered</small>
                </div>
              </div>

              <div className="section-heading">
                <div>
                  <h2>Urgent Queries Requiring Your Response</h2>
                  <p className="muted">
                    Showing latest pending questions submitted to you.
                  </p>
                </div>

                <button
                  className="text-button"
                  onClick={() => {
                    setActiveTab("Incoming Queries");
                    setStatusFilter("Pending");
                  }}
                >
                  View All Queries ({totalAssigned}) →
                </button>
              </div>

              <div className="request-list">
                {loadingQueries ? (
                  <div className="empty-box">
                    <p>Loading queries...</p>
                  </div>
                ) : assignedQueries.filter((q) => q.status === "Pending").length === 0 ? (
                  <div className="empty-box success-empty">
                    <span className="celebrate-icon">🎉</span>
                    <h3>All caught up!</h3>
                    <p>No pending queries are waiting for your response right now.</p>
                  </div>
                ) : (
                  assignedQueries
                    .filter((q) => q.status === "Pending")
                    .slice(0, 5)
                    .map((q) => (
                      <article className="request-card faculty-card-item" key={q.id}>
                        <div className="request-symbol faculty-symbol">✉</div>

                        <div className="request-info">
                          <div className="request-meta">
                            <span className="student-name-tag">
                              👤 {q.studentName || "Student"} ({q.studentEmail || "No email"})
                            </span>
                            <span>•</span>
                            <span className="subject-tag">
                              {q.subjectCode}: {q.subjectName}
                            </span>
                          </div>

                          <h3 className="query-title">{q.question}</h3>

                          <p className="query-date">
                            Received:{" "}
                            {q.createdAt?.toDate
                              ? q.createdAt.toDate().toLocaleString()
                              : "Just now"}
                          </p>
                        </div>

                        <div className="faculty-card-actions">
                          <span className="status pending">Pending</span>
                          <button
                            className="faculty-primary-button"
                            onClick={() => handleOpenAnswerModal(q)}
                          >
                            ✍️ Answer Now
                          </button>
                        </div>
                      </article>
                    ))
                )}
              </div>

              <div className="bottom-grid">
                <div className="info-card">
                  <div className="section-heading">
                    <div>
                      <h2>My Teaching Roster</h2>
                      <p className="muted">Subjects under your instruction</p>
                    </div>
                  </div>

                  <div className="subjects-list-compact">
                    {taughtSubjects.map((sub) => (
                      <div className="roster-item" key={sub.code}>
                        <div className="roster-code-box">{sub.code}</div>
                        <div className="roster-details">
                          <strong>{sub.name}</strong>
                          <small>Co-instructors: {sub.faculty.join(", ")}</small>
                        </div>
                        <button
                          className="view-subject-btn"
                          onClick={() => {
                            setActiveTab("Incoming Queries");
                            setSubjectFilter(sub.code);
                          }}
                        >
                          Filter Queries →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="info-card faculty-tip-box">
                  <span className="announcement-icon">💡</span>
                  <h2>Office Hours Guidelines</h2>
                  <p>
                    Regular office consultations allow addressing complex design or
                    algorithmic questions that cannot be resolved in a single text reply.
                  </p>
                  <button
                    className="faculty-text-btn"
                    onClick={() => setActiveTab("Office Hours")}
                  >
                    View Appointment Schedule →
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === "Incoming Queries" && (
            <div className="faculty-queries-view">
              <div className="welcome-row">
                <div>
                  <p className="eyebrow faculty-eyebrow">STUDENT INQUIRIES</p>
                  <h1>Incoming Academic Queries</h1>
                  <p className="muted">
                    Review, resolve, and answer student questions across your courses.
                  </p>
                </div>

                <div className="scope-toggle-group">
                  <button
                    className={`scope-btn ${queryScope === "assigned" ? "active" : ""}`}
                    onClick={() => setQueryScope("assigned")}
                  >
                    Direct to Me ({totalAssigned})
                  </button>
                  <button
                    className={`scope-btn ${queryScope === "all" ? "active" : ""}`}
                    onClick={() => setQueryScope("all")}
                  >
                    All Department Queries ({allQueries.length})
                  </button>
                </div>
              </div>

              <div className="filter-controls-bar">
                <div className="filter-pills">
                  <button
                    className={`pill-btn ${statusFilter === "all" ? "active" : ""}`}
                    onClick={() => setStatusFilter("all")}
                  >
                    All ({scopedQueries.length})
                  </button>
                  <button
                    className={`pill-btn ${statusFilter === "Pending" ? "active" : ""}`}
                    onClick={() => setStatusFilter("Pending")}
                  >
                    Pending ({scopedQueries.filter((q) => q.status === "Pending").length})
                  </button>
                  <button
                    className={`pill-btn ${statusFilter === "In Progress" ? "active" : ""}`}
                    onClick={() => setStatusFilter("In Progress")}
                  >
                    In Progress ({scopedQueries.filter((q) => q.status === "In Progress").length})
                  </button>
                  <button
                    className={`pill-btn ${statusFilter === "Answered" ? "active" : ""}`}
                    onClick={() => setStatusFilter("Answered")}
                  >
                    Answered ({scopedQueries.filter((q) => q.status === "Answered").length})
                  </button>
                </div>

                <div className="filter-dropdowns">
                  <select
                    className="filter-select"
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                  >
                    <option value="all">All Subjects</option>
                    {subjectFaculty.map((sub) => (
                      <option key={sub.code} value={sub.code}>
                        {sub.code} — {sub.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search by student, query, topic..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="request-list">
                {loadingQueries ? (
                  <div className="empty-box">
                    <p>Loading questions...</p>
                  </div>
                ) : filteredQueries.length === 0 ? (
                  <div className="empty-box">
                    <p>No queries found matching the selected filters.</p>
                  </div>
                ) : (
                  filteredQueries.map((q) => (
                    <article className="request-card faculty-card-item full-card" key={q.id}>
                      <div className="request-symbol faculty-symbol">✉</div>

                      <div className="request-info">
                        <div className="request-meta">
                          <span className="student-name-tag">
                            👤 {q.studentName || "Student"} • {q.studentEmail || ""}
                          </span>
                          <span>•</span>
                          <span className="subject-tag">
                            {q.subjectCode}: {q.subjectName}
                          </span>
                          {queryScope === "all" && (
                            <>
                              <span>•</span>
                              <span>Target Faculty: <strong>{q.facultyName}</strong></span>
                            </>
                          )}
                        </div>

                        <h3 className="query-title">{q.question}</h3>

                        <p className="query-date">
                          Submitted on:{" "}
                          {q.createdAt?.toDate
                            ? q.createdAt.toDate().toLocaleString()
                            : "Recently"}
                        </p>

                        {q.answer ? (
                          <div className="faculty-answer-box faculty-view-answer">
                            <div className="answer-badge-header">
                              <span className="faculty-check-icon">✓</span>
                              <strong>
                                Answered by {q.answeredBy || q.facultyName}
                              </strong>
                              {q.answeredAt?.toDate && (
                                <span className="answered-date-tag">
                                  {q.answeredAt.toDate().toLocaleString()}
                                </span>
                              )}
                            </div>
                            <div className="answer-content-body">{q.answer}</div>
                          </div>
                        ) : (
                          <div className="pending-badge-notice">
                            ⏳ Waiting for your response.
                          </div>
                        )}
                      </div>

                      <div className="faculty-card-right-col">
                        <select
                          className={`status-select ${q.status?.toLowerCase().replace(" ", "-") || "pending"}`}
                          value={q.status || "Pending"}
                          onChange={(e) => handleQuickStatusChange(q.id, e.target.value)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Answered">Answered</option>
                        </select>

                        <button
                          className="faculty-primary-button"
                          onClick={() => handleOpenAnswerModal(q)}
                        >
                          {q.answer ? "✏️ Edit Answer" : "✍️ Write Answer"}
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "Office Hours" && (
            <AppointmentsView
              role="faculty"
              currentFacultyName={facultyName}
            />
          )}

          {activeTab === "My Subjects" && (
            <div className="subjects-roster-view">
              <div className="welcome-row">
                <div>
                  <p className="eyebrow faculty-eyebrow">TEACHING RESPONSIBILITIES</p>
                  <h1>Courses & Subject Rosters</h1>
                  <p className="muted">
                    Overview of courses you instruct and queries generated per subject.
                  </p>
                </div>
              </div>

              <div className="faculty-grid">
                {taughtSubjects.map((sub) => {
                  const subQueries = allQueries.filter((q) => q.subjectCode === sub.code);
                  const pendingSubQueries = subQueries.filter((q) => q.status === "Pending");
                  const answeredSubQueries = subQueries.filter((q) => q.status === "Answered");

                  return (
                    <div className="faculty-card subject-card" key={sub.code}>
                      <div className="faculty-card-top">
                        <div className="roster-big-icon">📚</div>
                        <div>
                          <h3 className="faculty-name">{sub.name}</h3>
                          <p className="faculty-dept">Course Code: {sub.code}</p>
                        </div>
                      </div>

                      <div className="subject-stat-pills">
                        <div className="sub-stat">
                          <strong>{subQueries.length}</strong>
                          <small>Total Queries</small>
                        </div>
                        <div className="sub-stat">
                          <strong style={{ color: "#d97706" }}>{pendingSubQueries.length}</strong>
                          <small>Pending</small>
                        </div>
                        <div className="sub-stat">
                          <strong style={{ color: "#059669" }}>{answeredSubQueries.length}</strong>
                          <small>Resolved</small>
                        </div>
                      </div>

                      <div className="faculty-details">
                        <div className="detail-item">
                          <span className="detail-label">Co-Instructors:</span>
                          <span className="detail-value">{sub.faculty.join(", ")}</span>
                        </div>
                      </div>

                      <button
                        className="ask-faculty-btn"
                        onClick={() => {
                          setActiveTab("Incoming Queries");
                          setSubjectFilter(sub.code);
                        }}
                      >
                        View {sub.code} Queries →
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "Academic FAQs" && <FaqView />}
        </section>
      </main>

      <AnswerModal
        isOpen={!!selectedQueryForAnswer}
        onClose={() => setSelectedQueryForAnswer(null)}
        queryItem={selectedQueryForAnswer}
        onSubmitAnswer={handleSubmitAnswer}
        submitting={submittingAnswer}
      />
    </div>
  );
}

export default FacultyInterface;
