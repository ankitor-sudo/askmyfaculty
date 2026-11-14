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
  serverTimestamp
} from "firebase/firestore";
import Auth from "./Auth";
import StudentInterface from "./components/StudentInterface";
import FacultyInterface from "./components/FacultyInterface";
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
              role: "student"
            };
            setUserProfile(fallbackProfile);
          }
        } catch (err) {
          console.error("Error fetching user profile:", err);
          setUserProfile({
            uid: currentUser.uid,
            name: currentUser.displayName || currentUser.email?.split("@")[0] || "User",
            email: currentUser.email,
            role: "student"
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

  // Logout
  const handleLogout = async () => {
    try {
      setStudentQuestions([]);
      setFacultyQueries([]);
      setUserProfile(null);
      await signOut(auth);
    } catch (error) {
      alert(error.message);
    }
  };

  // Student: Submit Question
  const handleSubmitQuestion = async ({
    subjectCode,
    subjectName,
    facultyName,
    question
  }) => {
    const studentDisplayName =
      userProfile?.name || user?.displayName || user?.email?.split("@")[0] || "Student";

    await addDoc(collection(db, "queries"), {
      studentId: user.uid,
      studentName: studentDisplayName,
      studentEmail: user.email,
      subjectCode,
      subjectName,
      facultyName,
      question,
      status: "Pending",
      answer: null,
      createdAt: serverTimestamp()
    });
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

  // Strict role enforcement: No role switching or page swapping without logging out
  if (userProfile?.role === "faculty") {
    return (
      <FacultyInterface
        user={user}
        userProfile={userProfile}
        allQueries={facultyQueries}
        loadingQueries={loadingFacultyQueries}
        onUpdateQueryAnswer={handleUpdateQueryAnswer}
        onUpdateQueryStatus={handleUpdateQueryStatus}
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
      onSubmitQuestion={handleSubmitQuestion}
      onLogout={handleLogout}
    />
  );
}

export default App;
