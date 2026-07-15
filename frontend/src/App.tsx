import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import MyPolls from './pages/MyPolls'
import CreateSurvey from './pages/CreateSurvey'
import TakeSurvey from './pages/TakeSurvey'
import Results from './pages/Results'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-polls"
        element={
          <ProtectedRoute>
            <MyPolls />
          </ProtectedRoute>
        }
      />
      <Route
        path="/surveys/new"
        element={
          <ProtectedRoute>
            <CreateSurvey />
          </ProtectedRoute>
        }
      />
      <Route path="/take" element={<TakeSurvey />} />
      <Route
        path="/results"
        element={
          <ProtectedRoute>
            <Results />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
