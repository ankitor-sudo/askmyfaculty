import { useState, useEffect, useMemo } from "react";
import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";
import "./AdminDashboard.css";

function AdminDashboard({ user, userProfile, onLogout }) {
  const [allUsers, setAllUsers] = useState([]);
  const [totalQueries, setTotalQueries] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Rejection Modal state
  const [rejectingFaculty, setRejectingFaculty] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // 1. Live listener for all users
  useEffect(() => {
    const unsubUsers = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const usersList = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setAllUsers(usersList);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading users in admin:", error);
        setLoading(false);
      }
    );

    // 2. Live listener for total queries
    const unsubQueries = onSnapshot(
      collection(db, "queries"),
      (snapshot) => {
        setTotalQueries(snapshot.size);
      },
      (error) => {
        console.error("Error loading queries count:", error);
      }
    );

    return () => {
      unsubUsers();
      unsubQueries();
    };
  }, []);

  // Compute live statistics
  const stats = useMemo(() => {
    const students = allUsers.filter((u) => u.role === "student");
    const approvedFaculty = allUsers.filter(
      (u) => u.role === "faculty" && u.approvalStatus === "approved"
    );
    const pendingFaculty = allUsers.filter(
      (u) => u.role === "faculty" && (!u.approvalStatus || u.approvalStatus === "pending")
    );

    return {
      totalStudents: students.length,
      totalFaculty: approvedFaculty.length,
      pendingApplications: pendingFaculty.length,
      totalQuestions: totalQueries,
    };
  }, [allUsers, totalQueries]);

  // Extract all faculty applicants
  const facultyApplications = useMemo(() => {
    return allUsers.filter(
      (u) => u.role === "faculty" || u.approvalStatus != null || u.facultyId != null
    );
  }, [allUsers]);

  // Filtered applications
  const filteredApplications = useMemo(() => {
    return facultyApplications.filter((app) => {
      const appStatus = app.approvalStatus || "pending";
      if (statusFilter !== "all" && appStatus !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (app.name || "").toLowerCase().includes(q);
        const emailMatch = (app.email || "").toLowerCase().includes(q);
        const idMatch = (app.facultyId || "").toLowerCase().includes(q);
        const deptMatch = (app.department || "").toLowerCase().includes(q);
        const subjMatch = (app.subjectsTaught || "").toLowerCase().includes(q);
        return nameMatch || emailMatch || idMatch || deptMatch || subjMatch;
      }
      return true;
    });
  }, [facultyApplications, statusFilter, searchQuery]);

  // Status counts for tabs
  const tabCounts = useMemo(() => {
    const pending = facultyApplications.filter(
      (a) => !a.approvalStatus || a.approvalStatus === "pending"
    ).length;
    const approved = facultyApplications.filter(
      (a) => a.approvalStatus === "approved"
    ).length;
    const rejected = facultyApplications.filter(
      (a) => a.approvalStatus === "rejected"
    ).length;
    const suspended = facultyApplications.filter(
      (a) => a.approvalStatus === "suspended"
    ).length;

    return { all: facultyApplications.length, pending, approved, rejected, suspended };
  }, [facultyApplications]);

  /* ── Action Handlers ── */
  const handleApprove = async (applicant) => {
    if (!applicant?.id) return;
    try {
      setActionLoading(true);
      await updateDoc(doc(db, "users", applicant.id), {
        approvalStatus: "approved",
        role: "faculty",
        approvedAt: serverTimestamp(),
        rejectionReason: null,
      });
    } catch (err) {
      console.error("Error approving faculty:", err);
      alert("Failed to approve faculty: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenRejectModal = (applicant) => {
    setRejectingFaculty(applicant);
    setRejectionReason("");
  };

  const handleConfirmReject = async () => {
    if (!rejectingFaculty?.id) return;
    try {
      setActionLoading(true);
      await updateDoc(doc(db, "users", rejectingFaculty.id), {
        approvalStatus: "rejected",
        rejectedAt: serverTimestamp(),
        rejectionReason: rejectionReason.trim() || "Qualifications or department criteria not fulfilled.",
      });
      setRejectingFaculty(null);
      setRejectionReason("");
    } catch (err) {
      console.error("Error rejecting faculty:", err);
      alert("Failed to reject faculty: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async (applicant) => {
    if (!applicant?.id) return;
    const confirmSuspend = window.confirm(
      `Are you sure you want to suspend faculty access for ${applicant.name || applicant.email}?`
    );
    if (!confirmSuspend) return;

    try {
      setActionLoading(true);
      await updateDoc(doc(db, "users", applicant.id), {
        approvalStatus: "suspended",
        suspendedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error suspending faculty:", err);
      alert("Failed to suspend faculty: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="admin-layout">
      {/* ── Top Navbar ── */}
      <header className="admin-navbar">
        <div className="admin-nav-brand">
          <div className="admin-nav-logo">A</div>
          <span className="admin-brand-title">AskMyFaculty</span>
          <span className="admin-badge-pill">Administrator Portal</span>
        </div>

        <div className="admin-nav-user">
          <div className="admin-user-info">
            <div className="admin-user-name">
              {userProfile?.name || user?.displayName || user?.email?.split("@")[0] || "Admin"}
            </div>
            <div className="admin-user-role">{user?.email}</div>
          </div>
          <button
            type="button"
            className="admin-logout-btn"
            onClick={onLogout}
          >
            ← Sign Out
          </button>
        </div>
      </header>

      {/* ── Main Dashboard ── */}
      <main className="admin-main">
        {/* Hero Banner */}
        <section className="admin-hero">
          <div>
            <h1>Academic Administration Overview</h1>
            <p>Review faculty verification requests, supervise users, and monitor live system metrics.</p>
          </div>
          <div className="admin-hero-badge">
            <span>🛡️</span>
            <span>Authorized Administrator Access</span>
          </div>
        </section>

        {/* ── KPI Overview Grid (backed by actual Firestore data) ── */}
        <section className="admin-kpi-grid">
          {/* Total Students */}
          <div className="admin-kpi-card students">
            <div className="admin-kpi-top">
              <span className="admin-kpi-title">Total Students</span>
              <div className="admin-kpi-icon">🎓</div>
            </div>
            <div className="admin-kpi-value">{loading ? "—" : stats.totalStudents}</div>
            <div className="admin-kpi-hint">Enrolled academic accounts</div>
          </div>

          {/* Approved Faculty */}
          <div className="admin-kpi-card faculty">
            <div className="admin-kpi-top">
              <span className="admin-kpi-title">Active Faculty</span>
              <div className="admin-kpi-icon">👨‍🏫</div>
            </div>
            <div className="admin-kpi-value">{loading ? "—" : stats.totalFaculty}</div>
            <div className="admin-kpi-hint">Verified & authorized faculty</div>
          </div>

          {/* Pending Applications */}
          <div className="admin-kpi-card pending">
            <div className="admin-kpi-top">
              <span className="admin-kpi-title">Pending Approvals</span>
              <div className="admin-kpi-icon">⏳</div>
            </div>
            <div className="admin-kpi-value">{loading ? "—" : stats.pendingApplications}</div>
            <div className="admin-kpi-hint">Applications awaiting review</div>
          </div>

          {/* Total Questions */}
          <div className="admin-kpi-card questions">
            <div className="admin-kpi-top">
              <span className="admin-kpi-title">Total Questions</span>
              <div className="admin-kpi-icon">💬</div>
            </div>
            <div className="admin-kpi-value">{loading ? "—" : stats.totalQuestions}</div>
            <div className="admin-kpi-hint">Academic doubts asked</div>
          </div>
        </section>

        {/* ── Faculty Approval Management ── */}
        <section className="admin-section">
          <div className="admin-section-header">
            <div className="admin-section-title-wrap">
              <h2>Faculty Verification & Access Control</h2>
              <p>Review applicant credentials, inspect department details, and grant or revoke access.</p>
            </div>
          </div>

          {/* Filter Tabs & Search Bar */}
          <div className="admin-controls-row">
            <div className="admin-filter-tabs">
              <button
                type="button"
                className={`admin-tab-btn ${statusFilter === "all" ? "active" : ""}`}
                onClick={() => setStatusFilter("all")}
              >
                All Applications
                <span className="admin-tab-count">{tabCounts.all}</span>
              </button>
              <button
                type="button"
                className={`admin-tab-btn ${statusFilter === "pending" ? "active" : ""}`}
                onClick={() => setStatusFilter("pending")}
              >
                Pending
                <span className="admin-tab-count">{tabCounts.pending}</span>
              </button>
              <button
                type="button"
                className={`admin-tab-btn ${statusFilter === "approved" ? "active" : ""}`}
                onClick={() => setStatusFilter("approved")}
              >
                Approved
                <span className="admin-tab-count">{tabCounts.approved}</span>
              </button>
              <button
                type="button"
                className={`admin-tab-btn ${statusFilter === "rejected" ? "active" : ""}`}
                onClick={() => setStatusFilter("rejected")}
              >
                Rejected
                <span className="admin-tab-count">{tabCounts.rejected}</span>
              </button>
              <button
                type="button"
                className={`admin-tab-btn ${statusFilter === "suspended" ? "active" : ""}`}
                onClick={() => setStatusFilter("suspended")}
              >
                Suspended
                <span className="admin-tab-count">{tabCounts.suspended}</span>
              </button>
            </div>

            <input
              type="text"
              className="admin-search-input"
              placeholder="🔍 Search name, email, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Table of Applications */}
          {filteredApplications.length === 0 ? (
            <div className="admin-empty-state">
              <div className="admin-empty-icon">📋</div>
              <h3>No faculty applications found</h3>
              <p>
                {searchQuery
                  ? "No results matched your search query."
                  : statusFilter !== "all"
                  ? `There are currently no faculty members with "${statusFilter}" status.`
                  : "No faculty applications have been submitted yet."}
              </p>
            </div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Faculty Member</th>
                    <th>Faculty ID</th>
                    <th>Designation & Dept</th>
                    <th>Subjects Taught</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((app) => {
                    const appStatus = app.approvalStatus || "pending";
                    return (
                      <tr key={app.id}>
                        <td>
                          <div className="applicant-name-cell">
                            <span className="applicant-primary-name">{app.name || "Unnamed Applicant"}</span>
                            <span className="applicant-sub-email">{app.email}</span>
                          </div>
                        </td>
                        <td>
                          <code style={{ background: "rgba(255,255,255,0.06)", padding: "3px 6px", borderRadius: "5px", color: "#c4b5fd" }}>
                            {app.facultyId || "—"}
                          </code>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{app.designation || "Faculty"}</div>
                          <div style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.45)" }}>
                            {app.department || "Computer Science"}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.75)" }}>
                            {app.subjectsTaught || "—"}
                          </span>
                        </td>
                        <td>
                          <span className={`status-tag ${appStatus}`}>
                            {appStatus === "pending" && "⏳ Pending"}
                            {appStatus === "approved" && "✓ Approved"}
                            {appStatus === "rejected" && "✕ Rejected"}
                            {appStatus === "suspended" && "⊘ Suspended"}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div className="admin-action-group" style={{ justifyContent: "flex-end" }}>
                            {appStatus === "pending" && (
                              <>
                                <button
                                  type="button"
                                  className="admin-act-btn approve"
                                  onClick={() => handleApprove(app)}
                                  disabled={actionLoading}
                                >
                                  ✓ Approve
                                </button>
                                <button
                                  type="button"
                                  className="admin-act-btn reject"
                                  onClick={() => handleOpenRejectModal(app)}
                                  disabled={actionLoading}
                                >
                                  ✕ Reject
                                </button>
                              </>
                            )}

                            {appStatus === "approved" && (
                              <button
                                type="button"
                                className="admin-act-btn suspend"
                                onClick={() => handleSuspend(app)}
                                disabled={actionLoading}
                              >
                                ⊘ Suspend
                              </button>
                            )}

                            {(appStatus === "rejected" || appStatus === "suspended") && (
                              <button
                                type="button"
                                className="admin-act-btn reinstate"
                                onClick={() => handleApprove(app)}
                                disabled={actionLoading}
                              >
                                ↺ Reinstate / Approve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* ── Rejection Modal ── */}
      {rejectingFaculty && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <h3>Reject Faculty Application</h3>
            <p>
              Provide an explanation for rejecting the application of{" "}
              <strong>{rejectingFaculty.name || rejectingFaculty.email}</strong>. This reason will be shown to the applicant.
            </p>

            <textarea
              className="admin-modal-textarea"
              placeholder="e.g. Official institutional email required, or faculty ID could not be verified in the staff registry."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-cancel"
                onClick={() => setRejectingFaculty(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-modal-confirm-reject"
                onClick={handleConfirmReject}
                disabled={actionLoading}
              >
                {actionLoading ? "Processing..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
