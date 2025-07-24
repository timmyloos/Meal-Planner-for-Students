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
import { searchRecipesByIngredients } from './utils/api';

function LoginPage() {
  return <div><h2>Login Page</h2></div>;
}

function RecipeSearch() {
  const [ingredients, setIngredients] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await searchRecipesByIngredients(ingredients);
      setRecipes(data);
    } catch (err) {
      setError('Error fetching recipes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{marginTop: 24}}>
      <h3>Test Spoonacular Recipe Search</h3>
      <input
        value={ingredients}
        onChange={e => setIngredients(e.target.value)}
        placeholder="e.g. chicken, rice, broccoli"
        style={{marginRight: 8}}
      />
      <button onClick={handleSearch} disabled={loading}>
        {loading ? 'Searching...' : 'Search Recipes'}
      </button>
      {error && <div style={{color: 'red'}}>{error}</div>}
      <ul>
        {recipes.map(recipe => (
          <li key={recipe.id} style={{margin: '12px 0'}}>
            <img src={recipe.image} alt={recipe.title} width={80} style={{verticalAlign: 'middle', marginRight: 8}} />
            {recipe.title}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DietInputForm() {
  return <div><h2>Diet Input Form</h2><RecipeSearch /></div>;
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
