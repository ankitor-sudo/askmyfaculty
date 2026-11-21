import { auth, db } from "./firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "firebase/auth";
import { availableSections, defaultSection } from "./sections";
import { INITIAL_ADMIN_EMAILS } from "./adminConfig";
import "./Auth.css";

/* ── Feature data ── */
const FEATURES = [
  {
    icon: "⚡",
    title: "AI-Powered Fast Answers",
    desc: "Get instant AI-generated explanations for your academic doubts before faculty responds.",
  },
  {
    icon: "👨‍🏫",
    title: "Direct Faculty Connect",
    desc: "Post questions directly to subject faculty and receive verified, authoritative answers.",
  },
  {
    icon: "📢",
    title: "Section Notices",
    desc: "Stay updated with real-time announcements and notices specific to your class section.",
  },
  {
    icon: "📅",
    title: "Appointment Booking",
    desc: "Schedule one-on-one consultation slots with faculty at your convenience.",
  },
  {
    icon: "📊",
    title: "Question Tracking",
    desc: "Track the status of every question you've asked — pending, answered, or resolved.",
  },
  {
    icon: "🔐",
    title: "Secure Dual Portals",
    desc: "Separate, role-based portals for students and faculty ensure data privacy and clarity.",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Create Your Account",
    desc: "Sign up with your university email and choose your role — Student or Faculty.",
  },
  {
    num: "02",
    title: "Post Your Doubt",
    desc: "Students ask questions to their subject faculty with full context and attachments.",
  },
  {
    num: "03",
    title: "Get Expert Answers",
    desc: "Faculty responds with verified answers; AI provides instant preliminary guidance.",
  },
  {
    num: "04",
    title: "Track & Resolve",
    desc: "Mark doubts resolved, re-ask, or book a slot for in-depth consultation.",
  },
];

const TESTIMONIALS = [
  {
    stars: 5,
    quote:
      "AskMyFaculty completely changed how I interact with my professors. I get answers within minutes instead of waiting till the next class!",
    name: "Priya S.",
    role: "B.Tech CSE, Sem 4",
    avatar: "P",
  },
  {
    stars: 5,
    quote:
      "Managing student queries is so much easier now. I can respond from anywhere, and the section filter helps me stay organised.",
    name: "Dr. Robin Kumar",
    role: "Faculty, Computer Science",
    avatar: "R",
  },
  {
    stars: 5,
    quote:
      "The AI explanation feature is a game-changer. Even before my faculty replies, I get a solid starting point to understand the concept.",
    name: "Rahul M.",
    role: "B.Tech IT, Sem 3",
    avatar: "R",
  },
];

