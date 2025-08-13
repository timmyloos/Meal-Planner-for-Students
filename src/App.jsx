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
import { searchRecipesByIngredients, generateMealPlan, addEventToGoogleCalendar, generateMealRecommendations } from './utils/api';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/check`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h3>Loading...</h3>
        </div>
      </div>
    );
  }

  return user ? children : null;
};

// Chatbot component
const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm your nutrition assistant. Ask me anything about meal planning, nutrition, or healthy eating!",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage
        })
      });

      if (response.ok) {
        const data = await response.json();
        const botMessage = {
          id: Date.now() + 1,
          text: data.response,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble connecting right now. Please try again later!",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chatbot-container">
      {/* Chatbot Toggle Button */}
      <button 
        className="chatbot-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle chatbot"
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chatbot Window */}
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h3>Nutrition Assistant</h3>
            <button 
              className="chatbot-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close chatbot"
            >
              ✕
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`chatbot-message ${message.sender}`}
              >
                <div className="message-content">
                  {message.text}
                </div>
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="chatbot-message bot">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="chatbot-input">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about nutrition, meal planning, or healthy eating..."
              disabled={isLoading}
              rows="2"
            />
            <button 
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="chatbot-send"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('Checking auth status...');
      const response = await fetch(`${BACKEND_URL}/api/auth/check`, {
        credentials: 'include'
      });
      
      console.log('Auth check response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Auth check successful, user data:', data);
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        console.log('Auth check failed, not authenticated');
        setUser(null);
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      setUser(null);
      localStorage.removeItem('user');
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <nav className="nav">
        <div className="nav-container">
          <h1 className="nav-title">SmartMeals</h1>
          <div className="nav-links">
            <span className="nav-loading">Loading...</span>
          </div>
        </div>
      </nav>
    );
  }

  console.log('Navigation render - user:', user, 'loading:', loading);
  
  return (
    <nav className="nav">
      <div className="nav-container">
        <h1 className="nav-title">SmartMeals</h1>
        <div className="nav-links">
          {user ? (
            <>
              <span className="nav-user">Welcome, {user.username}!</span>
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
              <button onClick={handleLogout} className="nav-link nav-logout">
                Logout
              </button>
            </>
          ) : (
            <Link 
              to="/login" 
              className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

function LoginPage({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const data = isLogin ? { username, password } : { username, email, password };

      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(result.message);
        // Store user data in localStorage for easy access
        if (result.user) {
          localStorage.setItem('user', JSON.stringify(result.user));
        }
        // Trigger navigation update and redirect
        if (onLoginSuccess) {
          onLoginSuccess();
        }
        setTimeout(() => {
          navigate('/diet-input');
        }, 1000);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setError('');
    setSuccess('');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        <p>{isLogin ? 'Sign in to access your personalized meal plans' : 'Join SmartMeals to start your healthy journey'}</p>
      </div>
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="form-input"
            placeholder="Enter your username"
            required
          />
        </div>
        
        {!isLogin && (
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="Enter your email"
              required
            />
          </div>
        )}
        
        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
            placeholder="Enter your password"
            required
            minLength={6}
          />
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary btn-full"
          disabled={loading}
        >
          {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Create Account')}
        </button>
      </form>

      <div className="auth-switch">
        <p>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button" 
            className="btn-link"
            onClick={() => {
              setIsLogin(!isLogin);
              clearForm();
            }}
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
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
  const [useMetric, setUseMetric] = useState(true);
  const [usHeight, setUsHeight] = useState({ feet: '', inches: '' });
  const [usWeight, setUsWeight] = useState('');

  // Convert US units to metric for API
  const convertToMetric = () => {
    let height = formData.height;
    let weight = formData.weight;

    if (!useMetric) {
      // Convert feet/inches to cm
      if (usHeight.feet && usHeight.inches) {
        const totalInches = parseInt(usHeight.feet) * 12 + parseInt(usHeight.inches);
        height = Math.round(totalInches * 2.54);
      }
      
      // Convert pounds to kg
      if (usWeight) {
        weight = Math.round(parseFloat(usWeight) * 0.453592);
      }
    }

    return { height: height.toString(), weight: weight.toString() };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Convert to metric if using US units
      const metricData = convertToMetric();
      const dataToSave = {
        ...formData,
        height: metricData.height,
        weight: metricData.weight
      };

      // Save diet input data to user account
      const saveResponse = await fetch(`${BACKEND_URL}/api/user/data/diet_input`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(dataToSave)
      });

      if (!saveResponse.ok) {
        console.error('Failed to save diet input data');
      }

      const mealPlan = await generateMealPlan(dataToSave);
      console.log('Generated meal plan:', mealPlan);
      console.log('First meal details:', mealPlan.meals?.[0]);
      
      // Save meal plan to user account
      const mealPlanResponse = await fetch(`${BACKEND_URL}/api/user/data/meal_plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify([mealPlan])
      });

      if (!mealPlanResponse.ok) {
        console.error('Failed to save meal plan');
      }

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
          <label className="form-label">Units</label>
          <div className="unit-toggle">
            <button
              type="button"
              className={`unit-btn ${useMetric ? 'active' : ''}`}
              onClick={() => setUseMetric(true)}
            >
              Metric (cm/kg)
            </button>
            <button
              type="button"
              className={`unit-btn ${!useMetric ? 'active' : ''}`}
              onClick={() => setUseMetric(false)}
            >
              US (ft/in, lbs)
            </button>
          </div>
        </div>

        {useMetric ? (
          <>
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
          </>
        ) : (
          <>
            <div className="form-group">
              <label className="form-label">Height</label>
              <div className="height-inputs">
                <input
                  type="number"
                  value={usHeight.feet}
                  onChange={(e) => setUsHeight({...usHeight, feet: e.target.value})}
                  className="form-input"
                  placeholder="5"
                  min="0"
                  max="8"
                  required
                />
                <span className="unit-label">ft</span>
                <input
                  type="number"
                  value={usHeight.inches}
                  onChange={(e) => setUsHeight({...usHeight, inches: e.target.value})}
                  className="form-input"
                  placeholder="8"
                  min="0"
                  max="11"
                  required
                />
                <span className="unit-label">in</span>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Weight (lbs)</label>
              <input
                type="number"
                value={usWeight}
                onChange={(e) => setUsWeight(e.target.value)}
                className="form-input"
                placeholder="e.g. 150"
                required
              />
            </div>
          </>
        )}
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

  const [calendarConnected, setCalendarConnected] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [calendarLoading, setCalendarLoading] = useState(false);

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

    // check if Google Calendar is connected
    const token = localStorage.getItem('googleCalendarAccessToken');
    if (token) {
      setAccessToken(token);
      setCalendarConnected(true);
    }
  }, []);

  useEffect(() => {
    const initializeGoogleCalendar = () => {
      if(typeof gapi === 'undefined') {
        gapi.load('client:auth2', () => {
          gapi.client.init({
            clientId: 'YOUR_GOOGLE_CLIENT_ID',
            scope: 'https://www.googleapis.com/auth/calendar'
          });
        });
      } 
    };
    const checkCalendarConnection = setInterval (() => {
      if (typeof gapi !== 'undefined') {
        initializeGoogleCalendar();
        clearInterval(checkCalendarConnection);
      }
    }, 1000);
    return () => clearInterval(checkCalendarConnection);
  }, []); 

  // google calendar connection
  const handleConnectCalendar = async () => {
    setCalendarLoading(true);
    try {
      if (typeof gapi === 'undefined') {
        throw new Error('Google API not loaded');
      }
      const auth = gapi.auth2.getAuthInstance();
      const googleUser = await auth.signIn();
      const token = googleUser.getAuthResponse().access_token;
      alert('Google Calendar connected successfully!');
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      alert('Failed to connect to Google Calendar. Please try again.');
    } finally {
      setCalendarLoading(false);
    }
  };

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

