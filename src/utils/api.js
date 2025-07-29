const API_KEY = import.meta.env.VITE_SPOONACULAR_API_KEY;
const BASE_URL = 'https://api.spoonacular.com';
const BACKEND_URL = 'http://127.0.0.1:5000';

export async function searchRecipesByIngredients(ingredients) {
  const response = await fetch(
    //`${BASE_URL}/recipes/findByIngredients?ingredients=${encodeURIComponent(ingredients)}&number=5&apiKey=${API_KEY}`
    `${BACKEND_URL}/api/recipes/by-ingredients?ingredients=${encodeURIComponent(ingredients)}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch recipes');
  }
  return response.json();
} 