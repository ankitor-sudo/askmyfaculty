import { useState, useMemo } from "react";
import { availableSections, isSectionMatching } from "../sections";

export default function NotificationsView({
  announcements = [],
  studentSection = "K25PS",
  onUpdateSection,
  onOpenAskModalWithPrefill
}) {
  const [activeFilter, setActiveFilter] = useState("all"); // "all" | "section" | "Urgent" | "Exam" | "Assignment" | "unread"
  const [readIds, setReadIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("askmyfaculty_read_notices") || "[]");
    } catch {
      return [];
    }
  });

  const handleMarkAsRead = (id) => {
    setReadIds((prev) => {
      const next = prev.includes(id) ? prev : [...prev, id];
      try {
        localStorage.setItem("askmyfaculty_read_notices", JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const handleMarkAllRead = () => {
    const allIds = announcements.map((n) => n.id);
    setReadIds(allIds);
    try {
      localStorage.setItem("askmyfaculty_read_notices", JSON.stringify(allIds));
    } catch (e) {
      console.error(e);
    }
  };

  // Announcements that apply to this student's section
  const sectionMatchingNotices = useMemo(() => {
    return announcements.filter((n) => isSectionMatching(n.targetSections, studentSection));
  }, [announcements, studentSection]);

  // Filtered list based on active pill
  const filteredNotices = useMemo(() => {
    return sectionMatchingNotices.filter((n) => {
      const isUnread = !readIds.includes(n.id);

      if (activeFilter === "all") return true;
      if (activeFilter === "section") {
        return n.targetSections && n.targetSections.includes(studentSection);
      }
      if (activeFilter === "unread") return isUnread;
      if (activeFilter === "Urgent") return n.priority === "Urgent";
      if (activeFilter === "Exam") return n.priority === "Exam";
      if (activeFilter === "Assignment") return n.priority === "Assignment";

      return true;
    });
  }, [sectionMatchingNotices, activeFilter, readIds, studentSection]);

  const unreadCount = sectionMatchingNotices.filter((n) => !readIds.includes(n.id)).length;

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case "Urgent":
        return "priority-badge urgent";
      case "Exam":
        return "priority-badge exam";
      case "Assignment":
        return "priority-badge assignment";
      default:
        return "priority-badge general";
    }
  };

  return (
    <div className="notifications-portal-view">
      {/* Header */}
      <div className="welcome-row">
        <div>
          <p className="eyebrow">STUDENT ALERTS & NOTICES</p>
          <h1>Class Notifications & Broadcasts</h1>
          <p className="muted">
            Important notices, lab schedules, and exam alerts posted by your course professors.
          </p>
        </div>

        {/* Section Switcher in Header */}
        <div className="student-section-selector-card">
          <span className="section-selector-label">My Class Section:</span>
          <select
            className="student-section-dropdown"
            value={studentSection}
            onChange={(e) => onUpdateSection && onUpdateSection(e.target.value)}
          >
            {availableSections.map((sec) => (
              <option key={sec} value={sec}>
                Section {sec}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter Bar & Actions */}
      <div className="filter-controls-bar">
        <div className="filter-pills">
          <button
            className={`pill-btn ${activeFilter === "all" ? "active" : ""}`}
            onClick={() => setActiveFilter("all")}
          >
            All Notices ({sectionMatchingNotices.length})
          </button>
          <button
            className={`pill-btn ${activeFilter === "section" ? "active" : ""}`}
            onClick={() => setActiveFilter("section")}
          >
            📌 Section {studentSection} (
            {
              sectionMatchingNotices.filter(
                (n) => n.targetSections && n.targetSections.includes(studentSection)
              ).length
            }
            )
          </button>
          <button
            className={`pill-btn ${activeFilter === "unread" ? "active" : ""}`}
            onClick={() => setActiveFilter("unread")}
          >
            🔔 Unread ({unreadCount})
          </button>
          <button
            className={`pill-btn ${activeFilter === "Exam" ? "active" : ""}`}
            onClick={() => setActiveFilter("Exam")}
          >
            📝 Exams
          </button>
          <button
            className={`pill-btn ${activeFilter === "Assignment" ? "active" : ""}`}
            onClick={() => setActiveFilter("Assignment")}
          >
            📁 Assignments
          </button>
          <button
            className={`pill-btn ${activeFilter === "Urgent" ? "active" : ""}`}
            onClick={() => setActiveFilter("Urgent")}
          >
            🚨 Urgent
          </button>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            className="mark-all-read-btn"
            onClick={handleMarkAllRead}
          >
            ✓ Mark all as read
          </button>
        )}
      </div>

      {/* Notification Cards List */}
      <div className="notifications-feed-list">
        {filteredNotices.length === 0 ? (
          <div className="empty-box notifications-empty">
            <span className="bell-empty-icon">🔔</span>
            <h3>No notifications to display</h3>
            <p>
              You're all caught up! When professors post updates for section {studentSection}, they will appear right here.
            </p>
          </div>
        ) : (
          filteredNotices.map((n) => {
            const isUnread = !readIds.includes(n.id);

            return (
              <article
                key={n.id}
                className={`notification-card ${isUnread ? "unread-card" : ""}`}
                onClick={() => isUnread && handleMarkAsRead(n.id)}
              >
                <div className="notif-card-header">
                  <div className="notif-badges-row">
                    {isUnread && (
                      <span className="unread-pulse-badge">
                        ● NEW
                      </span>
                    )}

                    <span className={getPriorityBadgeClass(n.priority)}>
                      {n.priority === "Urgent" && "🚨 "}
                      {n.priority === "Exam" && "📝 "}
                      {n.priority === "Assignment" && "📁 "}
                      {n.priority === "General" && "📢 "}
                      {n.priority || "Notice"}
                    </span>

                    {n.subjectCode && n.subjectCode !== "General" && (
                      <span className="subject-tag">
                        {n.subjectCode}: {n.subjectName}
                      </span>
                    )}

                    {n.targetSections?.map((sec) => (
                      <span
                        key={sec}
                        className={`target-section-pill ${
                          sec === studentSection ? "highlight-section" : ""
                        }`}
                      >
                        {sec === "All" ? "🌐 All Sections" : `Section ${sec}`}
                      </span>
                    ))}
                  </div>

                  <span className="notif-timestamp">
                    {n.createdAt?.toDate
                      ? n.createdAt.toDate().toLocaleString([], {
                          dateStyle: "medium",
                          timeStyle: "short"
                        })
                      : "Just now"}
                  </span>
                </div>

                <h3 className="notif-title">{n.title}</h3>
                <p className="notif-body-text">{n.content}</p>

                <div className="notif-footer-row">
                  <div className="faculty-author-tag">
                    👨‍🏫 Posted by <strong>Prof. {n.facultyName || "Faculty"}</strong>
                  </div>

                  <div className="notif-actions-group">
                    {onOpenAskModalWithPrefill && n.subjectCode && n.subjectCode !== "General" && (
                      <button
                        type="button"
                        className="notif-ask-doubt-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAskModalWithPrefill({
                            subject: n.subjectCode,
                            faculty: n.facultyName
                          });
                        }}
                      >
                        Ask Doubt about this Notice →
                      </button>
                    )}

                    {isUnread && (
                      <button
                        type="button"
                        className="mark-single-read-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(n.id);
                        }}
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
