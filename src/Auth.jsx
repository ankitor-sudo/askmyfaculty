import { auth, db } from "./firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { allFaculty } from "./subjectFaculty";
import { availableSections, defaultSection } from "./sections";
import "./Auth.css";

function Auth() {
  // Step 1: role selection; Step 2: form
  const [step, setStep] = useState("role"); // "role" | "form"
  const [role, setRole] = useState(""); // "student" | "faculty"
  const [isRegister, setIsRegister] = useState(false);

  const [selectedFacultyProfile, setSelectedFacultyProfile] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [department, setDepartment] = useState("Computer Science & Engineering");

  // Section state for students
  const [section, setSection] = useState(defaultSection || "K25PS");
  const [customSection, setCustomSection] = useState("");
  const [isCustomSection, setIsCustomSection] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* ── Handlers ── */

  const handleRoleChoose = (chosenRole) => {
    setRole(chosenRole);
    setError("");
    setStep("form");
  };

  const handleBack = () => {
    setStep("role");
    setRole("");
    setError("");
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setSelectedFacultyProfile("");
    setSection(defaultSection || "K25PS");
    setCustomSection("");
    setIsCustomSection(false);
  };

  const handleFacultyProfileChange = (e) => {
    const val = e.target.value;
    setSelectedFacultyProfile(val);
    if (val && val !== "custom") setName(val);
    else if (val === "custom") setName("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isRegister) {
      if (!name.trim()) { setError("Please enter your name."); return; }
      if (password !== confirmPassword) { setError("Passwords do not match."); return; }
      if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    }

    const finalSection = isCustomSection
      ? (customSection.trim().toUpperCase() || defaultSection || "K25PS")
      : (section || defaultSection || "K25PS");

    try {
      setLoading(true);

      if (isRegister) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: name.trim() });
        await setDoc(doc(db, "users", result.user.uid), {
          uid: result.user.uid,
          name: name.trim(),
          email: email.trim(),
          role,
          section: role === "student" ? finalSection : null,
          facultyName: role === "faculty" ? name.trim() : null,
          department: role === "faculty" ? department : null,
          createdAt: serverTimestamp()
        });
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        // Save / update student's section on login
        if (role === "student" && finalSection) {
          await setDoc(
            doc(db, "users", result.user.uid),
            { section: finalSection },
            { merge: true }
          );
        }
      }
    } catch (err) {
      console.error("Auth error:", err);
      const codeMap = {
        "auth/email-already-in-use": "This email is already registered. Please sign in.",
        "auth/invalid-credential": "Invalid email or password.",
        "auth/user-not-found": "Invalid email or password.",
        "auth/wrong-password": "Invalid email or password."
      };
      setError(codeMap[err.code] || err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Role Selection Step ── */
  if (step === "role") {
    return (
      <div className="auth-page">
        <div className="auth-card auth-role-card">
          {/* Brand */}
          <div className="auth-brand-badge">
            <span className="auth-logo-icon">A</span>
            <span>AskMyFaculty</span>
          </div>
          <p className="auth-subtitle">
            Connecting students and faculty for seamless academic support.
          </p>

          {/* Sign In / Register toggle on role screen too */}
          <div className="auth-tab-switch">
            <button
              type="button"
              className={!isRegister ? "auth-tab active" : "auth-tab"}
              onClick={() => { setIsRegister(false); setError(""); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={isRegister ? "auth-tab active" : "auth-tab"}
              onClick={() => { setIsRegister(true); setError(""); }}
            >
              Create Account
            </button>
          </div>

          <p className="role-prompt">
            {isRegister ? "Register as…" : "Sign in to your portal"}
          </p>

          <div className="role-portal-cards">
            {/* Student Card */}
            <button
              type="button"
              className="portal-card student-portal"
              onClick={() => handleRoleChoose("student")}
            >
              <div className="portal-card-icon">🎓</div>
              <div className="portal-card-body">
                <span className="portal-card-title">Student Portal</span>
                <span className="portal-card-desc">
                  Ask doubts, track faculty replies, book office hours
                </span>
              </div>
              <span className="portal-card-arrow">→</span>
            </button>

            {/* Faculty Card */}
            <button
              type="button"
              className="portal-card faculty-portal"
              onClick={() => handleRoleChoose("faculty")}
            >
              <div className="portal-card-icon">👨‍🏫</div>
              <div className="portal-card-body">
                <span className="portal-card-title">Faculty Portal</span>
                <span className="portal-card-desc">
                  Review student queries, respond, and manage consultations
                </span>
              </div>
              <span className="portal-card-arrow">→</span>
            </button>
          </div>

          <p className="auth-switch" style={{ marginTop: "24px" }}>
            {isRegister ? "Already have an account?" : "New to AskMyFaculty?"}
            <span onClick={() => { setIsRegister(!isRegister); setError(""); }}>
              {isRegister ? " Sign In" : " Create Account"}
            </span>
          </p>
        </div>
      </div>
    );
  }

  /* ── Form Step ── */
  const isFaculty = role === "faculty";

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Brand */}
        <div className="auth-brand-badge">
          <span className={`auth-logo-icon ${isFaculty ? "faculty-logo" : ""}`}>A</span>
          <span>AskMyFaculty</span>
        </div>

        {/* Back + Role Badge */}
        <div className="auth-role-topbar">
          <button type="button" className="back-btn" onClick={handleBack}>
            ← Back
          </button>
          <span className={`active-role-badge ${isFaculty ? "faculty-badge" : "student-badge"}`}>
            {isFaculty ? "👨‍🏫 Faculty Portal" : "🎓 Student Portal"}
          </span>
        </div>

        {/* Sign In / Register tab toggle */}
        <div className="auth-tab-switch">
          <button
            type="button"
            className={!isRegister ? "auth-tab active" : "auth-tab"}
            onClick={() => { setIsRegister(false); setError(""); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={isRegister ? "auth-tab active" : "auth-tab"}
            onClick={() => { setIsRegister(true); setError(""); }}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">

          {/* Faculty roster picker (register only) */}
          {isRegister && isFaculty && (
            <div className="auth-field-group">
              <label className="auth-field-label">SELECT FROM FACULTY ROSTER</label>
              <select
                value={selectedFacultyProfile}
                onChange={handleFacultyProfileChange}
                className="auth-input"
              >
                <option value="">-- Choose your name from roster --</option>
                {allFaculty.map((fName) => (
                  <option key={fName} value={fName}>{fName}</option>
                ))}
                <option value="custom">Other / Enter custom name</option>
              </select>
            </div>
          )}

          {/* Name field (register only) */}
          {isRegister && (
            <div className="auth-field-group">
              <label className="auth-field-label">
                {isFaculty ? "FACULTY NAME" : "FULL NAME"}
              </label>
              <input
                type="text"
                className="auth-input"
                placeholder={isFaculty ? "e.g. Dr. Robin Kumar" : "e.g. Ankit Sharma"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          {/* Section Selection for Student (on both Register & Sign In) */}
          {!isFaculty && (
            <div className="auth-field-group">
              <label className="auth-field-label">
                STUDENT SECTION {isRegister ? "(YOUR CLASS / BATCH)" : "(CLASS / BATCH)"}
              </label>
              <select
                value={isCustomSection ? "custom" : section}
                onChange={(e) => {
                  if (e.target.value === "custom") {
                    setIsCustomSection(true);
                  } else {
                    setIsCustomSection(false);
                    setSection(e.target.value);
                  }
                }}
                className="auth-input"
              >
                {availableSections.map((sec) => (
                  <option key={sec} value={sec}>
                    Section {sec}
                  </option>
                ))}
                <option value="custom">Other / Custom Section</option>
              </select>

              {isCustomSection && (
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Enter custom section (e.g. K25CS)"
                  value={customSection}
                  onChange={(e) => setCustomSection(e.target.value.toUpperCase())}
                  style={{ marginTop: "6px" }}
                />
              )}
            </div>
          )}

          {/* Department (faculty register only) */}
          {isRegister && isFaculty && (
            <div className="auth-field-group">
              <label className="auth-field-label">DEPARTMENT</label>
              <input
                type="text"
                className="auth-input"
                placeholder="e.g. Computer Science & Engineering"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
          )}

          {/* Email */}
          <div className="auth-field-group">
            <label className="auth-field-label">EMAIL ADDRESS</label>
            <input
              type="email"
              className="auth-input"
              placeholder={isFaculty ? "faculty@university.edu" : "student@university.edu"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="auth-field-group">
            <label className="auth-field-label">PASSWORD</label>
            <input
              type="password"
              className="auth-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Confirm password (register only) */}
          {isRegister && (
            <div className="auth-field-group">
              <label className="auth-field-label">CONFIRM PASSWORD</label>
              <input
                type="password"
                className="auth-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button
            type="submit"
            className={`auth-submit-btn ${isFaculty ? "faculty-submit" : ""}`}
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : isRegister
              ? `Register as ${isFaculty ? "Faculty" : "Student"} →`
              : `Sign In to ${isFaculty ? "Faculty" : "Student"} Portal →`}
          </button>
        </form>

        <p className="auth-switch">
          {isRegister ? "Already registered?" : "New to AskMyFaculty?"}
          <span onClick={() => { setIsRegister(!isRegister); setError(""); }}>
            {isRegister ? " Sign In" : " Create Account"}
          </span>
        </p>
      </div>
    </div>
  );
}

export default Auth;
