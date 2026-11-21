import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "./firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";
import Auth from "./Auth";
import StudentInterface from "./components/StudentInterface";
import FacultyInterface from "./components/FacultyInterface";
import { generateAiAnswer } from "./services/aiService";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Questions for the student
  const [studentQuestions, setStudentQuestions] = useState([]);
  const [loadingStudentQuestions, setLoadingStudentQuestions] = useState(true);

  // All queries for faculty
  const [facultyQueries, setFacultyQueries] = useState([]);
  const [loadingFacultyQueries, setLoadingFacultyQueries] = useState(true);

  // Announcements / Section Notices
  const [announcements, setAnnouncements] = useState([]);
  const [_loadingAnnouncements, setLoadingAnnouncements] = useState(true);

  // 1. Auth Listener & Profile Fetch
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data();
            setUserProfile(data);
          } else {
            // Default profile for legacy user
            const fallbackProfile = {
              uid: currentUser.uid,
              name: currentUser.displayName || currentUser.email?.split("@")[0] || "User",
              email: currentUser.email,
              role: "student",
              section: "K25PS"
            };
            setUserProfile(fallbackProfile);
          }
        } catch (err) {
          console.error("Error fetching user profile:", err);
          setUserProfile({
            uid: currentUser.uid,
            name: currentUser.displayName || currentUser.email?.split("@")[0] || "User",
            email: currentUser.email,
            role: "student",
            section: "K25PS"
          });
        }
      } else {
        setUserProfile(null);
      }
      setCheckingAuth(false);
    });

    return () => unsubscribe();
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

  if (checkingAuth) {
    return <div className="auth-loading">Loading AskMyFaculty...</div>;
  }

  if (!user) {
    return <Auth />;
  }

  // Show loader while profile is still being fetched from Firestore
  if (!userProfile) {
    return <div className="auth-loading">Loading your profile...</div>;
  }

  // Strict role enforcement
  if (userProfile?.role === "faculty") {
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
