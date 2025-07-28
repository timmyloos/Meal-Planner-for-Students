import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link
} from 'react-router-dom';
import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import {
  searchRecipesByIngredients,
  searchRecipes,
  searchRecipesByNutrients,
  searchIngredients,
  autocompleteIngredient,
  autocompleteRecipe,
  getRecipeInformation,
  searchGroceryProducts,
  getRandomRecipes
} from './utils/api';

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

// New comprehensive food search component
function FoodSearchDemo() {
  const [searchType, setSearchType] = useState('general');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError('');
    setResults([]);

    try {
      let data;
      
      switch (searchType) {
        case 'general':
          data = await searchRecipes(query);
          setResults(data.results || []);
          break;
          
        case 'ingredients':
          data = await searchIngredients(query);
          setResults(data.results || []);
          break;
          
        case 'autocomplete-ingredient':
          data = await autocompleteIngredient(query);
          setResults(data || []);
          break;
          
        case 'autocomplete-recipe':
          data = await autocompleteRecipe(query);
          setResults(data || []);
          break;
          
        case 'products':
          data = await searchGroceryProducts(query);
          setResults(data.products || []);
          break;
          
        case 'by-nutrients':
          // Example: search for low-calorie recipes
          data = await searchRecipesByNutrients({
            maxCalories: 500,
            minProtein: 10,
            number: 10
          });
          setResults(data || []);
          break;
          
        case 'random':
          data = await getRandomRecipes({ number: 5 });
          setResults(data.recipes || []);
          break;
          
        default:
          break;
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderResult = (item, index) => {
    switch (searchType) {
      case 'general':
        return (
          <div key={item.id || index} style={{ border: '1px solid #ddd', padding: '10px', margin: '10px 0' }}>
            <h4>{item.title}</h4>
            {item.image && <img src={item.image} alt={item.title} width="100" />}
            <p>Ready in: {item.readyInMinutes} minutes</p>
          </div>
        );
        
      case 'ingredients':
        return (
          <div key={item.id || index} style={{ border: '1px solid #ddd', padding: '10px', margin: '10px 0' }}>
            <h4>{item.name}</h4>
            {item.image && <img src={`https://img.spoonacular.com/ingredients_100x100/${item.image}`} alt={item.name} width="50" />}
          </div>
        );
        
      case 'autocomplete-ingredient':
      case 'autocomplete-recipe':
        return (
          <div key={item.id || index} style={{ padding: '5px', borderBottom: '1px solid #eee' }}>
            {item.title || item.name}
          </div>
        );
        
      case 'products':
        return (
          <div key={item.id || index} style={{ border: '1px solid #ddd', padding: '10px', margin: '10px 0' }}>
            <h4>{item.title}</h4>
            {item.image && <img src={item.image} alt={item.title} width="50" />}
          </div>
        );
        
      case 'by-nutrients':
      case 'random':
        return (
          <div key={item.id || index} style={{ border: '1px solid #ddd', padding: '10px', margin: '10px 0' }}>
            <h4>{item.title}</h4>
            {item.image && <img src={item.image} alt={item.title} width="100" />}
            <p>Calories: {item.calories}</p>
            <p>Protein: {item.protein}</p>
            <p>Carbs: {item.carbs}</p>
            <p>Fat: {item.fat}</p>
          </div>
        );
        
      default:
        return <div key={index}>{JSON.stringify(item)}</div>;
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Comprehensive Food Search Demo</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label>Search Type: </label>
        <select value={searchType} onChange={(e) => setSearchType(e.target.value)}>
          <option value="general">General Recipe Search</option>
          <option value="ingredients">Search Ingredients</option>
          <option value="autocomplete-ingredient">Autocomplete Ingredients</option>
          <option value="autocomplete-recipe">Autocomplete Recipes</option>
          <option value="products">Search Grocery Products</option>
          <option value="by-nutrients">Search by Nutrients (Low Cal, High Protein)</option>
          <option value="random">Get Random Recipes</option>
        </select>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            searchType === 'by-nutrients' ? 'Click search for low-cal high-protein recipes' :
            searchType === 'random' ? 'Click search for random recipes' :
            'Enter search term...'
          }
          style={{ marginRight: '10px', padding: '5px', width: '300px' }}
          disabled={searchType === 'by-nutrients' || searchType === 'random'}
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}

      <div>
        {results.length > 0 && (
          <div>
            <h3>Results ({results.length}):</h3>
            {results.map(renderResult)}
          </div>
        )}
      </div>
    </div>
  );
}

function DietInputPage() {
  return (
    <div>
      <h2>Diet Input Form</h2>
      <RecipeSearch />
      <FoodSearchDemo />
    </div>
  );
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
        <Route path="/diet-input" element={<DietInputPage />} />
        <Route path="/meal-plan" element={<MealPlanPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/recommendations" element={<RecommendationsPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