// Local Calendar Component (no Google API dependency)
function LocalCalendar() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    console.log('Initializing calendar with date:', now.toDateString());
    return now;
  });
  const [events, setEvents] = useState([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showAddMealPlan, setShowAddMealPlan] = useState(false);
  const [newEvent, setNewEvent] = useState({ 
    title: '', 
    time: '12:00', 
    type: 'breakfast',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    ingredients: ''
  });
  const [nutritionLoading, setNutritionLoading] = useState(false);
  const [mealPlan, setMealPlan] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  // Load meal plan from localStorage
  useEffect(() => {
    const storedMealPlan = localStorage.getItem('currentMealPlan');
    if (storedMealPlan) {
      setMealPlan(JSON.parse(storedMealPlan));
    }
  }, []);

  // Load user data (calendar events, etc.)
  useEffect(() => {
    const loadUserData = async () => {
      try {
        console.log('Loading calendar events...');
        const response = await fetch(`${BACKEND_URL}/api/user/data/calendar_events`, {
          credentials: 'include'
        });
        
        console.log('Calendar events response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Loaded calendar events:', data);
          if (data.calendar_events) {
            setEvents(data.calendar_events);
            console.log('Set events to:', data.calendar_events);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, []);

  // Get current week dates
  const getWeekDates = () => {
    // Get the current date
    const currentDate = new Date(selectedDate);
    
    // Find the start of the week (Sunday)
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    startOfWeek.setDate(currentDate.getDate() - dayOfWeek);
    
    // Generate the week dates
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDates.push(date);
    }
    
    console.log('Selected date:', selectedDate.toDateString());
    console.log('Day of week:', dayOfWeek);
    console.log('Start of week:', startOfWeek.toDateString());
    console.log('Week dates:', weekDates.map(d => d.toDateString()));
    return weekDates;
  };

  const addEvent = async () => {
    console.log('addEvent called with:', { title: newEvent.title, selectedDay });
    if (!newEvent.title.trim() || !selectedDay) {
      console.log('Validation failed - title or selectedDay missing');
      return;
    }
    
    const event = {
      id: Date.now(),
      title: newEvent.title,
      time: newEvent.time,
      type: newEvent.type,
      date: selectedDay.toISOString().split('T')[0],
      calories: parseFloat(newEvent.calories) || 0,
      protein: parseFloat(newEvent.protein) || 0,
      carbs: parseFloat(newEvent.carbs) || 0,
      fat: parseFloat(newEvent.fat) || 0
    };
    
    const updatedEvents = [...events, event];
    console.log('Adding event:', event);
    console.log('Updated events array:', updatedEvents);
    setEvents(updatedEvents);
    
    // Save events to user account
    try {
      console.log('Saving calendar events to backend...');
      const response = await fetch(`${BACKEND_URL}/api/user/data/calendar_events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updatedEvents)
      });

      console.log('Save response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Save successful:', result);
      } else {
        console.error('Failed to save calendar events');
        const errorData = await response.json().catch(() => ({}));
        console.error('Error details:', errorData);
      }
    } catch (error) {
      console.error('Error saving calendar events:', error);
    }
    
    setNewEvent({ 
      title: '', 
      time: '12:00', 
      type: 'breakfast',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
      ingredients: ''
    });
    setShowAddEvent(false);
    setSelectedDay(null);
  };

  const estimateNutrition = async () => {
    if (!newEvent.title.trim() || !newEvent.ingredients.trim()) {
      alert('Please enter both meal title and ingredients for nutrition estimation.');
      return;
    }

    setNutritionLoading(true);
    try {
      console.log('Sending nutrition estimation request:', {
        title: newEvent.title,
        ingredients: newEvent.ingredients
      });

      const response = await fetch(`${BACKEND_URL}/api/estimate-nutrition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newEvent.title,
          ingredients: newEvent.ingredients
        })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Backend error:', errorData);
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Nutrition estimation response:', data);

      setNewEvent({
        ...newEvent,
        calories: data.calories?.toString() || '',
        protein: data.protein?.toString() || '',
        carbs: data.carbs?.toString() || '',
        fat: data.fat?.toString() || ''
      });

      // Show success message
      alert(`Nutrition estimated successfully! Source: ${data.source || 'Unknown'}`);
    } catch (error) {
      console.error('Nutrition estimation error:', error);
      alert(`Could not estimate nutrition: ${error.message}. Please enter values manually.`);
    } finally {
      setNutritionLoading(false);
    }
  };

  const addMealPlanToDate = () => {
    if (!mealPlan || !mealPlan.meals || !selectedDay) return;
    
    const dateStr = selectedDay.toISOString().split('T')[0];
    const mealPlanEvents = mealPlan.meals.map((meal, index) => ({
      id: Date.now() + index,
      title: meal.title,
      time: getMealTime(meal.type),
      type: meal.type,
      date: dateStr,
      calories: meal.calories || 0,
      protein: meal.protein || 0,
      carbs: meal.carbs || 0,
      fat: meal.fat || 0,
      image: meal.image,
      isFromMealPlan: true
    }));
    
    const updatedEvents = [...events, ...mealPlanEvents];
    setEvents(updatedEvents);
    
    // Save updated events
    fetch(`${BACKEND_URL}/api/user/data/calendar_events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(updatedEvents)
    }).catch(error => {
      console.error('Error saving meal plan events:', error);
    });
    
    setShowAddMealPlan(false);
    setSelectedDay(null);
  };

  const getMealTime = (mealType) => {
    switch (mealType) {
      case 'breakfast': return '08:00';
      case 'lunch': return '12:00';
      case 'dinner': return '18:00';
      default: return '12:00';
    }
  };

  const removeEvent = async (eventId) => {
    const updatedEvents = events.filter(event => event.id !== eventId);
    setEvents(updatedEvents);
    
    // Save updated events to user account
    try {
      const response = await fetch(`${BACKEND_URL}/api/user/data/calendar_events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updatedEvents)
      });

      if (!response.ok) {
        console.error('Failed to save updated calendar events');
      }
    } catch (error) {
      console.error('Error saving updated calendar events:', error);
    }
  };

  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateStr);
  };

  const getDailyNutrition = (date) => {
    const dayEvents = getEventsForDate(date);
    return dayEvents.reduce((total, event) => ({
      calories: total.calories + (event.calories || 0),
      protein: total.protein + (event.protein || 0),
      carbs: total.carbs + (event.carbs || 0),
      fat: total.fat + (event.fat || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const weekDates = getWeekDates();
  
  // Debug current date
  const currentDate = new Date();
  console.log('Current date:', currentDate.toDateString());
  console.log('Current date day of week:', currentDate.getDay()); // 0 = Sunday, 1 = Monday, etc.

  return (
    <div className="local-calendar">
      <div className="calendar-header">
        <button 
          onClick={() => setSelectedDate(new Date(selectedDate.getTime() - 7 * 24 * 60 * 60 * 1000))}
          className="btn btn-secondary"
        >
          ← Previous Week
        </button>
        <h3>Week of {weekDates[0].toLocaleDateString()} - {weekDates[6].toLocaleDateString()}</h3>
        <button 
          onClick={() => setSelectedDate(new Date(selectedDate.getTime() + 7 * 24 * 60 * 60 * 1000))}
          className="btn btn-secondary"
        >
          Next Week →
        </button>
      </div>

      <div className="calendar-grid">
        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
          <div key={day} className="calendar-day-header">
            {day}
          </div>
        ))}
        
        {weekDates.map((date, index) => {
          const dayEvents = getEventsForDate(date);
          const dailyNutrition = getDailyNutrition(date);
          const isSelected = selectedDay && selectedDay.toDateString() === date.toDateString();
          const isToday = date.toDateString() === currentDate.toDateString();
          
          console.log(`Rendering day ${index}:`, date.toDateString(), 'isToday:', isToday, 'isSelected:', isSelected);
          
          return (
            <div 
              key={index} 
              className={`calendar-day ${isSelected ? 'selected-day' : ''} ${isToday ? 'today' : ''}`}
              onClick={() => {
                console.log('Day clicked:', date);
                setSelectedDay(date);
              }}
            >
              <div className="date-header">
                <span className="date-number">{date.getDate()}</span>
                {isToday && <span className="today-indicator">Today</span>}
                {isSelected && <span className="selected-indicator">✓</span>}
              </div>
              
              {/* Daily Nutrition Summary */}
              {dailyNutrition.calories > 0 && (
                <div className="daily-nutrition">
                  <div className="nutrition-item">
                    <span className="nutrition-label">Cal:</span>
                    <span className="nutrition-value">{Math.round(dailyNutrition.calories)}</span>
                  </div>
                  <div className="nutrition-item">
                    <span className="nutrition-label">P:</span>
                    <span className="nutrition-value">{Math.round(dailyNutrition.protein)}g</span>
                  </div>
                  <div className="nutrition-item">
                    <span className="nutrition-label">C:</span>
                    <span className="nutrition-value">{Math.round(dailyNutrition.carbs)}g</span>
                  </div>
                  <div className="nutrition-item">
                    <span className="nutrition-label">F:</span>
                    <span className="nutrition-value">{Math.round(dailyNutrition.fat)}g</span>
                  </div>
                </div>
              )}
              
              <div className="day-events">
                {dayEvents.map(event => (
                  <div key={event.id} className={`calendar-event ${event.isFromMealPlan ? 'meal-plan-event' : ''}`}>
                    {event.image && (
                      <img src={event.image} alt={event.title} className="event-image" />
                    )}
                    <div className="event-details">
                      <span className="event-time">{event.time}</span>
                      <span className="event-title">{event.title}</span>
                      <span className="event-type">{event.type}</span>
                      {event.calories > 0 && (
                        <span className="event-calories">{Math.round(event.calories)} cal</span>
                      )}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeEvent(event.id);
                      }}
                      className="remove-event"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="calendar-actions">
        <div className="selected-date-info">
          {selectedDay ? (
            <span className="selected-date-text">
              Selected: {selectedDay.toLocaleDateString()}
            </span>
          ) : (
            <span className="no-date-selected">
              Click on a date to select it
            </span>
          )}
        </div>
        
        <div className="action-buttons">
          <button 
            onClick={() => {
              console.log('Add Custom Meal button clicked!');
              if (!selectedDay) {
                console.log('No day selected, cannot open modal');
                return;
              }
              setShowAddEvent(true);
            }}
            className="btn btn-primary"
            disabled={!selectedDay}
          >
            Add Custom Meal
          </button>
          {mealPlan && mealPlan.meals && (
            <button 
              onClick={() => setShowAddMealPlan(true)}
              className="btn btn-success"
              disabled={!selectedDay}
              style={{ marginLeft: '1rem' }}
            >
              Add Meal Plan to Selected Date
            </button>
          )}
        </div>
      </div>

      {showAddEvent && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add Custom Meal to Calendar</h3>
            
            <div className="form-group">
              <label htmlFor="meal-title">Meal Title:</label>
              <input
                id="meal-title"
                name="meal-title"
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                placeholder="e.g., Grilled Chicken Salad"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="meal-time">Time:</label>
              <input
                id="meal-time"
                name="meal-time"
                type="time"
                value={newEvent.time}
                onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="meal-type">Meal Type:</label>
              <select
                id="meal-type"
                name="meal-type"
                value={newEvent.type}
                onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="meal-ingredients">Ingredients (for nutrition estimation):</label>
              <textarea
                id="meal-ingredients"
                name="meal-ingredients"
                value={newEvent.ingredients}
                onChange={(e) => setNewEvent({...newEvent, ingredients: e.target.value})}
                placeholder="e.g., chicken breast, rice, broccoli, olive oil"
                rows="3"
                style={{ resize: 'vertical' }}
              />
              <small style={{ color: '#6c757d', fontSize: '0.875rem' }}>
                List main ingredients to help estimate nutrition values
              </small>
            </div>

            <div className="nutrition-section">
              <div className="nutrition-header">
                <h4>Nutrition Information</h4>
                <button 
                  onClick={estimateNutrition}
                  disabled={nutritionLoading || !newEvent.title.trim() || !newEvent.ingredients.trim()}
                  className="btn btn-secondary btn-sm"
                >
                  {nutritionLoading ? 'Estimating...' : 'Auto-Estimate'}
                </button>
              </div>
              
              <div className="nutrition-grid">
                <div className="form-group">
                  <label htmlFor="meal-calories">Calories:</label>
                  <input
                    id="meal-calories"
                    name="meal-calories"
                    type="number"
                    value={newEvent.calories}
                    onChange={(e) => setNewEvent({...newEvent, calories: e.target.value})}
                    placeholder="0"
                    min="0"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="meal-protein">Protein (g):</label>
                  <input
                    id="meal-protein"
                    name="meal-protein"
                    type="number"
                    value={newEvent.protein}
                    onChange={(e) => setNewEvent({...newEvent, protein: e.target.value})}
                    placeholder="0"
                    min="0"
                    step="0.1"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="meal-carbs">Carbs (g):</label>
                  <input
                    id="meal-carbs"
                    name="meal-carbs"
                    type="number"
                    value={newEvent.carbs}
                    onChange={(e) => setNewEvent({...newEvent, carbs: e.target.value})}
                    placeholder="0"
                    min="0"
                    step="0.1"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="meal-fat">Fat (g):</label>
                  <input
                    id="meal-fat"
                    name="meal-fat"
                    type="number"
                    value={newEvent.fat}
                    onChange={(e) => setNewEvent({...newEvent, fat: e.target.value})}
                    placeholder="0"
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={addEvent} className="btn btn-primary">Add Meal</button>
              <button onClick={() => setShowAddEvent(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showAddMealPlan && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add Meal Plan to Calendar</h3>
            <p style={{ marginBottom: '1rem', color: '#6c757d' }}>
              Add your current meal plan to {selectedDay?.toLocaleDateString()}?
            </p>
            
            {mealPlan && mealPlan.meals && (
              <div className="meal-plan-preview">
                <h4>Meals to be added:</h4>
                {mealPlan.meals.map((meal, index) => (
                  <div key={index} className="meal-preview-item">
                    <img src={meal.image} alt={meal.title} className="meal-preview-image" />
                    <div className="meal-preview-details">
                      <div className="meal-preview-title">{meal.title}</div>
                      <div className="meal-preview-info">
                        {meal.type} • {Math.round(meal.calories)} cal • {getMealTime(meal.type)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="modal-actions">
              <button onClick={addMealPlanToDate} className="btn btn-success">Add Meal Plan</button>
              <button onClick={() => setShowAddMealPlan(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main calendar page
function CalendarPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Weekly Calendar</h2>
        <p>View your meal plan in a calendar format</p>
      </div>

      <div className="calendar-info">
        <div className="calendar-status connected">
          ✅ Local Calendar Ready
        </div>
        <p style={{ margin: '1rem 0', color: '#6c757d' }}>
          Add meals to your weekly calendar. You can navigate between weeks and manage your meal schedule.
        </p>
      </div>

      <LocalCalendar />
    </div>
  );
}

// Recommendations page 
function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mealPlan, setMealPlan] = useState(null);
  const [hasGeneratedRecommendations, setHasGeneratedRecommendations] = useState(false);

  useEffect(() => {
    const storedMealPlan = localStorage.getItem('currentMealPlan');
    if (storedMealPlan) {
      setMealPlan(JSON.parse(storedMealPlan));
    }
  }, []);

  const generateRecommendations = async () => {
    setLoading(true);
    setError('');
    try {
      // user prefrences from meal plan data 
      const userPreferences = {
        height: mealPlan?.user_preferences?.height || 'Not specified',
        weight: mealPlan?.user_preferences?.weight || 'Not specified',
        goal: mealPlan?.goal || 'maintain weight',
        restrictions: mealPlan?.user_preferences?.restrictions || 'None',
        foodLog: mealPlan?.user_preferences?.foods || 'No recent food log available',
        recentRecipes: mealPlan?.meals?.map(meal => meal.title) || [],
        currentMeals: mealPlan?.meals?.map(meal => ({
          type: meal.type,
          title: meal.title,
          calories: meal.calories || 0,
          protein: meal.protein || 0,
          carbs: meal.carbs || 0,
          fat: meal.fat || 0
        })) || [],
        dailyCalories: mealPlan?.daily_calories || 2000
      };


      console.log('Meal plan data:', mealPlan);
      console.log('Generating recommendations with preferences:', userPreferences);

      const response = await generateMealRecommendations(userPreferences);

      if (response && response.recommendations) {
        setRecommendations(response.recommendations);
        setHasGeneratedRecommendations(true);
        localStorage.setItem('lastRecommendations', JSON.stringify({
          recommendations: response.recommendations,
          timestamp: new Date().toISOString()
        }));
      } else {
        throw new Error('No recommendations received from AI');
      }
    } catch (err) {
      console.error('Error generating recommendations:', err);

      // error handling
      let errorMessage = 'Failed to generate recommendations';
      if (err.message.includes('API key')) {
        errorMessage = 'AI service not configured properly. Please check API settings.';
      } else if (err.message.includes('network') || err.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (err.message.includes('Invalid JSON')) {
        errorMessage = 'Service configuration error. Please try again or contact support.';
      } else {
        errorMessage = err.message || 'Unknown error occurred';
      }
     
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatRecommendations = (text) => {
    // clean up the text 
    let cleanedText = text.replace(/\*\*\*/g, '').replace(/\*\*/g, '').replace(/\* \*/g, '• ').replace(/\*([^*]+)\*/g, '$1').replace(/^\* /gm, '• ') .replace(/\*\s*/g, '• ').replace(/\n\s*\n\s*\n/g, '\n\n').replace(/^\s+/gm, '').trim();
    const sections = cleanedText.split(/(?=\d\.)/);
    return sections.map((section, index) => {
      if (section.trim() === '') return null;
      const isNumberedSection = /^\d+\./.test(section.trim());
      // if section is numbered, split into title and content
      if (isNumberedSection) {
        const lines = section.split('\n').filter(line => line.trim() !== '');
        const title = lines[0];
        const content = lines.slice(1).join('\n');
       
        return (
          <div key={index} style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            borderRadius: '12px',
            border: '1px solid #dee2e6',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{
              margin: '0 0 1rem 0',
              color: '#495057',
              fontSize: '1.25rem',
              fontWeight: '600',
              borderBottom: '2px solid #6c757d',
              paddingBottom: '0.5rem'
            }}>
              {title}
            </h3>
            <div style={{
              lineHeight: '1.6',
              color: '#333',
              whiteSpace: 'pre-line'
            }}>
              {content}
            </div>
          </div>
        );
      } else {
        return (
          // regular section without number
          <div key={index} style={{
            marginBottom: '1rem',
            lineHeight: '1.6',
            color: '#333',
            whiteSpace: 'pre-line'
          }}>
            {section}
          </div>
        );
      }
    }).filter(Boolean);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>AI Recommendations</h2>
        <p>Get personalized meal suggestions based on your preferences</p>
      </div>
      {!mealPlan ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem 0',
          background: '#fff3cd',
          borderRadius: '8px',
          border: '1px solid #ffeaa7'
        }}>
          <h3 style={{ color: '#856404', marginBottom: '1rem' }}>No Meal Plan Found</h3>
          <p style={{ color: '#856404', marginBottom: '1.5rem' }}>
            Please generate a meal plan first to get personalized recommendations.
          </p>
          <button
            onClick={() => window.location.href = '/diet-input'}
            className="btn btn-primary"
          >
            Create Meal Plan
          </button>
        </div>
      ) : (
        <>
          {/* Current Plan Summary */}
          <div style={{
            background: '#e3f2fd',
            padding: '1.5rem',
            borderRadius: '8px',
            marginBottom: '2rem',
            border: '1px solid #bbdefb'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#1565c0' }}>Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <strong>Daily Target:</strong> {mealPlan.daily_calories} calories
              </div>
              <div>
                <strong>Goal:</strong> {mealPlan.goal}
              </div>
              <div>
                <strong>Height:</strong> {mealPlan.user_preferences?.height || 'Not specified'} cm
              </div>
              <div>
                <strong>Weight:</strong> {mealPlan.user_preferences?.weight || 'Not specified'} kg
              </div>
            </div>
            {mealPlan.user_preferences?.restrictions && (
              <div style={{ marginTop: '1rem' }}>
                <strong>Restrictions:</strong> {mealPlan.user_preferences.restrictions}
              </div>
            )}
          </div>

          {/* Generate Recommendations Button */}
          {!hasGeneratedRecommendations && (
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <button
                onClick={generateRecommendations}
                disabled={loading}
                className="btn btn-success"
                style={{
                  padding: '1rem 2rem',
                  fontSize: '1.1rem',
                  minWidth: '200px'
                }}
              >
                {loading ? (
                  <>
                    <span style={{ marginRight: '0.5rem' }}></span>
                    Generating Recommendations...
                  </>
                ) : (
                  <>
                    <span style={{ marginRight: '0.5rem' }}></span>
                    Get Recommendations
                  </>
                )}
              </button>
            </div>
          )}


          {/* Error Display */}
          {error && (
            <div style={{
              background: '#f8d7da',
              color: '#721c24',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid #f5c6cb',
              marginBottom: '2rem'
            }}>
              <strong>Error:</strong> {error}
              <button
                onClick={generateRecommendations}
                style={{
                  marginLeft: '1rem',
                  padding: '0.5rem 1rem',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
            </div>
          )}

          {/* Recommendations Display */}
          {recommendations && (
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '12px',
              border: '1px solid #dee2e6',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '2rem',
                paddingBottom: '1rem',
                borderBottom: '2px solid #e9ecef'
              }}>
                <span style={{ fontSize: '2rem', marginRight: '1rem' }}></span>
                <div>
                  <h3 style={{ margin: 0, color: '#333' }}>Recommendations</h3>
                  <p style={{ margin: 0, color: '#6c757d' }}>
                    Personalized suggestions based on your current meal plan
                  </p>
                </div>
              </div>
             
              <div style={{ fontSize: '1rem', lineHeight: '1.6' }}>
                {formatRecommendations(recommendations)}
              </div>


              {/* Action Buttons */}
              <div style={{
                marginTop: '2rem',
                paddingTop: '1rem',
                borderTop: '1px solid #e9ecef',
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={generateRecommendations}
                  className="btn btn-primary"
                  disabled={loading}
                >
                  Generate New Recommendations
                </button>
                <button
                  onClick={() => window.location.href = '/diet-input'}
                  className="btn btn-success"
                >
                  Update Meal Plan
                </button>
                <button
                  onClick={() => window.location.href = '/meal-plan'}
                  className="btn btn-primary"
                >
                  View Current Plan
                </button>
              </div>
            </div>
          )}


          {/* No recommendations placeholder */}
          {!recommendations && !loading && !error && hasGeneratedRecommendations && (
            <div style={{
              textAlign: 'center',
              padding: '3rem 0',
              background: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <p style={{ color: '#6c757d', margin: 0 }}>
                No recommendations generated. Please try again.
              </p>
            </div>
          )}
        </>
      )}


      {/* Add CSS for spinning animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}


function App() {
  const [authUpdate, setAuthUpdate] = useState(0);

  const triggerAuthUpdate = () => {
    setAuthUpdate(prev => prev + 1);
  };

  return (
    <Router>
      <div>
        <Navigation key={authUpdate} />
        <div className="main-content">
          <Routes>
            <Route path="/login" element={<LoginPage onLoginSuccess={triggerAuthUpdate} />} />
            <Route path="/diet-input" element={
              <ProtectedRoute>
                <DietInputForm />
              </ProtectedRoute>
            } />
            <Route path="/meal-plan" element={
              <ProtectedRoute>
                <MealPlanPage />
              </ProtectedRoute>
            } />
            <Route path="/calendar" element={
              <ProtectedRoute>
                <CalendarPage />
              </ProtectedRoute>
            } />
            <Route path="/recommendations" element={
              <ProtectedRoute>
                <RecommendationsPage />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
        <Chatbot />
      </div>
    </Router>
  );
} 

export default App;
