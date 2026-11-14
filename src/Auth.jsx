import { auth, db } from "./firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { allFaculty } from "./subjectFaculty";
import "./Auth.css";

function Auth() {
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState("student"); // "student" or "faculty"
  const [selectedFacultyProfile, setSelectedFacultyProfile] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [department, setDepartment] = useState("Computer Science & Engineering");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (newRole) => {
    setRole(newRole);
    setError("");
    if (newRole === "faculty" && allFaculty.length > 0 && !name) {
      setSelectedFacultyProfile(allFaculty[0]);
      setName(allFaculty[0]);
    }
  };

  const handleFacultyProfileChange = (e) => {
    const val = e.target.value;
    setSelectedFacultyProfile(val);
    if (val && val !== "custom") {
      setName(val);
    } else if (val === "custom") {
      setName("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isRegister) {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (password.length < 6) {
        setError("Password must contain at least 6 characters.");
        return;
      }
      if (!name.trim()) {
        setError("Please enter your name.");
        return;
      }
    }

    try {
      setLoading(true);

      if (isRegister) {
        // 1. Create Firebase Auth account
        const result = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        // 2. Save display name
        await updateProfile(result.user, {
          displayName: name.trim()
        });

        // 3. Save user profile in Firestore with role
        const finalFacultyName = role === "faculty" ? name.trim() : null;
        await setDoc(doc(db, "users", result.user.uid), {
          uid: result.user.uid,
          name: name.trim(),
          email: email.trim(),
          role: role,
          facultyName: finalFacultyName,
          department: role === "faculty" ? department : null,
          createdAt: serverTimestamp()
        });
      } else {
        // Login existing user
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
      }
    } catch (err) {
      console.error("Authentication error:", err);
      let msg = err.message;
      if (err.code === "auth/email-already-in-use") {
        msg = "This email is already registered. Please log in.";
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        msg = "Invalid email or password.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand-badge">
          <span className="auth-logo-icon">A</span>
          <span>AskMyFaculty</span>
        </div>
        
        <p className="auth-subtitle">
          Connecting students and faculty for seamless academic support.
        </p>

        <div className="auth-tab-switch">
          <button
            type="button"
            className={!isRegister ? "auth-tab active" : "auth-tab"}
            onClick={() => {
              setIsRegister(false);
              setError("");
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={isRegister ? "auth-tab active" : "auth-tab"}
            onClick={() => {
              setIsRegister(true);
              setError("");
            }}
          >
            Create Account
          </button>
        </div>

        {isRegister && (
          <div className="role-selection-box">
            <label className="auth-field-label">SELECT YOUR ROLE</label>
            <div className="role-buttons">
              <button
                type="button"
                className={`role-button ${role === "student" ? "active" : ""}`}
                onClick={() => handleRoleSelect("student")}
              >
                <span className="role-icon">🎓</span>
                <span className="role-title">Student</span>
                <small className="role-desc">Ask questions & get answers</small>
              </button>

              <button
                type="button"
                className={`role-button ${role === "faculty" ? "active" : ""}`}
                onClick={() => handleRoleSelect("faculty")}
              >
                <span className="role-icon">👨‍🏫</span>
                <span className="role-title">Faculty</span>
                <small className="role-desc">Review & resolve queries</small>
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {isRegister && role === "faculty" && (
            <div className="auth-field-group">
              <label className="auth-field-label">FACULTY PROFILE</label>
              <select
                value={selectedFacultyProfile}
                onChange={handleFacultyProfileChange}
                className="auth-input"
              >
                <option value="">-- Choose from Faculty Roster --</option>
                {allFaculty.map((fName) => (
                  <option key={fName} value={fName}>
                    {fName}
                  </option>
                ))}
                <option value="custom">Other / Enter Custom Name</option>
              </select>
            </div>
          )}

          {isRegister && (
            <div className="auth-field-group">
              <label className="auth-field-label">
                {role === "faculty" ? "FACULTY NAME" : "FULL NAME"}
              </label>
              <input
                type="text"
                className="auth-input"
                placeholder={role === "faculty" ? "e.g. Dr. Robin Kumar" : "e.g. Ankit Sharma"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          {isRegister && role === "faculty" && (
            <div className="auth-field-group">
              <label className="auth-field-label">DEPARTMENT</label>
              <input
                type="text"
                className="auth-input"
                placeholder="Department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
          )}

          <div className="auth-field-group">
            <label className="auth-field-label">EMAIL ADDRESS</label>
            <input
              type="email"
              className="auth-input"
              placeholder={role === "faculty" && isRegister ? "faculty@university.edu" : "student@university.edu"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

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

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading
              ? "Please wait..."
              : isRegister
              ? `Register as ${role === "faculty" ? "Faculty" : "Student"}`
              : "Sign In →"}
          </button>
        </form>

        <p className="auth-switch">
          {isRegister ? "Already registered?" : "New to AskMyFaculty?"}{" "}
          <span
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
            }}
          >
            {isRegister ? "Sign In here" : "Create an Account"}
          </span>
        </p>
      </div>
    </div>
  );
}

export default Auth;
