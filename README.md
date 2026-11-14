# AskMyFaculty 🎓

> A real-time academic communication platform connecting students and faculty for structured query resolution, office-hour scheduling, and course support.

[![React](https://img.shields.io/badge/React-19.3-61DAFB?logo=react)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-13.2-FFCA28?logo=firebase)](https://firebase.google.com/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
  - [Student Interface](#-student-interface)
  - [Faculty Interface](#-faculty-interface)
  - [Authentication System](#-authentication-system)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Firebase Setup](#firebase-setup)
- [Course & Faculty Roster](#course--faculty-roster)
- [Firestore Data Schema](#firestore-data-schema)
- [Contributing](#contributing)

---

## Overview

**AskMyFaculty** is a full-stack React web application built to streamline academic communication between students and faculty at universities. Instead of chasing professors over email or WhatsApp, students can submit structured academic queries directly to their assigned faculty member, track the status in real time, view responses, and book office-hour appointments — all from one unified dashboard.

Faculty get a dedicated portal to manage their queue of student questions, respond with detailed explanations, attach quick templates, and manage office-hour consultation requests.

---

## Features

### 🎓 Student Interface

| Feature | Description |
|---|---|
| **Dashboard** | Live stats: total questions submitted, pending responses, resolved queries |
| **Ask a Question** | Modal form to select a subject, assigned faculty member, and submit a typed academic doubt |
| **My Questions** | Full history of submitted queries with faculty answers displayed inline; filterable by status (All / Pending / In Progress / Answered) and searchable by subject, faculty, or keyword |
| **Faculty Directory** | Browse all faculty members, view their courses, office hours, and cabin location; click "Ask Query" to pre-fill the question form for that professor |
| **Office Hours Booking** | Schedule 1-on-1 consultation slots by selecting faculty, subject, date, and preferred time slot |
| **Academic FAQs** | Searchable accordion of common academic policies — office hours, missed labs, assignment extensions, etc. |
| **Role Switcher** | Toggle between Student and Faculty views from the topbar or sidebar without logging out |

### 👨‍🏫 Faculty Interface

| Feature | Description |
|---|---|
| **Faculty Dashboard** | Overview stats: assigned queries, queries needing response, in-progress follow-ups, resolved count |
| **Faculty Selector** | Switch between faculty profiles (useful for admins or multi-role users) |
| **Incoming Queries** | View all student questions assigned to this faculty; scope toggle between "Direct to Me" and "All Department Queries" |
| **Answer & Resolve Modal** | Compose a detailed response with optional quick-fill templates; mark query status as Answered or In Progress |
| **Status Management** | Update any query's status via inline dropdown (Pending → In Progress → Answered) |
| **Office Hours Manager** | View all appointment requests; Confirm or Decline individual student meeting slots |
| **My Subjects / Course Roster** | View all assigned courses with per-subject query statistics (total, pending, resolved) |
| **Role Switcher** | Switch to Student view without logging out |

### 🔐 Authentication System

- **Role-based Registration**: Users register as either **Student** or **Faculty**
- **Faculty Roster Selection**: During faculty registration, the user selects their name from the official subject–faculty roster, ensuring clean query routing
- **Persistent Role Memory**: After login, the app automatically loads the correct interface (Student or Faculty) based on the role stored in Firestore
- **Firebase Auth**: Email/password authentication with display name and profile stored in Firestore's `users` collection
- **Legacy User Support**: Accounts created before role selection was added default to the Student interface

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | [React 19](https://reactjs.org/) with functional components and hooks |
| **Build Tool** | [Vite 8](https://vitejs.dev/) with HMR |
| **Backend / Database** | [Firebase Firestore](https://firebase.google.com/products/firestore) (real-time NoSQL) |
| **Authentication** | [Firebase Auth](https://firebase.google.com/products/auth) (email/password) |
| **Styling** | Vanilla CSS with CSS custom properties; dual color themes (Indigo for students, Emerald for faculty) |
| **Linting** | [Oxlint](https://oxc.rs/) |
| **Font** | [DM Sans](https://fonts.google.com/specimen/DM+Sans) via Google Fonts |
| **Hosting** | Firebase Hosting (GitHub Actions CI/CD via `.github/workflows/`) |

---

## Project Structure

```
askmyfaculty/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/
│   │   └── hero.png
│   ├── components/
│   │   ├── StudentInterface.jsx     # Complete student portal UI & logic
│   │   ├── FacultyInterface.jsx     # Complete faculty portal UI & logic
│   │   ├── AskQuestionModal.jsx     # Modal for students to submit a doubt
│   │   ├── AnswerModal.jsx          # Modal for faculty to reply to queries
│   │   ├── FacultyDirectory.jsx     # Browsable list of all faculty members
│   │   ├── AppointmentsView.jsx     # Office hour booking & management
│   │   └── FaqView.jsx              # Searchable FAQ accordion
│   ├── App.jsx                      # Root: auth state, role routing, Firestore listeners
│   ├── App.css                      # Global styles + student/faculty themes
│   ├── Auth.jsx                     # Login & registration with role selection
│   ├── Auth.css                     # Auth page styles
│   ├── firebase.js                  # Firebase app init (Auth + Firestore exports)
│   ├── subjectFaculty.js            # Subject–faculty data roster + helper functions
│   ├── index.css                    # Base CSS reset
│   └── main.jsx                     # React DOM entry point
├── .github/
│   └── workflows/
│       ├── firebase-hosting-merge.yml          # Deploy on merge to main
│       └── firebase-hosting-pull-request.yml   # Preview deploy on PR
├── firebase.json                    # Firebase Hosting config
├── .firebaserc                      # Firebase project alias
├── .oxlintrc.json                   # Oxlint rules config
├── vite.config.js                   # Vite config with React plugin
├── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [npm](https://www.npmjs.com/) v9 or higher
- A [Firebase](https://console.firebase.google.com/) project with **Authentication** and **Firestore** enabled

### 1. Clone the Repository

```bash
git clone https://github.com/ankitor-sudo/askmyfaculty.git
cd askmyfaculty
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Firebase

Open `src/firebase.js` and replace the config object with your own Firebase project credentials:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 4. Start the Development Server

```bash
npm run dev
```

The app will be available at **http://localhost:5173**

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local development server with HMR |
| `npm run build` | Production build output to `/dist` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run Oxlint static analysis |

---

## Firebase Setup

### Enable Authentication

1. Go to **Firebase Console → Authentication → Sign-in method**
2. Enable **Email/Password**

### Enable Firestore

1. Go to **Firebase Console → Firestore Database → Create database**
2. Start in **test mode** for development (configure security rules before production)

### Firestore Security Rules (Recommended for Production)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Students can create queries; faculty can read and update all queries
    match /queries/{queryId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null;
      allow update: if request.auth != null;
    }
  }
}
```

---

## Course & Faculty Roster

The subject–faculty mapping is defined in `src/subjectFaculty.js`:

| Course Code | Subject Name | Faculty Members |
|---|---|---|
| `CSE202` | Object-Oriented Programming (OOPs) | Anshu Kumar Singh, Dr. Robin Kumar |
| `CSE205` | Data Structures & Algorithms (DSA) | Anshu Kumar Singh, Deepak Kumar |
| `CSE306` | Computer Networks | Aman Rao, Mohammad Sohel |
| `INT335` | Design Thinking | Dr. Anuj Sharma, Ravinder Singh |
| `MTH401` | Discrete Mathematics | Dr. Bikram Singh, Dr. Manpreet Kaur |
| `PEL132` | Communication Skills | Divya Divu, Nirmal Kaur |
| `CSE423` | Virtualization and Cloud Computing | Bharat Sharma, Pushpendra Pandey |

To add more subjects or faculty members, edit the `subjectFaculty` array in `src/subjectFaculty.js`.

---

## Firestore Data Schema

### `users` Collection

```json
{
  "uid": "firebase-auth-uid",
  "name": "Ankit Sharma",
  "email": "ankit@university.edu",
  "role": "student",           // "student" | "faculty"
  "facultyName": null,         // Set for faculty accounts (e.g. "Dr. Robin Kumar")
  "department": null,          // Set for faculty accounts
  "createdAt": "<timestamp>"
}
```

### `queries` Collection

```json
{
  "studentId": "firebase-auth-uid",
  "studentName": "Ankit Sharma",
  "studentEmail": "ankit@university.edu",
  "subjectCode": "CSE202",
  "subjectName": "OOPs",
  "facultyName": "Dr. Robin Kumar",
  "question": "Can you explain virtual destructors and when to use them?",
  "status": "Pending",         // "Pending" | "In Progress" | "Answered"
  "answer": null,              // Filled by faculty after responding
  "answeredBy": null,          // Faculty name who responded
  "answeredAt": null,          // Timestamp of faculty response
  "createdAt": "<timestamp>"
}
```

---

## Contributing

Contributions, bug reports, and feature requests are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature-name`
3. Commit your changes: `git commit -m "feat: describe your change"`
4. Push to the branch: `git push origin feat/your-feature-name`
5. Open a Pull Request against `main`

---

## License

This project is licensed under the **MIT License**.

---

<div align="center">
  Built with ❤️ for academic communities · Powered by React + Firebase
</div>
