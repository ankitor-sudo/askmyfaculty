import { useState } from "react";
import { subjectFaculty } from "../subjectFaculty";

function FacultyDirectory({ onSelectFacultyToAsk }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState("all");

  const facultyCards = [];
  subjectFaculty.forEach((sub) => {
    sub.faculty.forEach((fName) => {
      const existing = facultyCards.find((c) => c.name === fName);
      if (existing) {
        if (!existing.subjects.includes(sub.name)) {
          existing.subjects.push({ code: sub.code, name: sub.name });
        }
      } else {
        facultyCards.push({
          name: fName,
          department: "Computer Science & Engineering",
          subjects: [{ code: sub.code, name: sub.name }],
          officeHours: "Mon, Wed • 2:00 PM - 4:00 PM",
          cabin: "Block 34, Cabin 204"
        });
      }
    });
  });

  const filteredFaculty = facultyCards.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.subjects.some(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesSubject =
      selectedSubjectFilter === "all" ||
      f.subjects.some((s) => s.code === selectedSubjectFilter);
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="directory-view">
      <div className="directory-header-row">
        <div>
          <h2>Faculty Directory</h2>
          <p className="muted">
            Connect directly with your course professors and instructors.
          </p>
        </div>

        <div className="directory-filters">
          <input
            type="text"
            className="search-input"
            placeholder="Search faculty or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="filter-select"
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
          >
            <option value="all">All Subjects</option>
            {subjectFaculty.map((sub) => (
              <option key={sub.code} value={sub.code}>
                {sub.code} — {sub.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="faculty-grid">
        {filteredFaculty.map((fac) => {
          const initials = fac.name
            .split(" ")
            .map((p) => p[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          return (
            <div className="faculty-card" key={fac.name}>
              <div className="faculty-card-top">
                <div className="faculty-avatar-large">{initials}</div>
                <div>
                  <h3 className="faculty-name">{fac.name}</h3>
                  <p className="faculty-dept">{fac.department}</p>
                </div>
              </div>

              <div className="faculty-details">
                <div className="detail-item">
                  <span className="detail-label">Courses:</span>
                  <div className="subject-tags">
                    {fac.subjects.map((sub) => (
                      <span className="sub-badge" key={sub.code}>
                        {sub.code}: {sub.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Office Hours:</span>
                  <span className="detail-value">{fac.officeHours}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Location:</span>
                  <span className="detail-value">{fac.cabin}</span>
                </div>
              </div>

              <button
                className="ask-faculty-btn"
                onClick={() =>
                  onSelectFacultyToAsk({
                    faculty: fac.name,
                    subject: fac.subjects[0]?.code || ""
                  })
                }
              >
                ✉ Ask Query to {fac.name.split(" ")[0]} →
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default FacultyDirectory;
