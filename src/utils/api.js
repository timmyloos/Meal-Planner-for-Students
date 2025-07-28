const API_KEY = import.meta.env.VITE_SPOONACULAR_API_KEY;
const BASE_URL = 'https://api.spoonacular.com';

// Search recipes by ingredients
export async function searchRecipesByIngredients(ingredients) {
  const response = await fetch(
    `${BASE_URL}/recipes/findByIngredients?ingredients=${encodeURIComponent(ingredients)}&number=5&apiKey=${API_KEY}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch recipes');
  }
  return response.json();
}

// Search recipes with query and filters
export async function searchRecipes(query, options = {}) {
  const params = new URLSearchParams({
    query,
    apiKey: API_KEY,
    number: options.number || 10,
    ...options
  });
  
  const response = await fetch(`${BASE_URL}/recipes/complexSearch?${params}`);
  if (!response.ok) {
    throw new Error('Failed to search recipes');
  }
  return response.json();
}

// Search recipes by nutrients (calories, protein, etc.)
export async function searchRecipesByNutrients(nutrients = {}) {
  const params = new URLSearchParams({
    apiKey: API_KEY,
    number: nutrients.number || 10,
    ...nutrients
  });
  
  const response = await fetch(`${BASE_URL}/recipes/findByNutrients?${params}`);
  if (!response.ok) {
    throw new Error('Failed to search recipes by nutrients');
  }
  return response.json();
}

// Search for ingredients
export async function searchIngredients(query) {
  const response = await fetch(
    `${BASE_URL}/food/ingredients/search?query=${encodeURIComponent(query)}&number=10&apiKey=${API_KEY}`
  );
  if (!response.ok) {
    throw new Error('Failed to search ingredients');
  }
  return response.json();
}

// Autocomplete ingredient names
export async function autocompleteIngredient(query) {
  const response = await fetch(
    `${BASE_URL}/food/ingredients/autocomplete?query=${encodeURIComponent(query)}&number=10&apiKey=${API_KEY}`
  );
  if (!response.ok) {
    throw new Error('Failed to autocomplete ingredient');
  }
  return response.json();
}

// Autocomplete recipe names
export async function autocompleteRecipe(query) {
  const response = await fetch(
    `${BASE_URL}/recipes/autocomplete?query=${encodeURIComponent(query)}&number=10&apiKey=${API_KEY}`
  );
  if (!response.ok) {
    throw new Error('Failed to autocomplete recipe');
  }
  return response.json();
}

// Get detailed recipe information
export async function getRecipeInformation(recipeId, includeNutrition = false) {
  const response = await fetch(
    `${BASE_URL}/recipes/${recipeId}/information?includeNutrition=${includeNutrition}&apiKey=${API_KEY}`
  );
  if (!response.ok) {
    throw new Error('Failed to get recipe information');
  }
  return response.json();
}

// Search grocery products
export async function searchGroceryProducts(query) {
  const response = await fetch(
    `${BASE_URL}/food/products/search?query=${encodeURIComponent(query)}&number=10&apiKey=${API_KEY}`
  );
  if (!response.ok) {
    throw new Error('Failed to search grocery products');
  }
  return response.json();
}

// Get random recipes
export async function getRandomRecipes(options = {}) {
  const params = new URLSearchParams({
    apiKey: API_KEY,
    number: options.number || 1,
    ...options
  });
  
  const response = await fetch(`${BASE_URL}/recipes/random?${params}`);
  if (!response.ok) {
    throw new Error('Failed to get random recipes');
  }
  return response.json();
} 