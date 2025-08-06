from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv
from datetime import datetime
from functools import wraps
from pathlib import Path
import google.generativeai as genai

# Load .env from the project root (two directories up from backend)
load_dotenv('../../.env')
app = Flask(__name__)
CORS(app)

API_KEY = os.getenv('SPOONACULAR_API_KEY')
BASE_URL = 'https://api.spoonacular.com'

ingredients_list = []
saved_recipes = []
user_preferences = []

# Error handling for API requests
def handle_errors(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            print(f"Request error: {e}")
            return jsonify({'error': str(e)}), 500
    return wrapper

# log user food preferences
@app.route('/api/log-user-foods', methods=['POST'])
@handle_errors
def log_user_foods():
    data = request.get_json()
    if not data or not data.get('foods'):
        return jsonify({'error': 'No foods provided'}), 400

    foods = data.get('foods', [])
    timestamp = data.get('timestamp', datetime.now().isoformat())
    user_id = data.get('user_id', 'anonymous')

    global user_food_preferences
    food_entry = {
        'id': len(user_food_preferences) + 1,
        'user_id': user_id,
        'foods': foods,
        'timestamp': timestamp,
        'food_count': len(foods)
    }
    user_food_preferences.append(food_entry)

    return jsonify({
        'message': 'Food preferences logged successfully',
        'foods_logged': len(foods),
        'total_entries': len(user_food_preferences)
    }), 201

# get all logged food preferences
@app.route('/api/user-food-preferences', methods=['GET'])
def get_user_food_preferences():
    return jsonify({
        'food_preferences': user_food_preferences,
        'total_entries': len(user_food_preferences)
    })

# Spoonacular API request
def make_api_request(endpoint, params=None):
    if params is None:
        params = {}
    if not API_KEY:
        raise Exception("No API key configured")

    params['apiKey'] = API_KEY
    url = f"{BASE_URL}/{endpoint}"

    try:
        response = requests.get(url, params=params, timeout=15)
        if response.status_code == 200:
            return response.json()
        else:
            response.raise_for_status()
    except Exception as e:
        raise


@app.route('/api/recipe-search', methods=['GET'])
def search_recipes():
    """Search recipes with advanced filters"""
    query = request.args.get('query', '')
    diet = request.args.get('diet', '')
    cuisine = request.args.get('cuisine', '')
    max_ready_time = request.args.get('maxReadyTime', '')

    try:
        params = {
            'query': query,
            'number': 10,
            'addRecipeNutrition': True,
            'apiKey': API_KEY
        }

        if diet:
            params['diet'] = diet
        if cuisine:
            params['cuisine'] = cuisine
        if max_ready_time:
            params['maxReadyTime'] = max_ready_time

        response = requests.get(
            f'{BASE_URL}/recipes/complexSearch',
            params=params
        )
        response.raise_for_status()
        return jsonify(response.json())
    except requests.RequestException as e:
        return jsonify({'error': str(e)}), 500
        
@app.route('/api/generate-meal-plan', methods=['POST'])
def generate_meal_plan():
    print("Received request for meal plan generation")
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    # Extract user preferences
    height = data.get('height', 0)
    weight = data.get('weight', 0)
    goal = data.get('goal', 'maintain')
    restrictions = data.get('restrictions', '')
    foods = data.get('foods', '')

    # Convert to integers for calculations
    try:
        height = int(height) if height else 0
        weight = int(weight) if weight else 0
    except (ValueError, TypeError):
        height = 0
        weight = 0

    # Calculate daily calorie target based on goal
    # Basic BMR calculation (simplified)
    if height and weight:
        # Mifflin-St Jeor Equation (simplified)
        bmr = 10 * weight + 6.25 * height - 5 * 25  # Assuming age 25
        if goal == 'lose':
            daily_calories = bmr * 0.8  # 20% deficit
        elif goal == 'gain':
            daily_calories = bmr * 1.2  # 20% surplus
        else:
            daily_calories = bmr  # maintain
    else:
        daily_calories = 2000  # default

    try:
        # Search for breakfast recipes
        breakfast_response = requests.get(
            f'{BASE_URL}/recipes/complexSearch',
            params={
                'query': 'breakfast',
                'number': 1,
                'addRecipeNutrition': True,
                'maxReadyTime': 30,
                'apiKey': API_KEY
            }
        )
        print(
            f"Breakfast API Response Status: {breakfast_response.status_code}")

        # Search for lunch recipes
        lunch_response = requests.get(
            f'{BASE_URL}/recipes/complexSearch',
            params={
                'query': 'lunch',
                'number': 1,
                'addRecipeNutrition': True,
                'maxReadyTime': 45,
                'apiKey': API_KEY
            }
        )
        print(f"Lunch API Response Status: {lunch_response.status_code}")

        # Search for dinner recipes
        dinner_response = requests.get(
            f'{BASE_URL}/recipes/complexSearch',
            params={
                'query': 'dinner',
                'number': 1,
                'addRecipeNutrition': True,
                'maxReadyTime': 60,
                'apiKey': API_KEY
            }
        )
        print(f"Dinner API Response Status: {dinner_response.status_code}")

        enhanced_meals = []

        # Process breakfast
        if breakfast_response.ok:
            breakfast_data = breakfast_response.json()
            if breakfast_data.get('results'):
                meal = breakfast_data['results'][0]

                # Get detailed recipe information
                recipe_id = meal['id']
                detailed_response = requests.get(
                    f'{BASE_URL}/recipes/{recipe_id}/information',
                    params={'apiKey': API_KEY}
                )

                detailed_recipe = {}
                if detailed_response.ok:
                    detailed_recipe = detailed_response.json()
                    print(
                        f"Detailed breakfast recipe fetched: {detailed_recipe.get('title', 'Unknown')}")

                # Try to get equipment from a different endpoint or extract from instructions
                equipment_data = detailed_recipe.get('equipment', [])
                if not equipment_data and detailed_recipe.get('instructions'):
                    # Extract common equipment from instructions
                    instructions = detailed_recipe.get(
                        'instructions', '').lower()
                    common_equipment = []

                    equipment_keywords = [
                        'oven', 'stove', 'pan', 'pot', 'bowl', 'whisk', 'spoon', 'knife',
                        'cutting board', 'baking sheet', 'muffin tin', 'blender', 'mixer',
                        'food processor', 'grater', 'measuring cup', 'measuring spoon'
                    ]

                    for keyword in equipment_keywords:
                        if keyword in instructions:
                            common_equipment.append({'name': keyword.title()})

                    equipment_data = common_equipment
                    print(
                        f"Extracted equipment from instructions: {len(equipment_data)} items")

                # Extract nutrition information properly
                nutrition = meal.get('nutrition', {})
                nutrients = nutrition.get('nutrients', [])

                # Find specific nutrients
                calories = next(
                    (n for n in nutrients if n['name'] == 'Calories'), None)
                protein = next(
                    (n for n in nutrients if n['name'] == 'Protein'), None)
                carbs = next(
                    (n for n in nutrients if n['name'] == 'Carbohydrates'), None)
                fat = next((n for n in nutrients if n['name'] == 'Fat'), None)

                enhanced_meals.append({
                    'type': 'breakfast',
                    'title': meal['title'],
                    'image': meal['image'],
                    'calories': calories['amount'] if calories else 0,
                    'protein': protein['amount'] if protein else 0,
                    'carbs': carbs['amount'] if carbs else 0,
                    'fat': fat['amount'] if fat else 0,
                    'readyInMinutes': meal.get('readyInMinutes', 0),
                    'servings': meal.get('servings', 1),
                    'instructions': detailed_recipe.get('instructions', ''),
                    'ingredients': detailed_recipe.get('extendedIngredients', []),
                    'equipment': equipment_data,
                    'summary': detailed_recipe.get('summary', ''),
                    'cuisines': meal.get('cuisines', []),
                    'diets': meal.get('diets', []),
                    'sourceUrl': detailed_recipe.get('sourceUrl', ''),
                    'sourceName': detailed_recipe.get('sourceName', ''),
                    'pricePerServing': detailed_recipe.get('pricePerServing', 0),
                    'healthScore': detailed_recipe.get('healthScore', 0),
                    'spoonacularScore': detailed_recipe.get('spoonacularScore', 0)
                })

        # Process lunch
        if lunch_response.ok:
            lunch_data = lunch_response.json()
            if lunch_data.get('results'):
                meal = lunch_data['results'][0]

                # Get detailed recipe information
                recipe_id = meal['id']
                detailed_response = requests.get(
                    f'{BASE_URL}/recipes/{recipe_id}/information',
                    params={'apiKey': API_KEY}
                )

                detailed_recipe = {}
                if detailed_response.ok:
                    detailed_recipe = detailed_response.json()
                    print(
                        f"Detailed lunch recipe fetched: {detailed_recipe.get('title', 'Unknown')}")

                # Try to get equipment from a different endpoint or extract from instructions
                equipment_data = detailed_recipe.get('equipment', [])
                if not equipment_data and detailed_recipe.get('instructions'):
                    # Extract common equipment from instructions
                    instructions = detailed_recipe.get(
                        'instructions', '').lower()
                    common_equipment = []

                    equipment_keywords = [
                        'oven', 'stove', 'pan', 'pot', 'bowl', 'whisk', 'spoon', 'knife',
                        'cutting board', 'baking sheet', 'muffin tin', 'blender', 'mixer',
                        'food processor', 'grater', 'measuring cup', 'measuring spoon'
                    ]

                    for keyword in equipment_keywords:
                        if keyword in instructions:
                            common_equipment.append({'name': keyword.title()})

                    equipment_data = common_equipment
                    print(
                        f"Extracted equipment from instructions: {len(equipment_data)} items")

                # Extract nutrition information properly
                nutrition = meal.get('nutrition', {})
                nutrients = nutrition.get('nutrients', [])

                # Find specific nutrients
                calories = next(
                    (n for n in nutrients if n['name'] == 'Calories'), None)
                protein = next(
                    (n for n in nutrients if n['name'] == 'Protein'), None)
                carbs = next(
                    (n for n in nutrients if n['name'] == 'Carbohydrates'), None)
                fat = next((n for n in nutrients if n['name'] == 'Fat'), None)

                enhanced_meals.append({
                    'type': 'lunch',
                    'title': meal['title'],
                    'image': meal['image'],
                    'calories': calories['amount'] if calories else 0,
                    'protein': protein['amount'] if protein else 0,
                    'carbs': carbs['amount'] if carbs else 0,
                    'fat': fat['amount'] if fat else 0,
                    'readyInMinutes': meal.get('readyInMinutes', 0),
                    'servings': meal.get('servings', 1),
                    'instructions': detailed_recipe.get('instructions', ''),
                    'ingredients': detailed_recipe.get('extendedIngredients', []),
                    'equipment': equipment_data,
                    'summary': detailed_recipe.get('summary', ''),
                    'cuisines': meal.get('cuisines', []),
                    'diets': meal.get('diets', []),
                    'sourceUrl': detailed_recipe.get('sourceUrl', ''),
                    'sourceName': detailed_recipe.get('sourceName', ''),
                    'pricePerServing': detailed_recipe.get('pricePerServing', 0),
                    'healthScore': detailed_recipe.get('healthScore', 0),
                    'spoonacularScore': detailed_recipe.get('spoonacularScore', 0)
                })

        # Process dinner
        if dinner_response.ok:
            dinner_data = dinner_response.json()
            if dinner_data.get('results'):
                meal = dinner_data['results'][0]

                # Get detailed recipe information
                recipe_id = meal['id']
                detailed_response = requests.get(
                    f'{BASE_URL}/recipes/{recipe_id}/information',
                    params={'apiKey': API_KEY}
                )

                detailed_recipe = {}
                if detailed_response.ok:
                    detailed_recipe = detailed_response.json()
                    print(
                        f"Detailed dinner recipe fetched: {detailed_recipe.get('title', 'Unknown')}")

                # Try to get equipment from a different endpoint or extract from instructions
                equipment_data = detailed_recipe.get('equipment', [])
                if not equipment_data and detailed_recipe.get('instructions'):
                    # Extract common equipment from instructions
                    instructions = detailed_recipe.get(
                        'instructions', '').lower()
                    common_equipment = []

                    equipment_keywords = [
                        'oven', 'stove', 'pan', 'pot', 'bowl', 'whisk', 'spoon', 'knife',
                        'cutting board', 'baking sheet', 'muffin tin', 'blender', 'mixer',
                        'food processor', 'grater', 'measuring cup', 'measuring spoon'
                    ]

                    for keyword in equipment_keywords:
                        if keyword in instructions:
                            common_equipment.append({'name': keyword.title()})

                    equipment_data = common_equipment
                    print(
                        f"Extracted equipment from instructions: {len(equipment_data)} items")

                # Extract nutrition information properly
                nutrition = meal.get('nutrition', {})
                nutrients = nutrition.get('nutrients', [])

                # Find specific nutrients
                calories = next(
                    (n for n in nutrients if n['name'] == 'Calories'), None)
                protein = next(
                    (n for n in nutrients if n['name'] == 'Protein'), None)
                carbs = next(
                    (n for n in nutrients if n['name'] == 'Carbohydrates'), None)
                fat = next((n for n in nutrients if n['name'] == 'Fat'), None)

                enhanced_meals.append({
                    'type': 'dinner',
                    'title': meal['title'],
                    'image': meal['image'],
                    'calories': calories['amount'] if calories else 0,
                    'protein': protein['amount'] if protein else 0,
                    'carbs': carbs['amount'] if carbs else 0,
                    'fat': fat['amount'] if fat else 0,
                    'readyInMinutes': meal.get('readyInMinutes', 0),
                    'servings': meal.get('servings', 1),
                    'instructions': detailed_recipe.get('instructions', ''),
                    'ingredients': detailed_recipe.get('extendedIngredients', []),
                    'equipment': equipment_data,
                    'summary': detailed_recipe.get('summary', ''),
                    'cuisines': meal.get('cuisines', []),
                    'diets': meal.get('diets', []),
                    'sourceUrl': detailed_recipe.get('sourceUrl', ''),
                    'sourceName': detailed_recipe.get('sourceName', ''),
                    'pricePerServing': detailed_recipe.get('pricePerServing', 0),
                    'healthScore': detailed_recipe.get('healthScore', 0),
                    'spoonacularScore': detailed_recipe.get('spoonacularScore', 0)
                })

        print(f"Enhanced meals: {enhanced_meals}")

        return jsonify({
            'daily_calories': int(daily_calories),
            'goal': goal,
            'meals': enhanced_meals,
            'user_preferences': {
                'height': height,
                'weight': weight,
                'restrictions': restrictions,
                'foods': foods
            }
        })

    except requests.RequestException as e:
        print(f"Request error: {e}")
        return jsonify({'error': f'Failed to generate meal plan: {str(e)}'}), 500


@app.route('/api/meal-plan-templates', methods=['GET'])
def get_meal_plan_templates():
    """Get available meal plan templates (vegetarian, keto, etc.)"""
    try:
        response = requests.get(
            f'{BASE_URL}/mealplanner/generate',
            params={
                'timeFrame': 'week',
                'targetCalories': 2000,
                'diet': 'vegetarian',
                'apiKey': API_KEY
            }
        )
        response.raise_for_status()
        return jsonify(response.json())
    except requests.RequestException as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/recipes/by-ingredients', methods=['GET'])
def get_recipes_by_ingredients():
    ingredients = request.args.get('ingredients')
    print(f"Received ingredients:", ingredients)
    if not ingredients:
        return jsonify({'error': 'No ingredients provided'}), 400
    
    # track search history 
    global ingredients_list
    existing = next((item for item in ingredients_list if item['ingredients'].lower() == ingredients.lower()), None)
    if existing:
        existing['search_count'] += 1
        existing['timestamp'] = datetime.now().isoformat()
    else:
        search_entry = {
            'id': len(ingredients_list) + 1,
            'ingredients': ingredients,
            'timestamp': datetime.now().isoformat(),
            'search_count': 1
        }
        ingredients_list.append(search_entry)

    params = {
        'ingredients': ingredients,
        'number': 5,
        'ranking': 1,  
        'apiKey': API_KEY
    }
    recipes = make_api_request('recipes/findByIngredients', params)
    return jsonify(recipes)
    
  
@app.route('/api/ingredient-history', methods=['GET'])
def get_ingredient_history():
    sorted_history = sorted(ingredients_list, key=lambda x: x['timestamp'], reverse=True)
    return jsonify(sorted_history)

@app.route('/api/save-recipe', methods=['POST'])
def save_recipe():
    recipe_data = request.get_json()
    if not recipe_data or not recipe_data.get('id'):
        return jsonify({'error': 'Recipe ID is required'}), 400

    global saved_recipes
    if any(recipe['id'] == recipe_data['id'] for recipe in saved_recipes):
        return jsonify({'message': 'Recipe already saved'}), 200

    recipe_data['saved_at'] = datetime.now().isoformat()
    saved_recipes.append(recipe_data)
    return jsonify({'message': 'Recipe saved successfully', 'recipe': recipe_data}), 201

@app.route('/api/saved-recipes', methods=['GET'])
def get_saved_recipes():
    return jsonify(sorted(saved_recipes, key=lambda x: x['saved_at'], reverse=True))

@app.route('/api/delete-recipe/<int:recipe_id>', methods=['DELETE'])
def delete_recipe(recipe_id):
    global saved_recipes
    saved_recipes = [r for r in saved_recipes if r['id'] != recipe_id]
    return jsonify({'message': 'Recipe deleted successfully'}), 200

# check API health
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'api_key_configured': bool(API_KEY),
        'api_key_preview': API_KEY[:8] + '...' if API_KEY else 'Not configured',
        'saved_recipes_count': len(saved_recipes),
        'ingredient_searches_count': len(ingredients_history),
        'food_preferences_count': len(user_food_preferences)
    })

@app.route('/')
def home():
    return "Welcome to the Meal Planner API!"

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
