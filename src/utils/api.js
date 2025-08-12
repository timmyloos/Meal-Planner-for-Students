const API_KEY = import.meta.env.VITE_SPOONACULAR_API_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GOOGLE_CALENDAR_API_KEY = import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY;
const GOOGLE_CALENDAR_CLIENT_ID = '85533172291-16pfu8d6lhntu38t21v1vm38lk5q76jc.apps.googleusercontent.com';
const CALENDAR_SCOPES = 'https://www.googleapis.com/auth/calendar'
const BASE_URL = 'https://api.spoonacular.com';
const BACKEND_URL = 'http://localhost:5001';

// call Flask backend to search recipes by ingredients
export async function searchRecipesByIngredients(ingredients) {
  const response = await fetch(
    `${BACKEND_URL}/api/recipes/by-ingredients?ingredients=${encodeURIComponent(ingredients)}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch recipes');
  }
  return response.json();
}

// Keep the direct Spoonacular call as a fallback
export async function searchRecipesByIngredientsDirect(ingredients) {
  const response = await fetch(
    `${BASE_URL}/recipes/findByIngredients?ingredients=${encodeURIComponent(ingredients)}&number=5&apiKey=${API_KEY}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch recipes');
  }
  return response.json();
}

// New function to generate meal plan
export async function generateMealPlan(dietData) {
  const response = await fetch(`${BACKEND_URL}/api/generate-meal-plan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dietData)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to generate meal plan');
  }
  
  return response.json();
} 

// integrate Google Calendar 
export async function addEventToGoogleCalendar(accessToken, event) {
  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error.message || 'Failed to add event to Google Calendar');
  }

  return response.json();
}

// generate meal recommendations with Gemini
export async function generateMealRecommendations(userPreferences) {
  try {
    console.log('Sending request to backend for recommendations...');
    console.log('User preferences:', userPreferences);

    // call backend API
    const response = await fetch(`${BACKEND_URL}/api/generate-recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userPreferences: userPreferences
      })
    });

    console.log('Backend response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Backend error:', errorData);
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Backend response data:', data);
    
    if (!data.recommendations) {
      throw new Error('No recommendations received from backend');
    }

    console.log('Successfully received recommendations from backend');
    return {
      recommendations: data.recommendations,
      success: true
    };
  } catch (error) {
    console.error('Error calling backend for recommendations:', error);
    
    // error handling
    if (error.message.includes('fetch')) {
      throw new Error('Unable to connect to backend service. Please make sure the backend is running on port 5001.');
    } else if (error.message.includes('API key')) {
      throw new Error('AI service not configured on backend. Please check backend configuration.');
    } else {
      throw new Error('Failed to generate recommendations: ' + error.message);
    }
  }
}

// Estimate nutrition for custom meals
export async function estimateNutrition(mealData) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/estimate-nutrition`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mealData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error estimating nutrition:', error);
    throw new Error('Failed to estimate nutrition: ' + error.message);
  }
}


