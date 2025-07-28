# Food Search API Guide

This guide explains how to search for food items using the Spoonacular API in your Smart Meal Planner project.

## Setup

1. **Get API Key**: Get your free Spoonacular API key from [spoonacular.com/food-api](https://spoonacular.com/food-api)
2. **Add to Environment**: Create a `.env` file in your project root and add:
   ```env
   VITE_SPOONACULAR_API_KEY=your_api_key_here
   ```

## Available Search Functions

### 1. Search Recipes by Ingredients
Find recipes that use specific ingredients you have available.

```javascript
import { searchRecipesByIngredients } from './utils/api';

// Search for recipes using chicken, rice, and broccoli
const recipes = await searchRecipesByIngredients('chicken, rice, broccoli');
```

**Use Cases:**
- "What can I cook with what I have?" scenarios
- Meal planning based on available ingredients
- Reducing food waste

### 2. General Recipe Search
Search recipes by name, cuisine, diet, or any text query.

```javascript
import { searchRecipes } from './utils/api';

// Basic search
const results = await searchRecipes('pasta');

// Advanced search with filters
const results = await searchRecipes('chicken', {
  cuisine: 'italian',
  diet: 'vegetarian',
  maxReadyTime: 30,
  number: 20
});
```

**Available Filters:**
- `cuisine`: italian, mexican, asian, etc.
- `diet`: vegetarian, vegan, gluten-free, etc.
- `intolerances`: dairy, gluten, nuts, etc.
- `maxReadyTime`: maximum cooking time in minutes
- `maxCalories`: maximum calories per serving
- `minProtein`: minimum protein in grams

### 3. Search by Nutritional Requirements
Find recipes that meet specific nutritional criteria.

```javascript
import { searchRecipesByNutrients } from './utils/api';

// Find low-calorie, high-protein recipes
const healthyRecipes = await searchRecipesByNutrients({
  maxCalories: 400,
  minProtein: 25,
  maxCarbs: 30,
  number: 10
});

// Find recipes for weight loss
const weightLossRecipes = await searchRecipesByNutrients({
  maxCalories: 350,
  minFiber: 5,
  maxSugar: 10
});
```

**Nutritional Parameters:**
- Macros: `minCalories`, `maxCalories`, `minProtein`, `maxProtein`, `minCarbs`, `maxCarbs`, `minFat`, `maxFat`
- Vitamins: `minVitaminC`, `maxVitaminC`, `minVitaminD`, etc.
- Minerals: `minCalcium`, `maxSodium`, `minIron`, etc.

### 4. Search Ingredients
Find specific ingredients with detailed information.

```javascript
import { searchIngredients } from './utils/api';

const ingredients = await searchIngredients('tomato');
// Returns: name, image, possible units, nutrition info
```

### 5. Autocomplete Functions
Get suggestions as users type.

```javascript
import { autocompleteIngredient, autocompleteRecipe } from './utils/api';

// Ingredient autocomplete
const ingredientSuggestions = await autocompleteIngredient('app');
// Returns: ["apple", "applesauce", "apricot", ...]

// Recipe autocomplete
const recipeSuggestions = await autocompleteRecipe('chick');
// Returns: ["chicken curry", "chicken soup", "chicken parmesan", ...]
```

### 6. Search Grocery Products
Find actual products you can buy in stores.

```javascript
import { searchGroceryProducts } from './utils/api';

const products = await searchGroceryProducts('organic milk');
// Returns: product names, images, prices, store availability
```

### 7. Get Recipe Details
Get complete information about a specific recipe.

```javascript
import { getRecipeInformation } from './utils/api';

const recipe = await getRecipeInformation(recipeId, true); // true = include nutrition
// Returns: ingredients, instructions, nutrition, cooking time, etc.
```

### 8. Random Recipes
Get random recipe suggestions.

```javascript
import { getRandomRecipes } from './utils/api';

// Get random recipes with filters
const randomRecipes = await getRandomRecipes({
  number: 5,
  'include-tags': 'vegetarian,healthy',
  'exclude-tags': 'dairy'
});
```

## Example Usage Scenarios

### Scenario 1: Meal Planning with Dietary Restrictions

```javascript
// Find vegetarian recipes under 500 calories
const healthyVegRecipes = await searchRecipes('dinner', {
  diet: 'vegetarian',
  maxCalories: 500,
  maxReadyTime: 45,
  number: 10
});
```

### Scenario 2: "Clean Out the Fridge" Recipe Search

```javascript
// Find recipes using leftover ingredients
const leftovers = 'chicken breast, bell peppers, onion, cheese';
const recipes = await searchRecipesByIngredients(leftovers);
```

### Scenario 3: Nutrition-Focused Search

```javascript
// High-protein, low-carb recipes for fitness goals
const fitnessRecipes = await searchRecipesByNutrients({
  minProtein: 30,
  maxCarbs: 20,
  maxCalories: 400,
  number: 15
});
```

### Scenario 4: Smart Search with Autocomplete

```javascript
// Implement smart search bar
const handleSearch = async (query) => {
  if (query.length < 3) return;
  
  // Get suggestions
  const suggestions = await autocompleteRecipe(query);
  
  // If user selects a suggestion, search for full recipes
  if (selectedSuggestion) {
    const recipes = await searchRecipes(selectedSuggestion);
  }
};
```

## Error Handling

Always wrap API calls in try-catch blocks:

```javascript
try {
  const recipes = await searchRecipes(query);
  setRecipes(recipes.results);
} catch (error) {
  console.error('Search failed:', error.message);
  setError('Failed to search recipes. Please try again.');
}
```

## Rate Limits

Spoonacular has rate limits based on your plan:
- **Free**: 150 requests/day
- **Basic**: 1,500 requests/day
- **Advanced**: 15,000 requests/day

## Best Practices

1. **Cache Results**: Store recent searches to avoid repeated API calls
2. **Debounce Autocomplete**: Wait for user to stop typing before making requests
3. **Progressive Enhancement**: Show basic results first, load detailed info on demand
4. **Fallback Options**: Provide alternative suggestions when searches return no results
5. **User Feedback**: Show loading states and error messages clearly

## Integration with Your Meal Planner

```javascript
// Example: Integrate with meal planning
const planMeal = async (dietaryGoals, availableIngredients) => {
  let recipes;
  
  if (availableIngredients.length > 0) {
    // First try to use available ingredients
    recipes = await searchRecipesByIngredients(availableIngredients.join(', '));
  } else {
    // Search by nutritional goals
    recipes = await searchRecipesByNutrients(dietaryGoals);
  }
  
  return recipes.filter(recipe => recipe.readyInMinutes <= 45);
};
```

This comprehensive API setup gives you powerful food search capabilities for your Smart Meal Planner application!