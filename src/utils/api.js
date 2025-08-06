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
  const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userPreferences)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to generate meal recommendations');
  }

  return response.json();
}


