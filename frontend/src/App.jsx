import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './Components/ProtectedRoute';

// Lazy-loaded user screens
const Login = lazy(() => import('./Screens/User/Login'));
const Register = lazy(() => import('./Screens/User/Register'));
const Home = lazy(() => import('./Screens/User/Home'));
const Search = lazy(() => import('./Screens/User/Search'));
const Requests = lazy(() => import('./Screens/User/Requests'));
const Teams = lazy(() => import('./Screens/User/Teams'));
const Profile = lazy(() => import('./Screens/User/Profile'));
const Contact = lazy(() => import('./Screens/User/Contact'));
const Chat = lazy(() => import('./Screens/User/Chat'));
const SecureCodingTest = lazy(() => import('./Screens/User/SecureCodingTest'));

// Lazy-loaded admin screens
const AdminDashboard = lazy(() => import('./Screens/Admin/AdminDashboard'));
const AdminCandidates = lazy(() => import('./Screens/Admin/AdminCandidates'));
const AdminRequests = lazy(() => import('./Screens/Admin/AdminRequests'));
const AdminTeams = lazy(() => import('./Screens/Admin/AdminTeams'));
const AdminQueries = lazy(() => import('./Screens/Admin/AdminQueries'));
const AdminUserLogs = lazy(() => import('./Screens/Admin/AdminUserLogs'));
const AdminQuestions = lazy(() => import('./Screens/Admin/AdminQuestions'));

function App() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-semibold text-slate-400 tracking-wide uppercase">Loading page...</p>
          </div>
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
        <Route path="/requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
        <Route path="/teams" element={<ProtectedRoute><Teams /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/contact" element={<ProtectedRoute><Contact /></ProtectedRoute>} />
        <Route path="/test/:requestId" element={<ProtectedRoute><SecureCodingTest /></ProtectedRoute>} />

        <Route path="/admin" element={<ProtectedRoute adminOnly={true}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/candidates" element={<ProtectedRoute adminOnly={true}><AdminCandidates /></ProtectedRoute>} />
        <Route path="/admin/logs" element={<ProtectedRoute adminOnly={true}><AdminUserLogs /></ProtectedRoute>} />
        <Route path="/admin/questions" element={<ProtectedRoute adminOnly={true}><AdminQuestions /></ProtectedRoute>} />
        <Route path="/admin/requests" element={<ProtectedRoute adminOnly={true}><AdminRequests /></ProtectedRoute>} />
        <Route path="/admin/teams" element={<ProtectedRoute adminOnly={true}><AdminTeams /></ProtectedRoute>} />
        <Route path="/admin/queries" element={<ProtectedRoute adminOnly={true}><AdminQueries /></ProtectedRoute>} />
      </Routes>
    </Suspense>
  );
}

export default App;
