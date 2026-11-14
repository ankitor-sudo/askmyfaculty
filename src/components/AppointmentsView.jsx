import { useState } from "react";
import { subjectFaculty, allFaculty } from "../subjectFaculty";

function AppointmentsView({ role = "student", currentFacultyName = "" }) {
  const [appointments, setAppointments] = useState([
    {
      id: "APT-101",
      faculty: "Dr. Robin Kumar",
      studentName: "Ankit Sharma",
      subject: "CSE202 (OOPs)",
      date: "2026-11-18",
      time: "03:00 PM - 03:30 PM",
      status: "Confirmed",
      topic: "Clarification on virtual destructors and inheritance hierarchy"
    },
    {
      id: "APT-102",
      faculty: "Deepak Kumar",
      studentName: "Ankit Sharma",
      subject: "CSE205 (DSA)",
      date: "2026-11-20",
      time: "02:30 PM - 03:00 PM",
      status: "Pending Approval",
      topic: "Graph traversal edge cases in project submission"
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [faculty, setFaculty] = useState("");
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("02:00 PM - 02:30 PM");
  const [topic, setTopic] = useState("");

  const handleBookAppointment = (e) => {
    e.preventDefault();
    if (!faculty || !date || !topic.trim()) {
      alert("Please fill in all appointment details.");
      return;
    }

    const newApt = {
      id: `APT-${Math.floor(100 + Math.random() * 900)}`,
      faculty,
      studentName: "You (Student)",
      subject: subject || "General Academic",
      date,
      time: timeSlot,
      status: "Pending Approval",
      topic: topic.trim()
    };

    setAppointments([newApt, ...appointments]);
    setShowModal(false);
    setFaculty("");
    setSubject("");
    setDate("");
    setTopic("");
    alert("Appointment request submitted successfully!");
  };

  const handleUpdateStatus = (id, newStatus) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );
  };

  const displayedAppointments =
    role === "faculty" && currentFacultyName
      ? appointments.filter(
          (a) =>
            a.faculty.toLowerCase().includes(currentFacultyName.toLowerCase()) ||
            currentFacultyName.toLowerCase().includes(a.faculty.toLowerCase())
        )
      : appointments;

  return (
    <div className="appointments-view">
      <div className="section-heading">
        <div>
          <h2>
            {role === "faculty" ? "Office Hours & Student Appointments" : "Faculty Appointments & Office Hours"}
          </h2>
          <p className="muted">
            {role === "faculty"
              ? "Manage one-on-one student consultations and office hours."
              : "Schedule 1-on-1 office consultations for complex doubts."}
          </p>
        </div>

        {role === "student" && (
          <button className="primary-button" onClick={() => setShowModal(true)}>
            ＋ Schedule Office Hour
          </button>
        )}
      </div>

      <div className="appointments-grid">
        {displayedAppointments.length === 0 ? (
          <div className="empty-box">
            <p>No scheduled appointments found.</p>
          </div>
        ) : (
          displayedAppointments.map((apt) => (
            <div className="appointment-card" key={apt.id}>
              <div className="apt-header">
                <div>
                  <span className="apt-id">{apt.id}</span>
                  <span className={`status ${apt.status.toLowerCase().replace(" ", "-")}`}>
                    {apt.status}
                  </span>
                </div>
                <div className="apt-time-badge">
                  📅 {apt.date} • 🕒 {apt.time}
                </div>
              </div>

              <div className="apt-body">
                <p>
                  <strong>{role === "faculty" ? "Student:" : "Faculty:"}</strong>{" "}
                  {role === "faculty" ? apt.studentName : apt.faculty}
                </p>
                <p>
                  <strong>Subject:</strong> {apt.subject}
                </p>
                <p className="apt-topic">
                  <strong>Discussion Topic:</strong> {apt.topic}
                </p>
              </div>

              {role === "faculty" && apt.status === "Pending Approval" && (
                <div className="apt-actions">
                  <button
                    className="approve-btn"
                    onClick={() => handleUpdateStatus(apt.id, "Confirmed")}
                  >
                    ✓ Confirm Meeting
                  </button>
                  <button
                    className="reject-btn"
                    onClick={() => handleUpdateStatus(apt.id, "Declined")}
                  >
                    ✕ Decline
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <form
            className="question-modal"
            onSubmit={handleBookAppointment}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="close-button"
              onClick={() => setShowModal(false)}
            >
              ×
            </button>

            <p className="eyebrow">CONSULTATION SCHEDULER</p>
            <h2>Book Office Hour Slot</h2>
            <p className="muted">
              Select a faculty member and reserve time during their office hours.
            </p>

            <label>Select Faculty</label>
            <select
              value={faculty}
              onChange={(e) => setFaculty(e.target.value)}
              required
            >
              <option value="">-- Choose Faculty Member --</option>
              {allFaculty.map((fName) => (
                <option key={fName} value={fName}>
                  {fName}
                </option>
              ))}
            </select>

            <label>Subject / Course</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option value="">-- Choose Subject (Optional) --</option>
              {subjectFaculty.map((sub) => (
                <option key={sub.code} value={`${sub.code} (${sub.name})`}>
                  {sub.code} — {sub.name}
                </option>
              ))}
            </select>

            <div className="form-row-2">
              <div>
                <label>Date</label>
                <input
                  type="date"
                  className="auth-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label>Time Slot</label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="auth-input"
                >
                  <option value="02:00 PM - 02:30 PM">02:00 PM - 02:30 PM</option>
                  <option value="02:30 PM - 03:00 PM">02:30 PM - 03:00 PM</option>
                  <option value="03:00 PM - 03:30 PM">03:00 PM - 03:30 PM</option>
                  <option value="03:30 PM - 04:00 PM">03:30 PM - 04:00 PM</option>
                </select>
              </div>
            </div>

            <label>Discussion Topic</label>
            <textarea
              rows="3"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What would you like to discuss with the professor?"
              required
            />

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="primary-button">
                Submit Request →
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default AppointmentsView;
