import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "./firebase";
import {
  addDoc,
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  where,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";
import Auth from "./Auth";
import { INITIAL_ADMIN_EMAILS } from "./adminConfig";
import StudentInterface from "./components/StudentInterface";
import FacultyInterface from "./components/FacultyInterface";
import FacultyApplicationStatus from "./components/FacultyApplicationStatus";
import AdminDashboard from "./components/AdminDashboard";
import { generateAiAnswer } from "./services/aiService";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [profileLoadingTimeout, setProfileLoadingTimeout] = useState(false);

  // Questions for the student
  const [studentQuestions, setStudentQuestions] = useState([]);
  const [loadingStudentQuestions, setLoadingStudentQuestions] = useState(true);

  // All queries for faculty
  const [facultyQueries, setFacultyQueries] = useState([]);
  const [loadingFacultyQueries, setLoadingFacultyQueries] = useState(true);

  // Announcements / Section Notices
  const [announcements, setAnnouncements] = useState([]);
  const [_loadingAnnouncements, setLoadingAnnouncements] = useState(true);

  // Profile timeout timer: if profile takes >2.5s, offer manual recovery
  useEffect(() => {
    if (user && (!userProfile || !userProfile.role)) {
      const timer = setTimeout(() => {
        setProfileLoadingTimeout(true);
      }, 2500);
      return () => {
        clearTimeout(timer);
        setProfileLoadingTimeout(false);
      };
    }
  }, [user, userProfile]);

  // 1. Auth Listener + Live Profile Listener (onSnapshot with auto-healing)
  useEffect(() => {
    let profileUnsub = null;

    const authUnsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (profileUnsub) {
        profileUnsub();
        profileUnsub = null;
      }

      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);

        profileUnsub = onSnapshot(
          userDocRef,
          (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              // Check if authorized initial admin
              const emailLower = currentUser.email?.toLowerCase();
              if (INITIAL_ADMIN_EMAILS.includes(emailLower) && data.role !== "admin") {
                const adminDoc = { ...data, role: "admin" };
                setDoc(userDocRef, { role: "admin" }, { merge: true }).catch(console.error);
                setUserProfile(adminDoc);
              } else {
                setUserProfile(data);
              }
            } else {
              // Doc not found yet. Check if initial admin or cached role
              const emailLower = currentUser.email?.toLowerCase();
              const isInitialAdmin = INITIAL_ADMIN_EMAILS.includes(emailLower);
              const cachedRole = sessionStorage.getItem("last_auth_role");

              if (isInitialAdmin) {
                const adminDoc = {
                  uid: currentUser.uid,
                  name: currentUser.displayName || currentUser.email?.split("@")[0] || "Admin",
                  email: currentUser.email,
                  role: "admin",
                  createdAt: serverTimestamp(),
                };
                setDoc(userDocRef, adminDoc, { merge: true }).catch(console.error);
                setUserProfile(adminDoc);
                sessionStorage.removeItem("last_auth_role");
              } else if (cachedRole) {
                const autoDoc = {
                  uid: currentUser.uid,
                  name: currentUser.displayName || currentUser.email?.split("@")[0] || "User",
                  email: currentUser.email,
                  role: cachedRole,
                  approvalStatus: cachedRole === "faculty" ? "pending" : null,
                  section: cachedRole === "student" ? "K25PS" : null,
                  facultyName: cachedRole === "faculty" ? (currentUser.displayName || currentUser.email?.split("@")[0] || "Faculty") : null,
                  department: cachedRole === "faculty" ? "Computer Science & Engineering" : null,
                  createdAt: serverTimestamp(),
                };
                setDoc(userDocRef, autoDoc, { merge: true }).catch(console.error);
                setUserProfile(autoDoc);
                sessionStorage.removeItem("last_auth_role");
              } else {
                setUserProfile(null);
              }
            }
            setCheckingAuth(false);
          },
          (err) => {
            console.error("Error watching user profile:", err);
            const cachedRole = sessionStorage.getItem("last_auth_role") || "student";
            setUserProfile({
              uid: currentUser.uid,
              name: currentUser.displayName || currentUser.email?.split("@")[0] || "User",
              email: currentUser.email,
              role: cachedRole,
              section: "K25PS",
            });
            setCheckingAuth(false);
          }
        );
      } else {
        setUserProfile(null);
        setCheckingAuth(false);
      }
    });

    return () => {
      authUnsub();
      if (profileUnsub) profileUnsub();
    };
  }, []);

  // 2. Student Questions Listener
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "queries"),
      where("studentId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const questions = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        }));

        questions.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() ?? 0;
          const bTime = b.createdAt?.toMillis?.() ?? 0;
          return bTime - aTime;
        });

        setStudentQuestions(questions);
        setLoadingStudentQuestions(false);
      },
      (error) => {
        console.error("Error loading student questions:", error);
        setLoadingStudentQuestions(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // 3. Faculty Queries Listener
  useEffect(() => {
    if (!user) return;

    const q = collection(db, "queries");

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const queriesList = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        }));

        queriesList.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() ?? 0;
          const bTime = b.createdAt?.toMillis?.() ?? 0;
          return bTime - aTime;
        });

        setFacultyQueries(queriesList);
        setLoadingFacultyQueries(false);
      },
      (error) => {
        console.error("Error loading faculty queries:", error);
        setLoadingFacultyQueries(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // 4. Announcements / Section Notices Listener
  useEffect(() => {
    if (!user) return;

    const q = collection(db, "announcements");

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        }));

        list.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() ?? 0;
          const bTime = b.createdAt?.toMillis?.() ?? 0;
          return bTime - aTime;
        });

        setAnnouncements(list);
        setLoadingAnnouncements(false);
      },
      (error) => {
        console.error("Error loading announcements:", error);
        setLoadingAnnouncements(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Logout
  const handleLogout = async () => {
    try {
      setStudentQuestions([]);
      setFacultyQueries([]);
      setAnnouncements([]);
      setUserProfile(null);
      await signOut(auth);
    } catch (error) {
      alert(error.message);
    }
  };

  // Student: Submit Question (with optional Fast AI Resolution)
  const handleSubmitQuestion = async ({
    subjectCode,
    subjectName,
    facultyName,
    question,
    enableAiFastAnswer = true,
    aiAnswer = null,
    transferredFromAi = false,
    transferredToFaculty = false,
    transferReason = null,
    status = null
  }) => {
    const studentDisplayName =
      userProfile?.name || user?.displayName || user?.email?.split("@")[0] || "Student";

    let finalAiAnswer = aiAnswer;
    let finalStatus = status;

    if (enableAiFastAnswer && !finalAiAnswer) {
      try {
        const aiRes = await generateAiAnswer({
          question,
          subjectCode,
          subjectName,
          facultyName
        });
        finalAiAnswer = aiRes.answer;
        finalStatus = "AI Answered";
      } catch (err) {
        console.warn("Could not generate AI fast answer, defaulting to Pending:", err);
        finalStatus = "Pending";
      }
    } else if (!finalStatus) {
      finalStatus = "Pending";
    }

    const docData = {
      studentId: user.uid,
      studentName: studentDisplayName,
      studentEmail: user.email,
      studentSection: userProfile?.section || "K25PS",
      subjectCode,
      subjectName,
      facultyName,
      question,
      status: finalStatus,
      answer: null,
      aiAnswer: finalAiAnswer || null,
      transferredFromAi: Boolean(transferredFromAi),
      transferredToFaculty: Boolean(transferredToFaculty),
      transferReason: transferReason || null,
      createdAt: serverTimestamp(),
      reviewDeadline: Date.now() + 15 * 60 * 1000 // 15 mins window
    };

    if (finalAiAnswer) {
      docData.aiAnsweredAt = serverTimestamp();
    }

    await addDoc(collection(db, "queries"), docData);
  };

  // Student: Transfer Question to Assigned Faculty
  const handleTransferQuestion = async (queryId, reason) => {
    const queryDocRef = doc(db, "queries", queryId);
    await updateDoc(queryDocRef, {
      status: "Pending",
      transferredToFaculty: true,
      transferReason: reason || "Student unsatisfied with AI answer",
      transferredAt: serverTimestamp()
    });
  };

  // Student: Mark AI Answer as Satisfied
  const handleMarkSatisfied = async (queryId) => {
    const queryDocRef = doc(db, "queries", queryId);
    await updateDoc(queryDocRef, {
      status: "Resolved (AI)",
      studentSatisfied: true,
      resolvedAt: serverTimestamp()
    });
  };

  // Student: Update Assigned Section
  const handleUpdateStudentSection = async (newSection) => {
    setUserProfile((prev) => ({ ...prev, section: newSection }));
    try {
      await updateDoc(doc(db, "users", user.uid), { section: newSection });
    } catch (err) {
      console.warn("Could not save section to Firestore:", err);
    }
  };

  // Update Profile Info in Firestore
  const handleUpdateProfile = async (updates) => {
    setUserProfile((prev) => ({ ...prev, ...updates }));
    try {
      await updateDoc(doc(db, "users", user.uid), updates);
    } catch (err) {
      console.warn("Could not save profile updates to Firestore:", err);
    }
  };

  // Faculty: Create / Broadcast Section Notice
  const handleCreateAnnouncement = async (noticeData) => {
    try {
      await addDoc(collection(db, "announcements"), {
        ...noticeData,
        facultyId: user.uid,
        facultyName: noticeData.facultyName || userProfile?.facultyName || user?.displayName || "Faculty",
        createdAt: serverTimestamp()
      });
      return true;
    } catch (err) {
      alert("Failed to broadcast notice: " + err.message);
      return false;
    }
  };

  // Faculty: Delete Notice
  const handleDeleteAnnouncement = async (noticeId) => {
    try {
      await deleteDoc(doc(db, "announcements", noticeId));
    } catch (err) {
      alert("Failed to delete notice: " + err.message);
    }
  };

  // Faculty: Submit Answer / Response
  const handleUpdateQueryAnswer = async (queryId, answerText, status, facultyName) => {
    const queryDocRef = doc(db, "queries", queryId);
    await updateDoc(queryDocRef, {
      answer: answerText,
      status: status || "Answered",
      answeredBy: facultyName || userProfile?.facultyName || user?.displayName || "Faculty",
      answeredAt: serverTimestamp()
    });
  };

  // Faculty: Update Query Status
  const handleUpdateQueryStatus = async (queryId, newStatus) => {
    const queryDocRef = doc(db, "queries", queryId);
    await updateDoc(queryDocRef, {
      status: newStatus
    });
  };

  // Self-provision or repair profile if document is missing or corrupted
  const handleSelfProvisionProfile = async (chosenRole) => {
    if (!user) return;
    const defaultData = {
      uid: user.uid,
      name: user.displayName || user.email?.split("@")[0] || "User",
      email: user.email,
      role: chosenRole,
      approvalStatus: chosenRole === "faculty" ? "pending" : null,
      section: chosenRole === "student" ? "K25PS" : null,
      facultyName: chosenRole === "faculty" ? (user.displayName || user.email?.split("@")[0] || "Faculty") : null,
      department: chosenRole === "faculty" ? "Computer Science & Engineering" : null,
      createdAt: serverTimestamp(),
    };
    try {
      await setDoc(doc(db, "users", user.uid), defaultData, { merge: true });
      setUserProfile(defaultData);
    } catch (e) {
      console.error("Could not self-provision profile:", e);
      setUserProfile(defaultData);
    }
  };

  if (checkingAuth) {
    return <div className="auth-loading">Loading AskMyFaculty...</div>;
  }

  if (!user) {
    return <Auth />;
  }

  // Show loader with recovery option if Firestore document is delayed or missing
  if (!userProfile || !userProfile.role) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-card">
          <div className="auth-loading-spinner" />
          <h2>Setting up your profile...</h2>
          <p>Connecting to your academic dashboard...</p>

          {profileLoadingTimeout && (
            <div className="auth-recovery-box">
              <p className="auth-recovery-notice">
                Profile document was not found for this account. Choose your portal to finish setting up:
              </p>
              <div className="auth-recovery-buttons">
                <button
                  type="button"
                  className="auth-recovery-btn student"
                  onClick={() => handleSelfProvisionProfile("student")}
                >
                  🎓 Enter as Student
                </button>
                <button
                  type="button"
                  className="auth-recovery-btn faculty"
                  onClick={() => handleSelfProvisionProfile("faculty")}
                >
                  👨‍🏫 Register Faculty Application
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            className="auth-loading-signout"
            onClick={handleLogout}
          >
            ← Sign Out / Return to Login
          </button>
        </div>
      </div>
    );
  }

  // 1. Strict Administrator Role
  if (userProfile?.role === "admin") {
    return (
      <AdminDashboard
        user={user}
        userProfile={userProfile}
        onLogout={handleLogout}
      />
    );
  }

  // 2. Strict Faculty Role & Approval Enforcement
  if (userProfile?.role === "faculty") {
    if (userProfile?.approvalStatus === "approved") {
      return (
        <FacultyInterface
          user={user}
          userProfile={userProfile}
          allQueries={facultyQueries}
          loadingQueries={loadingFacultyQueries}
          announcements={announcements}
          onCreateAnnouncement={handleCreateAnnouncement}
          onDeleteAnnouncement={handleDeleteAnnouncement}
          onUpdateQueryAnswer={handleUpdateQueryAnswer}
          onUpdateQueryStatus={handleUpdateQueryStatus}
          onUpdateProfile={handleUpdateProfile}
          onLogout={handleLogout}
        />
      );
    }

    // Pending, Rejected, or Suspended -> Application Status Page
    return (
      <FacultyApplicationStatus
        user={user}
        userProfile={userProfile}
        onLogout={handleLogout}
        onProfileUpdated={(updated) => setUserProfile(updated)}
      />
    );
  }

  // 3. Student Role
  return (
    <StudentInterface
      user={user}
      userProfile={userProfile}
      userQuestions={studentQuestions}
      loadingQuestions={loadingStudentQuestions}
      announcements={announcements}
      studentSection={userProfile?.section || "K25PS"}
      onUpdateSection={handleUpdateStudentSection}
      onUpdateProfile={handleUpdateProfile}
      onSubmitQuestion={handleSubmitQuestion}
      onTransferQuestion={handleTransferQuestion}
      onMarkSatisfied={handleMarkSatisfied}
      onLogout={handleLogout}
    />
  );
}

export default App;
