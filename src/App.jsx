import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';
import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function LoginPage() {
  return <div><h2>Login Page</h2></div>;
}

function DietInputForm() {
  return <div><h2>Diet Input Form</h2></div>;
}

function MealPlanPage() {
  return <div><h2>Meal Plan Page</h2></div>;
}

function CalendarPage() {
  return <div><h2>Calendar Page</h2></div>;
}

function RecommendationsPage() {
  return <div><h2>Recommendations Page</h2></div>;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/diet-input" element={<DietInputForm />} />
        <Route path="/meal-plan" element={<MealPlanPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/recommendations" element={<RecommendationsPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
