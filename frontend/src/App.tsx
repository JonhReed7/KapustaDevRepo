import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CreateSurvey from './pages/CreateSurvey'
import TakeSurvey from './pages/TakeSurvey'
import Results from './pages/Results'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/surveys/new" element={<CreateSurvey />} />
      <Route path="/take" element={<TakeSurvey />} />
      <Route path="/results" element={<Results />} />
    </Routes>
  )
}
