import { useState, useMemo } from "react";
import { availableSections } from "../sections";
import { subjectFaculty } from "../subjectFaculty";

export default function FacultyNoticesView({
  announcements = [],
  facultyName,
  onOpenCreateModal,
  onDeleteNotice
}) {
  const [sectionFilter, setSectionFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNotices = useMemo(() => {
    return announcements.filter((n) => {
      // Section filter
      const matchesSection =
        sectionFilter === "all" ||
        (n.targetSections &&
          (n.targetSections.includes("All") || n.targetSections.includes(sectionFilter)));

      // Subject filter
      const matchesSubject =
        subjectFilter === "all" || n.subjectCode === subjectFilter;

      // Search query
      const matchesSearch =
        n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.facultyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.subjectName?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSection && matchesSubject && matchesSearch;
    });
  }, [announcements, sectionFilter, subjectFilter, searchQuery]);

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
    <div className="faculty-notices-view">
      <div className="welcome-row">
        <div>
          <p className="eyebrow faculty-eyebrow">BROADCAST SYSTEM</p>
          <h1>Section Announcements & Notices</h1>
          <p className="muted">
            Send targeted updates, exam reminders, and lab instructions to specific student sections.
          </p>
        </div>

        <button
          type="button"
          className="faculty-primary-button"
          onClick={onOpenCreateModal}
        >
          ＋ Broadcast New Notice
        </button>
      </div>

      <div className="filter-controls-bar">
        <div className="filter-pills">
          <button
            className={`pill-btn ${sectionFilter === "all" ? "active" : ""}`}
            onClick={() => setSectionFilter("all")}
          >
            All Sections ({announcements.length})
          </button>
          {availableSections.map((sec) => {
            const count = announcements.filter(
              (n) =>
                n.targetSections &&
                (n.targetSections.includes("All") || n.targetSections.includes(sec))
            ).length;
            return (
              <button
                key={sec}
                className={`pill-btn ${sectionFilter === sec ? "active" : ""}`}
                onClick={() => setSectionFilter(sec)}
              >
                {sec} ({count})
              </button>
            );
          })}
        </div>

        <div className="filter-dropdowns">
          <select
            className="filter-select"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
          >
            <option value="all">All Courses</option>
            {subjectFaculty.map((sub) => (
              <option key={sub.code} value={sub.code}>
                {sub.code} — {sub.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            className="search-input"
            placeholder="Search notices, topics, sections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="notices-grid">
        {filteredNotices.length === 0 ? (
          <div className="empty-box notices-empty-box">
            <span style={{ fontSize: "32px", display: "block", marginBottom: "8px" }}>📢</span>
            <h3>No section notices found</h3>
            <p>You haven't posted any notices matching this filter yet.</p>
            <button
              className="faculty-primary-button"
              style={{ marginTop: "12px" }}
              onClick={onOpenCreateModal}
            >
              Broadcast your first notice
            </button>
          </div>
        ) : (
          filteredNotices.map((notice) => (
            <article className="faculty-notice-card" key={notice.id}>
              <div className="notice-card-top">
                <div className="notice-badges-left">
                  <span className={getPriorityBadgeClass(notice.priority)}>
                    {notice.priority === "Urgent" && "🚨 "}
                    {notice.priority === "Exam" && "📝 "}
                    {notice.priority === "Assignment" && "📁 "}
                    {notice.priority === "General" && "📢 "}
                    {notice.priority || "Notice"}
                  </span>

                  {notice.subjectCode && notice.subjectCode !== "General" && (
                    <span className="subject-tag">
                      {notice.subjectCode}: {notice.subjectName}
                    </span>
                  )}
                </div>

                <div className="notice-card-actions">
                  <button
                    type="button"
                    className="delete-notice-btn"
                    title="Delete notice"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this notice?")) {
                        onDeleteNotice(notice.id);
                      }
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <h3 className="notice-card-title">{notice.title}</h3>
              <p className="notice-card-body">{notice.content}</p>

              <div className="notice-target-sections-row">
                <span className="sections-label">Target Audience:</span>
                <div className="section-pills-list">
                  {notice.targetSections?.map((sec) => (
                    <span key={sec} className="target-section-pill">
                      {sec === "All" ? "🌐 All Sections" : `Section ${sec}`}
                    </span>
                  ))}
                </div>
              </div>

              <div className="notice-card-footer">
                <span className="notice-author">
                  Posted by <strong>{notice.facultyName || facultyName}</strong>
                </span>
                <span className="notice-time">
                  {notice.createdAt?.toDate
                    ? notice.createdAt.toDate().toLocaleString([], {
                        dateStyle: "medium",
                        timeStyle: "short"
                      })
                    : "Just now"}
                </span>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
