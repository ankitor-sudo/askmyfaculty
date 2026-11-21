import { useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import "./FacultyApplicationStatus.css";

function FacultyApplicationStatus({ user, userProfile, onLogout, onProfileUpdated }) {
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState("");

  const status = userProfile?.approvalStatus || "pending";
  const facultyId = userProfile?.facultyId || "—";
  const department = userProfile?.department || "—";
  const designation = userProfile?.designation || "Faculty Member";
  const subjectsTaught = userProfile?.subjectsTaught || "—";
  const rejectionReason = userProfile?.rejectionReason || "";
  const appliedDate = userProfile?.appliedAt?.toDate
    ? userProfile.appliedAt.toDate().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Recently";

  const handleRefresh = async () => {
    if (!user) return;
    try {
      setRefreshing(true);
      setNotice("");
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        if (onProfileUpdated) {
          onProfileUpdated(data);
        }
        if (data.approvalStatus === "approved") {
          setNotice("🎉 Congratulations! Your application has been approved. Redirecting...");
          setTimeout(() => {
            window.location.reload();
          }, 1200);
        } else {
          setNotice("Status checked: Still " + (data.approvalStatus || "pending"));
        }
      }
    } catch (err) {
      console.error("Error refreshing status:", err);
      setNotice("Could not refresh: " + err.message);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="faculty-status-container">
      <div className={`faculty-status-card ${status}`}>
        {/* Brand & Status Pill */}
        <div className="status-header-row">
          <div className="status-brand-badge">
            <div className="status-brand-logo">A</div>
            <span>AskMyFaculty</span>
          </div>
          <span className={`status-pill ${status}`}>
            {status === "pending" && "⏳ Pending Approval"}
            {status === "rejected" && "❌ Application Rejected"}
            {status === "suspended" && "🚫 Account Suspended"}
          </span>
        </div>

        {/* Big Icon Banner */}
        <div className={`status-icon-banner ${status}`}>
          {status === "pending" && "⏳"}
          {status === "rejected" && "❌"}
          {status === "suspended" && "🚫"}
        </div>

        {/* Status Content */}
        {status === "pending" && (
          <>
            <h1 className="status-title">Faculty Application Under Review</h1>
            <p className="status-description">
              Thank you for registering, <strong>{userProfile?.name || user?.displayName}</strong>. Your faculty credentials and department details have been submitted to the academic administrator. You will be granted full access to the Faculty Portal once verified.
            </p>
          </>
        )}

        {status === "rejected" && (
          <>
            <h1 className="status-title">Application Not Approved</h1>
            <p className="status-description">
              Your application for faculty privileges was reviewed by the academic administrator and could not be approved at this time.
            </p>
            {rejectionReason && (
              <div className="rejection-reason-box">
                <div className="rejection-reason-label">Reason Provided by Administrator:</div>
                <p className="rejection-reason-text">{rejectionReason}</p>
              </div>
            )}
          </>
        )}

        {status === "suspended" && (
          <>
            <h1 className="status-title">Account Access Suspended</h1>
            <p className="status-description">
              Your faculty dashboard access has been temporarily suspended by the administrator. Please contact your department head or academic admin office for assistance.
            </p>
          </>
        )}

        {/* Application Details Summary */}
        <div className="applicant-details-grid">
          <div className="applicant-detail-item">
            <span className="applicant-detail-label">Applicant Name</span>
            <span className="applicant-detail-value">{userProfile?.name || user?.displayName || "—"}</span>
          </div>
          <div className="applicant-detail-item">
            <span className="applicant-detail-label">Official Email</span>
            <span className="applicant-detail-value">{user?.email || "—"}</span>
          </div>
          <div className="applicant-detail-item">
            <span className="applicant-detail-label">Faculty ID</span>
            <span className="applicant-detail-value">{facultyId}</span>
          </div>
          <div className="applicant-detail-item">
            <span className="applicant-detail-label">Designation</span>
            <span className="applicant-detail-value">{designation}</span>
          </div>
          <div className="applicant-detail-item">
            <span className="applicant-detail-label">Department</span>
            <span className="applicant-detail-value">{department}</span>
          </div>
          <div className="applicant-detail-item">
            <span className="applicant-detail-label">Submitted On</span>
            <span className="applicant-detail-value">{appliedDate}</span>
          </div>
          <div className="applicant-detail-item full-width">
            <span className="applicant-detail-label">Subjects Taught</span>
            <span className="applicant-detail-value">{subjectsTaught}</span>
          </div>
        </div>

        {notice && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              background: "rgba(101, 88, 232, 0.12)",
              color: "#c4b5fd",
              fontSize: "13px",
              marginBottom: "20px",
            }}
          >
            {notice}
          </div>
        )}

        {/* Action Buttons */}
        <div className="status-actions-row">
          <button
            type="button"
            className="status-btn refresh"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? "Checking..." : "🔄 Refresh Status"}
          </button>
          <button
            type="button"
            className="status-btn logout"
            onClick={onLogout}
          >
            ← Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default FacultyApplicationStatus;