function Auth() {
  /* ── State ── */
  const [step, setStep] = useState("role"); // "role" | "form"
  const [role, setRole] = useState("");     // "student" | "faculty" | "admin"
  const [isRegister, setIsRegister] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Faculty specific fields
  const [facultyId, setFacultyId] = useState("");
  const [department, setDepartment] = useState("Computer Science & Engineering");
  const [designation, setDesignation] = useState("Assistant Professor");
  const [subjectsTaught, setSubjectsTaught] = useState("");

  // Student specific fields
  const [section, setSection] = useState(defaultSection || "K25PS");
  const [customSection, setCustomSection] = useState("");
  const [isCustomSection, setIsCustomSection] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* ── Helpers ── */
  const isFaculty = role === "faculty";
  const isAdmin = role === "admin";
  const isStudent = role === "student";

  const scrollToAuth = () => {
    document.getElementById("auth-panel-anchor")?.scrollIntoView({ behavior: "smooth" });
  };

  const openSignIn = () => {
    setIsRegister(false);
    setError("");
    setStep("role");
    scrollToAuth();
  };

  const openRegister = () => {
    setIsRegister(true);
    setError("");
    setStep("role");
    scrollToAuth();
  };

  /* ── Handlers ── */
  const handleRoleChoose = (chosenRole) => {
    setRole(chosenRole);
    setError("");
    if (chosenRole === "admin") {
      setIsRegister(false); // Admin has no registration
    }
    setStep("form");
    scrollToAuth();
  };

  const handleBack = () => {
    setStep("role");
    setRole("");
    setError("");
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFacultyId("");
    setDesignation("Assistant Professor");
    setSubjectsTaught("");
    setSection(defaultSection || "K25PS");
    setCustomSection("");
    setIsCustomSection(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isRegister) {
      if (!name.trim()) { setError("Please enter your full name."); return; }
      if (password !== confirmPassword) { setError("Passwords do not match."); return; }
      if (password.length < 6) { setError("Password must be at least 6 characters."); return; }

      // Extra validations for faculty registration
      if (isFaculty) {
        if (!facultyId.trim()) { setError("Please enter your Official Faculty ID."); return; }
        if (!department.trim()) { setError("Please enter your Department."); return; }
        if (!designation.trim()) { setError("Please enter your Designation."); return; }
        if (!subjectsTaught.trim()) { setError("Please list the subject(s) you teach."); return; }
      }
    }

    const finalSection = isCustomSection
      ? (customSection.trim().toUpperCase() || defaultSection || "K25PS")
      : (section || defaultSection || "K25PS");

    try {
      setLoading(true);

      // Cache role for auto-healing
      try {
        sessionStorage.setItem("last_auth_role", role);
      } catch (err) {
        console.warn("Could not cache auth role:", err);
      }

      if (isRegister) {
        // Prevent registration for admin
        if (isAdmin) {
          setError("Administrator accounts cannot be registered publicly.");
          setLoading(false);
          return;
        }

        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: name.trim() });

        if (isFaculty) {
          // Faculty registration: status is PENDING APPROVAL
          await setDoc(doc(db, "users", result.user.uid), {
            uid: result.user.uid,
            name: name.trim(),
            email: email.trim(),
            role: "faculty",
            approvalStatus: "pending",
            facultyId: facultyId.trim(),
            department: department.trim(),
            designation: designation.trim(),
            subjectsTaught: subjectsTaught.trim(),
            facultyName: name.trim(),
            appliedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
          });
        } else {
          // Student registration: automatically granted student role
          await setDoc(doc(db, "users", result.user.uid), {
            uid: result.user.uid,
            name: name.trim(),
            email: email.trim(),
            role: "student",
            section: finalSection,
            createdAt: serverTimestamp(),
          });
        }
      } else {
        // ── Sign In ──
        const result = await signInWithEmailAndPassword(auth, email, password);

        // Read Firestore profile
        const profileSnap = await getDoc(doc(db, "users", result.user.uid));
        const emailLower = email.trim().toLowerCase();
        const isAuthorizedInitialAdmin = INITIAL_ADMIN_EMAILS.includes(emailLower);

        if (isAdmin) {
          const profileData = profileSnap.exists() ? profileSnap.data() : null;
          const isDbAdmin = profileData?.role === "admin";

          if (!isDbAdmin && !isAuthorizedInitialAdmin) {
            await signOut(auth);
            setError("⚠️ Access Denied: You do not have administrator privileges.");
            setLoading(false);
            return;
          }

          // If authorized initial admin but document not marked admin yet, auto-provision
          if (isAuthorizedInitialAdmin && !isDbAdmin) {
            await setDoc(
              doc(db, "users", result.user.uid),
              {
                uid: result.user.uid,
                name: result.user.displayName || email.split("@")[0] || "Admin",
                email: email.trim(),
                role: "admin",
                createdAt: serverTimestamp(),
              },
              { merge: true }
            );
          }
        } else if (profileSnap.exists()) {
          const profileData = profileSnap.data();

          // Role mismatch protection
          if (profileData.role && profileData.role !== role) {
            await signOut(auth);
            if (profileData.role === "admin") {
              setError("This is an Administrator account. Please select the Administrator Portal.");
            } else if (profileData.role === "faculty") {
              setError("This is a Faculty account. Please choose the Faculty Portal.");
            } else {
              setError("This is a Student account. Please choose the Student Portal.");
            }
            setLoading(false);
            return;
          }
        } else {
          // Auto-provision legacy profile doc if missing
          await setDoc(doc(db, "users", result.user.uid), {
            uid: result.user.uid,
            name: result.user.displayName || email.split("@")[0] || "User",
            email: email.trim(),
            role,
            approvalStatus: role === "faculty" ? "pending" : null,
            section: role === "student" ? finalSection : null,
            createdAt: serverTimestamp(),
          });
        }

        // Update student section if changed on login
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
        "auth/wrong-password": "Invalid email or password.",
      };
      setError(codeMap[err.code] || err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ══════════════════════════════════════
     AUTH PANEL (right column)
  ══════════════════════════════════════ */
  const renderAuthPanel = () => (
    <div className="auth-panel" id="auth-panel-anchor">
      {step === "role" ? (
        <>
          {/* Mode tabs */}
          <div className="auth-panel-step-tabs">
            <button
              type="button"
              className={`auth-panel-mode-btn${!isRegister ? " active" : ""}`}
              onClick={() => { setIsRegister(false); setError(""); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-panel-mode-btn${isRegister ? " active" : ""}`}
              onClick={() => { setIsRegister(true); setError(""); }}
            >
              Register
            </button>
          </div>

          {/* Header */}
          <div className="auth-panel-header">
            <div className="auth-panel-logo">A</div>
            <h2 className="auth-panel-title">
              {isRegister ? "Create your account" : "Welcome back"}
            </h2>
            <p className="auth-panel-subtitle">Choose your portal to continue</p>
          </div>

          {/* Portal cards */}
          <div className="auth-panel-role-cards">
            {/* Student */}
            <button
              type="button"
              className="auth-panel-portal-card student-card"
              onClick={() => handleRoleChoose("student")}
            >
              <div className="auth-panel-portal-icon">🎓</div>
              <div className="auth-panel-portal-body">
                <span className="auth-panel-portal-title">Student Portal</span>
                <span className="auth-panel-portal-desc">
                  Ask doubts, track faculty replies, book office hours
                </span>
              </div>
              <span className="auth-panel-portal-arrow">→</span>
            </button>

            {/* Faculty */}
            <button
              type="button"
              className="auth-panel-portal-card faculty-card"
              onClick={() => handleRoleChoose("faculty")}
            >
              <div className="auth-panel-portal-icon">👨‍🏫</div>
              <div className="auth-panel-portal-body">
                <span className="auth-panel-portal-title">Faculty Portal</span>
                <span className="auth-panel-portal-desc">
                  {isRegister ? "Apply for faculty verification and dashboard access" : "Review student queries, respond, manage consultations"}
                </span>
              </div>
              <span className="auth-panel-portal-arrow">→</span>
            </button>

            {/* Administrator (Sign In Only) */}
            <button
              type="button"
              className="auth-panel-portal-card admin-card"
              onClick={() => handleRoleChoose("admin")}
            >
              <div className="auth-panel-portal-icon">🛡️</div>
              <div className="auth-panel-portal-body">
                <span className="auth-panel-portal-title">Administrator Portal</span>
                <span className="auth-panel-portal-desc">
                  Verify faculty applications and supervise platform metrics
                </span>
              </div>
              <span className="auth-panel-portal-arrow">→</span>
            </button>
          </div>

          <p className="auth-panel-switch">
            {isRegister ? "Already have an account?" : "New to AskMyFaculty?"}
            <span onClick={() => { setIsRegister(!isRegister); setError(""); }}>
              {isRegister ? " Sign In" : " Get Started Free"}
            </span>
          </p>
        </>
      ) : (
        <>
          {/* Back + Role badge */}
          <div className="auth-panel-back-row">
            <button type="button" className="auth-panel-back-btn" onClick={handleBack}>
              ← Back
            </button>
            <span className={`auth-panel-role-badge ${role}`}>
              {isFaculty && "👨‍🏫 Faculty Portal"}
              {isStudent && "🎓 Student Portal"}
              {isAdmin && "🛡️ Administrator Portal"}
            </span>
          </div>

          {/* Mode tabs (hidden for Admin, since admin is sign-in only) */}
          {!isAdmin ? (
            <div className="auth-panel-step-tabs" style={{ marginBottom: "20px" }}>
              <button
                type="button"
                className={`auth-panel-mode-btn${!isRegister ? " active" : ""}`}
                onClick={() => { setIsRegister(false); setError(""); }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`auth-panel-mode-btn${isRegister ? " active" : ""}`}
                onClick={() => { setIsRegister(true); setError(""); }}
              >
                {isFaculty ? "Apply as Faculty" : "Register"}
              </button>
            </div>
          ) : (
            <div
              style={{
                background: "rgba(139, 92, 246, 0.12)",
                border: "1px solid rgba(139, 92, 246, 0.3)",
                borderRadius: "10px",
                padding: "8px 12px",
                fontSize: "12px",
                color: "#ddd6fe",
                marginBottom: "20px",
                textAlign: "center",
              }}
            >
              🛡️ Administrator Access • Authorized Personnel Only
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-panel-form">

            {/* Name (register only) */}
            {isRegister && (
              <div className="auth-panel-field-group">
                <label className="auth-panel-label">
                  {isFaculty ? "FACULTY FULL NAME (WITH TITLE)" : "FULL NAME"}
                </label>
                <input
                  type="text"
                  className="auth-panel-input"
                  placeholder={isFaculty ? "e.g. Dr. Robin Kumar" : "e.g. Ankit Sharma"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Faculty Specific Registration Fields */}
            {isRegister && isFaculty && (
              <>
                <div className="auth-panel-field-group">
                  <label className="auth-panel-label">OFFICIAL FACULTY ID</label>
                  <input
                    type="text"
                    className="auth-panel-input"
                    placeholder="e.g. FAC-CSE-2024"
                    value={facultyId}
                    onChange={(e) => setFacultyId(e.target.value)}
                    required
                  />
                </div>

                <div className="auth-panel-field-group">
                  <label className="auth-panel-label">DESIGNATION</label>
                  <select
                    className="auth-panel-select"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                  >
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Professor">Professor</option>
                    <option value="Head of Department (HOD)">Head of Department (HOD)</option>
                    <option value="Lecturer / Teaching Assistant">Lecturer / Teaching Assistant</option>
                  </select>
                </div>

                <div className="auth-panel-field-group">
                  <label className="auth-panel-label">DEPARTMENT</label>
                  <input
                    type="text"
                    className="auth-panel-input"
                    placeholder="e.g. Computer Science & Engineering"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                  />
                </div>

                <div className="auth-panel-field-group">
                  <label className="auth-panel-label">SUBJECTS TAUGHT</label>
                  <input
                    type="text"
                    className="auth-panel-input"
                    placeholder="e.g. OOPs (CSE202), DSA (CSE205)"
                    value={subjectsTaught}
                    onChange={(e) => setSubjectsTaught(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            {/* Section (students — both sign-in and register) */}
            {isStudent && (
              <div className="auth-panel-field-group">
                <label className="auth-panel-label">
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
                  className="auth-panel-select"
                >
                  {availableSections.map((sec) => (
                    <option key={sec} value={sec}>Section {sec}</option>
                  ))}
                  <option value="custom">Other / Custom Section</option>
                </select>
                {isCustomSection && (
                  <input
                    type="text"
                    className="auth-panel-input"
                    placeholder="Enter custom section (e.g. K25CS)"
                    value={customSection}
                    onChange={(e) => setCustomSection(e.target.value.toUpperCase())}
                    style={{ marginTop: "6px" }}
                  />
                )}
              </div>
            )}

            {/* Email */}
            <div className="auth-panel-field-group">
              <label className="auth-panel-label">
                {isFaculty ? "OFFICIAL FACULTY EMAIL" : isAdmin ? "ADMINISTRATOR EMAIL" : "EMAIL ADDRESS"}
              </label>
              <input
                type="email"
                className="auth-panel-input"
                placeholder={
                  isFaculty
                    ? "professor@university.edu"
                    : isAdmin
                    ? "admin@university.edu"
                    : "student@university.edu"
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div className="auth-panel-field-group">
              <label className="auth-panel-label">PASSWORD</label>
              <input
                type="password"
                className="auth-panel-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Confirm password (register only) */}
            {isRegister && (
              <div className="auth-panel-field-group">
                <label className="auth-panel-label">CONFIRM PASSWORD</label>
                <input
                  type="password"
                  className="auth-panel-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            )}

            {error && <div className="auth-panel-error">{error}</div>}

            <button
              type="submit"
              className={`auth-panel-submit ${
                isFaculty ? "faculty-submit-btn" : isAdmin ? "admin-submit-btn" : ""
              }`}
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : isRegister
                ? isFaculty
                  ? "Submit Faculty Application →"
                  : "Register as Student →"
                : isAdmin
                ? "Sign In as Administrator →"
                : isFaculty
                ? "Sign In to Faculty Portal →"
                : "Sign In to Student Portal →"}
            </button>
          </form>

          {!isAdmin && (
            <p className="auth-panel-switch">
              {isRegister ? "Already registered?" : "New to AskMyFaculty?"}
              <span onClick={() => { setIsRegister(!isRegister); setError(""); }}>
                {isRegister ? " Sign In" : isFaculty ? " Apply as Faculty" : " Create Account"}
              </span>
            </p>
          )}
        </>
      )}
    </div>
  );

  /* ══════════════════════════════════════
     FULL LANDING PAGE RENDER
  ══════════════════════════════════════ */
  return (
    <div className="landing-root">
      {/* ── Fixed Top Navbar ── */}
      <nav className="landing-navbar">
        <div className="landing-nav-brand">
          <div className="landing-nav-logo">A</div>
          <span>AskMyFaculty</span>
        </div>

        <div className="landing-nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#testimonials">Testimonials</a>
        </div>

        <div className="landing-nav-cta-group">
          <button className="landing-nav-signin-btn" onClick={openSignIn}>
            Sign In
          </button>
          <button className="landing-nav-register-btn" onClick={openRegister}>
            Get Started Free
          </button>
        </div>
      </nav>

      {/* ── Split Layout ── */}
      <div className="landing-split-layout">
        {/* ══ LEFT — Landing Content ══ */}
        <div className="landing-content-side">
          {/* Hero */}
          <section className="landing-hero">
            <span className="hero-launch-badge">
              <span className="hero-launch-dot" />
              Now in Beta — Free for all students
            </span>

            <h1>
              Academic doubts resolved{" "}
              <span className="hero-gradient-text">instantly</span>
            </h1>

            <p className="hero-lead">
              Ask questions to your faculty, get instant AI explanations, and
              track every resolution — all in one unified academic platform built
              for modern universities.
            </p>

            <div className="hero-cta-row">
              <button className="hero-cta-primary" onClick={openRegister}>
                Get Started Free →
              </button>
              <a className="hero-cta-secondary" href="#how-it-works">
                See How It Works ↓
              </a>
            </div>

            <div className="hero-stats-row">
              <div className="hero-stat-item">
                <div className="hero-stat-number">500+</div>
                <div className="hero-stat-label">Students Enrolled</div>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat-item">
                <div className="hero-stat-number">98%</div>
                <div className="hero-stat-label">Doubts Resolved</div>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat-item">
                <div className="hero-stat-number">&lt;15min</div>
                <div className="hero-stat-label">Average Response</div>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="landing-section" id="features">
            <div className="landing-section-label">✦ Features</div>
            <h2>Everything you need for academic support</h2>
            <p className="section-lead">
              From AI-powered instant answers to direct faculty communication —
              we've built every tool you need to never stay stuck on a doubt again.
            </p>
            <div className="features-grid">
              {FEATURES.map((f) => (
                <div className="feature-card" key={f.title}>
                  <div className="feature-card-icon">{f.icon}</div>
                  <h3 className="feature-card-title">{f.title}</h3>
                  <p className="feature-card-desc">{f.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* How It Works */}
          <section className="landing-section" id="how-it-works">
            <div className="landing-section-label">⚙ How It Works</div>
            <h2>Get answers in 4 simple steps</h2>
            <p className="section-lead">
              Our streamlined process gets you from doubt to resolution in minutes,
              not days.
            </p>
            <div className="steps-grid">
              {STEPS.map((s) => (
                <div className="step-card" key={s.num}>
                  <div className="step-num">{s.num}</div>
                  <h3 className="step-title">{s.title}</h3>
                  <p className="step-desc">{s.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Testimonials */}
          <section className="landing-section" id="testimonials">
            <div className="landing-section-label">❝ Testimonials</div>
            <h2>Loved by students and faculty alike</h2>
            <div className="testimonials-grid">
              {TESTIMONIALS.map((t, i) => (
                <div className="testimonial-card" key={i}>
                  <div className="testimonial-stars">
                    {"★".repeat(t.stars)}
                  </div>
                  <p className="testimonial-quote">&ldquo;{t.quote}&rdquo;</p>
                  <div className="testimonial-author">
                    <div className="testimonial-avatar">{t.avatar}</div>
                    <div>
                      <div className="testimonial-name">{t.name}</div>
                      <div className="testimonial-role">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* CTA Banner */}
          <section className="landing-cta-banner">
            <h2>Ready to never miss an answer?</h2>
            <p>Join hundreds of students already getting faster, clearer academic support.</p>
            <button className="hero-cta-primary" onClick={openRegister}>
              Create Free Account →
            </button>
          </section>

          {/* Footer */}
          <footer className="landing-footer">
            <div className="landing-footer-brand">
              <div className="landing-nav-logo" style={{ width: 28, height: 28, fontSize: 14 }}>A</div>
              <span>AskMyFaculty</span>
            </div>
            <p>© 2026 AskMyFaculty. Built for academic excellence.</p>
          </footer>
        </div>

        {/* ══ RIGHT — Sticky Auth Panel ══ */}
        <div className="landing-auth-side">
          {renderAuthPanel()}
        </div>
      </div>
    </div>
  );
}

export default Auth;
