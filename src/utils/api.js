const API_KEY = import.meta.env.VITE_SPOONACULAR_API_KEY;
const BASE_URL = 'https://api.spoonacular.com';
const BACKEND_URL = 'http://localhost:5001';

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