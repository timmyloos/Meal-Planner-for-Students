import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
  useNavigate
} from 'react-router-dom';
import React, { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { searchRecipesByIngredients, generateMealPlan } from './utils/api';

function Navigation() {
  const location = useLocation();
  
  return (
    <nav className="nav">
      <div className="nav-container">
        <h1 className="nav-title">Smart Meal Planner</h1>
        <div className="nav-links">
          <Link 
            to="/login" 
            className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}
          >
            Login
          </Link>
          <Link 
            to="/diet-input" 
            className={`nav-link ${location.pathname === '/diet-input' ? 'active' : ''}`}
          >
            Diet Input
          </Link>
          <Link 
            to="/meal-plan" 
            className={`nav-link ${location.pathname === '/meal-plan' ? 'active' : ''}`}
          >
            Meal Plan
          </Link>
          <Link 
            to="/calendar" 
            className={`nav-link ${location.pathname === '/calendar' ? 'active' : ''}`}
          >
            Calendar
          </Link>
          <Link 
            to="/recommendations" 
            className={`nav-link ${location.pathname === '/recommendations' ? 'active' : ''}`}
          >
            Recommendations
          </Link>
        </div>
      </div>
    </nav>
  );
}

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    // For now, just redirect to diet input
    window.location.href = '/diet-input';
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Welcome Back</h2>
        <p>Sign in to access your personalized meal plans</p>
      </div>
      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label className="form-label">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="form-input"
            placeholder="Enter your username"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
            placeholder="Enter your password"
          />
        </div>
        <button type="submit" className="btn btn-primary btn-full">
          Sign In
        </button>
      </form>
    </div>
  );
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
    <div className="recipe-search">
      <h3>Test Recipe Search</h3>
      <div>
        <input
          value={ingredients}
          onChange={e => setIngredients(e.target.value)}
          placeholder="e.g. chicken, rice, broccoli"
          className="search-input"
        />
        <button onClick={handleSearch} disabled={loading} className="search-button">
          {loading ? 'Searching...' : 'Search Recipes'}
        </button>
      </div>
      {error && <div className="error-message">{error}</div>}
      <ul className="recipe-list">
        {recipes.map(recipe => (
          <li key={recipe.id} className="recipe-item">
            <img src={recipe.image} alt={recipe.title} className="recipe-image" />
            <span className="recipe-title">{recipe.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DietInputForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    height: '',
    weight: '',
    goal: 'maintain',
    restrictions: '',
    foods: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const mealPlan = await generateMealPlan(formData);
      console.log('Generated meal plan:', mealPlan);
      console.log('First meal details:', mealPlan.meals?.[0]);
      localStorage.setItem('currentMealPlan', JSON.stringify(mealPlan));
      navigate('/meal-plan');
    } catch (err) {
      setError(err.message || 'Failed to generate meal plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Diet Information</h2>
        <p>Tell us about your goals and preferences to create personalized meal plans</p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Height (cm)</label>
          <input
            type="number"
            value={formData.height}
            onChange={(e) => setFormData({...formData, height: e.target.value})}
            className="form-input"
            placeholder="e.g. 175"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Weight (kg)</label>
          <input
            type="number"
            value={formData.weight}
            onChange={(e) => setFormData({...formData, weight: e.target.value})}
            className="form-input"
            placeholder="e.g. 70"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Goal</label>
          <select
            value={formData.goal}
            onChange={(e) => setFormData({...formData, goal: e.target.value})}
            className="form-select"
          >
            <option value="lose">Lose Weight</option>
            <option value="maintain">Maintain Weight</option>
            <option value="gain">Gain Weight</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Dietary Restrictions</label>
          <input
            type="text"
            value={formData.restrictions}
            onChange={(e) => setFormData({...formData, restrictions: e.target.value})}
            placeholder="e.g. vegetarian, gluten-free, dairy-free"
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Foods You Like</label>
          <textarea
            value={formData.foods}
            onChange={(e) => setFormData({...formData, foods: e.target.value})}
            placeholder="e.g. chicken, rice, broccoli, salmon, quinoa, sweet potatoes"
            className="form-textarea"
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        <button type="submit" className="btn btn-success btn-full" disabled={loading}>
          {loading ? 'Generating Meal Plan...' : 'Generate Meal Plan'}
        </button>
      </form>
      
      <RecipeSearch />
    </div>
  );
}

function MealPlanPage() {
  const [mealPlan, setMealPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedMealPlan = localStorage.getItem('currentMealPlan');
    if (storedMealPlan) {
      const parsedMealPlan = JSON.parse(storedMealPlan);
      console.log('Stored meal plan:', parsedMealPlan);
      console.log('First meal data:', parsedMealPlan.meals?.[0]);
      setMealPlan(parsedMealPlan);
    }
    setLoading(false);
  }, []);

  const handleMealClick = (meal) => {
    console.log('Selected meal data:', meal);
    console.log('Ingredients:', meal.ingredients?.length);
    console.log('Instructions length:', meal.instructions?.length);
    console.log('Equipment:', meal.equipment?.length);
    console.log('Health score:', meal.healthScore);
    console.log('Spoonacular score:', meal.spoonacularScore);
    console.log('Source URL:', meal.sourceUrl);
    console.log('Source Name:', meal.sourceName);
    console.log('Price per serving:', meal.pricePerServing);
    
    // Check if ingredients exist and have the right structure
    if (meal.ingredients && meal.ingredients.length > 0) {
      console.log('First ingredient:', meal.ingredients[0]);
    }
    
    // Check if instructions exist
    if (meal.instructions) {
      console.log('Instructions preview:', meal.instructions.substring(0, 100) + '...');
    }
    
    setSelectedMeal(meal);
    setShowModal(true);
    
    // Immediately blur all elements to prevent highlighting
    setTimeout(() => {
      if (document.activeElement) {
        document.activeElement.blur();
      }
      // Also blur any focused elements
      const focusedElements = document.querySelectorAll(':focus');
      focusedElements.forEach(el => el.blur());
    }, 0);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedMeal(null);
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="content-placeholder">
          <p>Loading your meal plan...</p>
        </div>
      </div>
    );
  }

  if (!mealPlan) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h2>Your Meal Plan</h2>
          <p>Your personalized meal plan will be generated based on your diet information</p>
        </div>
        <div className="content-placeholder">
          <p>Complete your diet information to generate your first meal plan!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Your Personalized Meal Plan</h2>
        <p>Daily Target: {mealPlan.daily_calories} calories | Goal: {mealPlan.goal}</p>
      </div>
      
      <div style={{ marginBottom: '2rem' }}>
        <h3>Today's Meals</h3>
        {mealPlan.meals.map((meal, index) => (
          <div 
            key={index} 
            style={{
              background: hoveredCard === index ? '#f1f3f4' : '#f8f9fa',
              padding: '1.5rem',
              marginBottom: '1rem',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease'
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleMealClick(meal);
            }}
            onMouseEnter={() => setHoveredCard(index)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <img 
                src={meal.image} 
                alt={meal.title}
                style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', marginRight: '1rem' }}
              />
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>
                  {meal.type.charAt(0).toUpperCase() + meal.type.slice(1)}: {meal.title}
                </h4>
                <p style={{ margin: 0, color: '#6c757d' }}>
                  Ready in {meal.readyInMinutes} minutes | {meal.servings} servings
                </p>
                {meal.cuisines && meal.cuisines.length > 0 && (
                  <p style={{ margin: '0.25rem 0 0 0', color: '#6c757d', fontSize: '0.875rem' }}>
                    Cuisine: {meal.cuisines.join(', ')}
                  </p>
                )}
              </div>
            </div>
            
            {/* Nutrition Information */}
            <div style={{ marginTop: '1rem' }}>
              <h5 style={{ margin: '0 0 0.5rem 0', color: '#495057' }}>Nutrition (per serving):</h5>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ 
                  background: '#e3f2fd', 
                  padding: '0.5rem 0.75rem', 
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  Calories: {Math.round(meal.calories)} kcal
                </span>
                <span style={{ 
                  background: '#e8f5e8', 
                  padding: '0.5rem 0.75rem', 
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  Protein: {Math.round(meal.protein)}g
                </span>
                <span style={{ 
                  background: '#fff3e0', 
                  padding: '0.5rem 0.75rem', 
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  Carbs: {Math.round(meal.carbs)}g
                </span>
                <span style={{ 
                  background: '#fce4ec', 
                  padding: '0.5rem 0.75rem', 
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  Fat: {Math.round(meal.fat)}g
                </span>
              </div>
            </div>

            {/* Ingredients */}
            {meal.ingredients && meal.ingredients.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <h5 style={{ margin: '0 0 0.5rem 0', color: '#495057' }}>Key Ingredients:</h5>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {meal.ingredients.slice(0, 5).map((ingredient, idx) => (
                    <span key={idx} style={{ 
                      background: '#f1f3f4', 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px',
                      fontSize: '0.75rem'
                    }}>
                      {ingredient.name}
                    </span>
                  ))}
                  {meal.ingredients.length > 5 && (
                    <span style={{ 
                      background: '#f1f3f4', 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px',
                      fontSize: '0.75rem'
                    }}>
                      +{meal.ingredients.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button 
          onClick={() => navigate('/diet-input')}
          className="btn btn-primary"
        >
          Generate New Plan
        </button>
        <button 
          onClick={() => navigate('/calendar')}
          className="btn btn-primary"
        >
          View Calendar
        </button>
        <button 
          onClick={() => navigate('/recommendations')}
          className="btn btn-primary"
        >
          Get Recommendations
        </button>
      </div>

      {/* Recipe Modal */}
      {showModal && selectedMeal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            maxWidth: '90vw',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            {/* Close Button */}
            <button
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#6c757d',
                zIndex: 1,
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              ×
            </button>

            <div style={{ padding: '2rem' }}>
              {/* Recipe Header */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                marginBottom: '2rem',
                gap: '1.5rem'
              }}>
                <img 
                  src={selectedMeal.image} 
                  alt={selectedMeal.title}
                  style={{ 
                    width: '120px', 
                    height: '120px', 
                    objectFit: 'cover', 
                    borderRadius: '12px',
                    flexShrink: 0
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ 
                    margin: '0 0 0.5rem 0', 
                    color: '#333',
                    fontSize: '1.5rem',
                    lineHeight: '1.3',
                    wordWrap: 'break-word'
                  }}>
                    {selectedMeal.title}
                  </h2>
                  <p style={{ margin: '0 0 0.5rem 0', color: '#6c757d' }}>
                    Ready in {selectedMeal.readyInMinutes} minutes | {selectedMeal.servings} servings
                  </p>
                  {selectedMeal.cuisines && selectedMeal.cuisines.length > 0 && (
                    <p style={{ margin: 0, color: '#6c757d', fontSize: '0.875rem' }}>
                      Cuisine: {selectedMeal.cuisines.join(', ')}
                    </p>
                  )}
                </div>
              </div>

              {/* Nutrition Summary */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#495057' }}>Nutrition (per serving)</h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '0.75rem'
                }}>
                  <span style={{ 
                    background: '#e3f2fd', 
                    padding: '0.75rem 1rem', 
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    textAlign: 'center'
                  }}>
                    Calories: {Math.round(selectedMeal.calories)} kcal
                  </span>
                  <span style={{ 
                    background: '#e8f5e8', 
                    padding: '0.75rem 1rem', 
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    textAlign: 'center'
                  }}>
                    Protein: {Math.round(selectedMeal.protein)}g
                  </span>
                  <span style={{ 
                    background: '#fff3e0', 
                    padding: '0.75rem 1rem', 
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    textAlign: 'center'
                  }}>
                    Carbs: {Math.round(selectedMeal.carbs)}g
                  </span>
                  <span style={{ 
                    background: '#fce4ec', 
                    padding: '0.75rem 1rem', 
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    textAlign: 'center'
                  }}>
                    Fat: {Math.round(selectedMeal.fat)}g
                  </span>
                </div>
              </div>

              {/* Ingredients */}
              {selectedMeal.ingredients && selectedMeal.ingredients.length > 0 ? (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ margin: '0 0 1rem 0', color: '#495057' }}>
                    Ingredients ({selectedMeal.ingredients.length} items)
                  </h3>
                  <div style={{ 
                    background: '#f8f9fa', 
                    padding: '1.5rem', 
                    borderRadius: '8px',
                    border: '1px solid #e9ecef'
                  }}>
                    {selectedMeal.ingredients.map((ingredient, idx) => (
                      <div key={idx} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        padding: '0.5rem 0',
                        borderBottom: idx < selectedMeal.ingredients.length - 1 ? '1px solid #e9ecef' : 'none'
                      }}>
                        <span style={{ fontWeight: '500' }}>{ingredient.name}</span>
                        <span style={{ color: '#6c757d' }}>
                          {ingredient.amount} {ingredient.unit || ingredient.measures?.us?.unitShort || ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: '2rem', padding: '1rem', background: '#fff3cd', borderRadius: '8px', border: '1px solid #ffeaa7' }}>
                  <p style={{ margin: 0, color: '#856404' }}>⚠️ No ingredients data available</p>
                </div>
              )}

              {/* Equipment */}
              {selectedMeal.equipment && selectedMeal.equipment.length > 0 ? (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ margin: '0 0 1rem 0', color: '#495057' }}>
                    Equipment Needed ({selectedMeal.equipment.length} items)
                  </h3>
                  <div style={{ 
                    background: '#f8f9fa', 
                    padding: '1.5rem', 
                    borderRadius: '8px',
                    border: '1px solid #e9ecef'
                  }}>
                    {selectedMeal.equipment.map((item, idx) => (
                      <div key={idx} style={{ 
                        padding: '0.5rem 0',
                        borderBottom: idx < selectedMeal.equipment.length - 1 ? '1px solid #e9ecef' : 'none'
                      }}>
                        <span style={{ fontWeight: '500' }}>{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: '2rem', padding: '1rem', background: '#d1ecf1', borderRadius: '8px', border: '1px solid #bee5eb' }}>
                  <p style={{ margin: 0, color: '#0c5460' }}>ℹ️ No specific equipment required</p>
                </div>
              )}

              {/* Instructions */}
              {selectedMeal.instructions ? (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ margin: '0 0 1rem 0', color: '#495057' }}>
                    Instructions ({selectedMeal.instructions.length} characters)
                  </h3>
                  <div style={{ 
                    background: '#f8f9fa', 
                    padding: '1.5rem', 
                    borderRadius: '8px',
                    border: '1px solid #e9ecef',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-line'
                  }}>
                    {selectedMeal.instructions}
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: '2rem', padding: '1rem', background: '#fff3cd', borderRadius: '8px', border: '1px solid #ffeaa7' }}>
                  <p style={{ margin: 0, color: '#856404' }}>⚠️ No instructions available</p>
                </div>
              )}

              {/* Recipe Stats */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#495057' }}>Recipe Information</h3>
                <div style={{ 
                  display: 'flex', 
                  gap: '0.75rem',
                  flexWrap: 'wrap'
                }}>
                  {selectedMeal.healthScore > 0 ? (
                    <div style={{ 
                      background: '#e8f5e8', 
                      padding: '1rem', 
                      borderRadius: '8px',
                      textAlign: 'center',
                      flex: '1',
                      minWidth: '120px'
                    }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#28a745' }}>
                        {Math.round(selectedMeal.healthScore)}%
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>Health Score</div>
                    </div>
                  ) : (
                    <div style={{ 
                      background: '#f8f9fa', 
                      padding: '1rem', 
                      borderRadius: '8px',
                      textAlign: 'center',
                      border: '1px solid #e9ecef',
                      flex: '1',
                      minWidth: '120px'
                    }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#6c757d' }}>
                        N/A
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>Health Score</div>
                    </div>
                  )}
                  
                  {selectedMeal.spoonacularScore > 0 ? (
                    <div style={{ 
                      background: '#fff3e0', 
                      padding: '1rem', 
                      borderRadius: '8px',
                      textAlign: 'center',
                      flex: '1',
                      minWidth: '120px'
                    }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fd7e14' }}>
                        {selectedMeal.spoonacularScore.toFixed(1)}%
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>Spoonacular Score</div>
                    </div>
                  ) : (
                    <div style={{ 
                      background: '#f8f9fa', 
                      padding: '1rem', 
                      borderRadius: '8px',
                      textAlign: 'center',
                      border: '1px solid #e9ecef',
                      flex: '1',
                      minWidth: '120px'
                    }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#6c757d' }}>
                        N/A
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>Spoonacular Score</div>
                    </div>
                  )}
                  
                  {selectedMeal.pricePerServing > 0 ? (
                    <div style={{ 
                      background: '#e3f2fd', 
                      padding: '1rem', 
                      borderRadius: '8px',
                      textAlign: 'center',
                      flex: '1',
                      minWidth: '120px'
                    }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#007bff' }}>
                        ${(selectedMeal.pricePerServing / 100).toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>Per Serving</div>
                    </div>
                  ) : (
                    <div style={{ 
                      background: '#f8f9fa', 
                      padding: '1rem', 
                      borderRadius: '8px',
                      textAlign: 'center',
                      border: '1px solid #e9ecef',
                      flex: '1',
                      minWidth: '120px'
                    }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#6c757d' }}>
                        N/A
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>Price Per Serving</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Source Information */}
              {selectedMeal.sourceUrl ? (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ margin: '0 0 1rem 0', color: '#495057' }}>Source</h3>
                  <div style={{ 
                    background: '#f8f9fa', 
                    padding: '1.5rem', 
                    borderRadius: '8px',
                    border: '1px solid #e9ecef',
                    width: '100%'
                  }}>
                    <p style={{ margin: '0 0 0.5rem 0' }}>
                      <strong>Source:</strong> {selectedMeal.sourceName || 'Unknown'}
                    </p>
                    <a 
                      href={selectedMeal.sourceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ 
                        color: '#007bff', 
                        textDecoration: 'none',
                        fontWeight: '500'
                      }}
                    >
                      View Original Recipe →
                    </a>
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: '2rem', padding: '1rem', background: '#d1ecf1', borderRadius: '8px', border: '1px solid #bee5eb', width: '100%' }}>
                  <p style={{ margin: 0, color: '#0c5460' }}>ℹ️ No source information available</p>
                </div>
              )}

              {/* Summary */}
              {selectedMeal.summary ? (
                <div>
                  <h3 style={{ margin: '0 0 1rem 0', color: '#495057' }}>About this recipe</h3>
                  <div style={{ 
                    background: '#f8f9fa', 
                    padding: '1.5rem', 
                    borderRadius: '8px',
                    border: '1px solid #e9ecef',
                    lineHeight: '1.6'
                  }}
                  dangerouslySetInnerHTML={{ __html: selectedMeal.summary }}
                  />
                </div>
              ) : (
                <div style={{ padding: '1rem', background: '#fff3cd', borderRadius: '8px', border: '1px solid #ffeaa7' }}>
                  <p style={{ margin: 0, color: '#856404' }}>⚠️ No recipe summary available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Weekly Calendar</h2>
        <p>View your meal plan in a calendar format</p>
      </div>
      <div className="content-placeholder">
        <p>Calendar view will be available once you have a meal plan!</p>
      </div>
    </div>
  );
}

function RecommendationsPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h2>AI Recommendations</h2>
        <p>Get personalized meal suggestions based on your preferences and history</p>
      </div>
      <div className="content-placeholder">
        <p>AI-powered recommendations will be available soon!</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div>
        <Navigation />
        <div className="main-content">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/diet-input" element={<DietInputForm />} />
            <Route path="/meal-plan" element={<MealPlanPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/recommendations" element={<RecommendationsPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
