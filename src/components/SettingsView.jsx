import { useState } from "react";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updateProfile,
  sendPasswordResetEmail
} from "firebase/auth";
import { auth } from "../firebase";
import { availableSections, defaultSection } from "../sections";
import "./SettingsView.css";

export default function SettingsView({
  user,
  userProfile,
  studentSection = "K25PS",
  onUpdateSection,
  onUpdateProfile
}) {
  const role = userProfile?.role || "student";
  const isStudent = role === "student";

  // Section State
  const currentSection = studentSection || userProfile?.section || defaultSection || "K25PS";
  const [selectedSection, setSelectedSection] = useState(
    availableSections.includes(currentSection) ? currentSection : "custom"
  );
  const [customSection, setCustomSection] = useState(
    availableSections.includes(currentSection) ? "" : currentSection
  );
  const [isCustomSection, setIsCustomSection] = useState(
    !availableSections.includes(currentSection)
  );
  const [sectionLoading, setSectionLoading] = useState(false);
  const [sectionSuccess, setSectionSuccess] = useState("");
  const [sectionError, setSectionError] = useState("");

  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [resetEmailLoading, setResetEmailLoading] = useState(false);

  // Profile Details State
  const [displayName, setDisplayName] = useState(
    userProfile?.name || user?.displayName || userProfile?.facultyName || ""
  );
  const [department, setDepartment] = useState(
    userProfile?.department || "Computer Science & Engineering"
  );
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  // Handler: Update Student Section
  const handleSaveSection = async (e) => {
    e.preventDefault();
    setSectionError("");
    setSectionSuccess("");

    const finalSection = isCustomSection
      ? customSection.trim().toUpperCase()
      : selectedSection;

    if (!finalSection) {
      setSectionError("Please select or enter a valid section name (e.g. K25PS).");
      return;
    }

    try {
      setSectionLoading(true);
      if (onUpdateSection) {
        await onUpdateSection(finalSection);
      }
      setSectionSuccess(`Section updated to ${finalSection}! All new questions and notifications will use this section.`);
    } catch (err) {
      setSectionError("Failed to update section: " + (err.message || err));
    } finally {
      setSectionLoading(false);
    }
  };

  // Handler: Update Password
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!newPassword) {
      setPasswordError("Please enter a new password.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match. Please verify.");
      return;
    }

    try {
      setPasswordLoading(true);
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("No authenticated user found.");

      // Re-authenticate if current password is provided (safeguards against auth/requires-recent-login)
      if (currentPassword) {
        try {
          const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
          await reauthenticateWithCredential(currentUser, credential);
        } catch (authErr) {
          if (authErr.code === "auth/wrong-password" || authErr.code === "auth/invalid-credential") {
            setPasswordError("Current password is incorrect. Please check and try again.");
            setPasswordLoading(false);
            return;
          }
          throw authErr;
        }
      }

      await updatePassword(currentUser, newPassword);
      setPasswordSuccess("Password successfully updated! Use your new password the next time you sign in.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Password update error:", err);
      if (err.code === "auth/requires-recent-login") {
        setPasswordError(
          "For security, please enter your current password in the 'Current Password' field to confirm your identity before updating."
        );
      } else if (err.code === "auth/weak-password") {
        setPasswordError("Password is too weak. Please use at least 6 characters with letters and numbers.");
      } else {
        setPasswordError(err.message || "Failed to update password.");
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handler: Send Password Reset Email
  const handleSendResetEmail = async () => {
    if (!user?.email) return;
    setPasswordError("");
    setPasswordSuccess("");
    try {
      setResetEmailLoading(true);
      await sendPasswordResetEmail(auth, user.email);
      setPasswordSuccess(`A password reset link has been dispatched to ${user.email}. Please check your inbox or spam folder.`);
    } catch (err) {
      setPasswordError("Could not send password reset email: " + err.message);
    } finally {
      setResetEmailLoading(false);
    }
  };

  // Handler: Update Profile / Name
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");

    if (!displayName.trim()) {
      setProfileError("Full Name cannot be empty.");
      return;
    }

    try {
      setProfileLoading(true);
      const currentUser = auth.currentUser;
      if (currentUser) {
        await updateProfile(currentUser, { displayName: displayName.trim() });
      }

      if (onUpdateProfile) {
        const updates = { name: displayName.trim() };
        if (role === "faculty") {
          updates.facultyName = displayName.trim();
          if (department) updates.department = department.trim();
        }
        await onUpdateProfile(updates);
      }
      setProfileSuccess("Profile details updated successfully!");
    } catch (err) {
      setProfileError("Failed to update profile: " + (err.message || err));
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="settings-view">
      {/* Header */}
      <div className="settings-welcome-row">
        <div>
          <p className="eyebrow">PREFERENCES & SECURITY</p>
          <h1>Account Settings</h1>
          <p className="muted">
            Manage your credentials, update your login password, switch your class section, or modify profile details.
          </p>
        </div>
      </div>

      <div className="settings-grid">
        {/* 1. Account Credentials & Overview */}
        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">🪪</div>
            <div className="settings-card-title-group">
              <h2>Account Credentials</h2>
              <p>Your verified login identity and portal role</p>
            </div>
          </div>

          <div className="account-info-list">
            <div className="account-info-item">
              <span className="account-info-label">Email Address</span>
              <span className="account-info-value" title={user?.email || userProfile?.email}>
                {user?.email || userProfile?.email || "Not specified"}
              </span>
            </div>

            <div className="account-info-item">
              <span className="account-info-label">Account Role</span>
              <span className="account-info-value">
                <span className={`account-role-badge ${role}`}>
                  {isStudent ? "Student" : "Faculty Member"}
                </span>
              </span>
            </div>

            {isStudent && (
              <div className="account-info-item">
                <span className="account-info-label">Current Section</span>
                <span className="account-info-value">
                  <span className="account-section-badge">
                    Section {currentSection}
                  </span>
                </span>
              </div>
            )}

            {!isStudent && userProfile?.department && (
              <div className="account-info-item">
                <span className="account-info-label">Department</span>
                <span className="account-info-value">{userProfile.department}</span>
              </div>
            )}

            <div className="account-info-item">
              <span className="account-info-label">User ID (UID)</span>
              <span
                className="account-info-value"
                style={{ fontSize: "11px", fontFamily: "monospace", color: "#8a90a4" }}
              >
                {user?.uid ? `${user.uid.slice(0, 14)}...` : "—"}
              </span>
            </div>
          </div>

          <div className="section-feature-box">
            <p>
              🔒 <strong>Security Note:</strong> Your email address serves as your primary login identifier. To change your password or section, use the controls below.
            </p>
          </div>
        </section>

        {/* 2. Section Settings (For Students) */}
        {isStudent && (
          <section className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon">🏷️</div>
              <div className="settings-card-title-group">
                <h2>Class Section Assignment</h2>
                <p>Change your academic section / batch anytime</p>
              </div>
            </div>

            <form onSubmit={handleSaveSection} className="settings-form">
              <div className="section-feature-box">
                <p>
                  Active Section: <strong>Section {currentSection}</strong>.
                  Changing your section updates which teacher announcements you receive and automatically tags all future questions you submit.
                </p>
              </div>

              {sectionSuccess && (
                <div className="settings-alert success">
                  <span>✓</span>
                  <div>{sectionSuccess}</div>
                </div>
              )}

              {sectionError && (
                <div className="settings-alert error">
                  <span>⚠️</span>
                  <div>{sectionError}</div>
                </div>
              )}

              <div className="settings-field">
                <label className="settings-label">Select Section</label>
                <select
                  value={isCustomSection ? "custom" : selectedSection}
                  onChange={(e) => {
                    setSectionSuccess("");
                    setSectionError("");
                    if (e.target.value === "custom") {
                      setIsCustomSection(true);
                    } else {
                      setIsCustomSection(false);
                      setSelectedSection(e.target.value);
                    }
                  }}
                  className="settings-select"
                >
                  {availableSections.map((sec) => (
                    <option key={sec} value={sec}>
                      Section {sec}
                    </option>
                  ))}
                  <option value="custom">Other / Custom Section</option>
                </select>
              </div>

              {isCustomSection && (
                <div className="settings-field">
                  <label className="settings-label">Custom Section Code</label>
                  <input
                    type="text"
                    className="settings-input"
                    placeholder="e.g. K25CS or K25EC"
                    value={customSection}
                    onChange={(e) => setCustomSection(e.target.value.toUpperCase())}
                  />
                  <p className="settings-helper">Enter your official class section code.</p>
                </div>
              )}

              <div className="settings-card-footer">
                <button
                  type="submit"
                  className="settings-btn-primary"
                  disabled={sectionLoading}
                >
                  {sectionLoading ? "Saving Section..." : "Save Section"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* 3. Password Management */}
        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">🔑</div>
            <div className="settings-card-title-group">
              <h2>Change Password</h2>
              <p>Update your login password securely</p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="settings-form">
            {passwordSuccess && (
              <div className="settings-alert success">
                <span>✓</span>
                <div>{passwordSuccess}</div>
              </div>
            )}

            {passwordError && (
              <div className="settings-alert error">
                <span>⚠️</span>
                <div>{passwordError}</div>
              </div>
            )}

            <div className="settings-field">
              <label className="settings-label">Current Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showCurrentPass ? "text" : "password"}
                  className="settings-input"
                  placeholder="Enter current password (if prompted)"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  title={showCurrentPass ? "Hide" : "Show"}
                >
                  {showCurrentPass ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              <p className="settings-helper">Recommended to verify your identity for immediate password change.</p>
            </div>

            <div className="settings-field">
              <label className="settings-label">New Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showNewPass ? "text" : "password"}
                  className="settings-input"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowNewPass(!showNewPass)}
                  title={showNewPass ? "Hide" : "Show"}
                >
                  {showNewPass ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <div className="settings-field">
              <label className="settings-label">Confirm New Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPass ? "text" : "password"}
                  className="settings-input"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  title={showConfirmPass ? "Hide" : "Show"}
                >
                  {showConfirmPass ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <div className="settings-card-footer">
              <button
                type="submit"
                className="settings-btn-primary"
                disabled={passwordLoading}
              >
                {passwordLoading ? "Updating Password..." : "Update Password"}
              </button>

              <button
                type="button"
                className="settings-btn-secondary"
                onClick={handleSendResetEmail}
                disabled={resetEmailLoading}
                title="Send a reset link to your email"
              >
                {resetEmailLoading ? "Sending Link..." : "Forgot Password? Email Reset Link"}
              </button>
            </div>
          </form>
        </section>

        {/* 4. Profile / Name Customization */}
        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">👤</div>
            <div className="settings-card-title-group">
              <h2>Profile Details</h2>
              <p>Customize how your name appears to professors and peers</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="settings-form">
            {profileSuccess && (
              <div className="settings-alert success">
                <span>✓</span>
                <div>{profileSuccess}</div>
              </div>
            )}

            {profileError && (
              <div className="settings-alert error">
                <span>⚠️</span>
                <div>{profileError}</div>
              </div>
            )}

            <div className="settings-field">
              <label className="settings-label">Full Name</label>
              <input
                type="text"
                className="settings-input"
                placeholder="Enter your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            {!isStudent && (
              <div className="settings-field">
                <label className="settings-label">Department / School</label>
                <input
                  type="text"
                  className="settings-input"
                  placeholder="e.g. Computer Science & Engineering"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>
            )}

            <div className="settings-card-footer">
              <button
                type="submit"
                className="settings-btn-primary"
                disabled={profileLoading}
              >
                {profileLoading ? "Saving Profile..." : "Save Profile Details"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
