from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv
from datetime import datetime

# Load .env from the project root (two directories up from backend)
load_dotenv('../../.env')
app = Flask(__name__)
CORS(app)

API_KEY = os.getenv('VITE_SPOONACULAR_API_KEY')
BASE_URL = 'https://api.spoonacular.com'

ingredients_list = []
saved_recipes = []
meal_plan = []

@app.route('/')
def home():
    return "Welcome to the Meal Planner API!"


@app.route('/api/recipes/by-ingredients', methods=['GET'])
def get_recipes_by_ingredients():
    print("Received request for ingredients search")
    ingredients = request.args.get('ingredients')
    if not ingredients:
        return jsonify({'error': 'No ingredients provided'}), 400
    
    search_ingredients = {
        'id': len(ingredients_list) + 1,
        'ingredients': ingredients,
        'timestamp': datetime.now().isoformat(),
        'search_count': 1
    }

    existing_search = next((item for item in ingredients_list if item['ingredients'].lower() == ingredients), None)
    if existing_search:
        existing_search['search_count'] += 1
        existing_search['timestamp'] = datetime.now().isoformat()
    else:
        ingredients_list.append(search_ingredients)

    try:
        response = requests.get(
            f'{BASE_URL}/recipes/findByIngredients',
            params={
                'ingredients': ingredients,
                'number': 5,
                'apiKey': API_KEY
            }
        )
        response.raise_for_status()
        recipes = response.json()
        return jsonify(recipes)
    except requests.RequestException as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/ingredient-history', methods=['GET'])
def get_ingredient_history():
    sorted_history = sorted(ingredients_list, key=lambda x: x['timestamp'], reverse=True)
    return jsonify(sorted_history)

@app.route('/api/save-recipe', methods=['POST'])
def save_recipe():
    recipe_data = request.get_json()
    if not recipe_data:
        return jsonify({'error': 'No recipe data provided'}), 400
    
    existing_recipe = next((item for item in saved_recipes if item['id'] == recipe_data['id']), None)
    if existing_recipe:
        return jsonify({'error': 'Recipe already saved'}), 200
    
    recipe_data['saved_at'] = datetime.now().isoformat()
    saved_recipes.append(recipe_data)
    return jsonify({'message': 'Recipe saved successfully', 'recipe': existing_recipe}), 201

@app.route('/api/saved-recipes', methods=['GET'])
def get_saved_recipes():
    sorted_recipes = sorted(saved_recipes, key=lambda x: x['saved_at'], reverse=True)
    return jsonify(sorted_recipes)

@app.route('/api/delete-recipe/<int:recipe_id>', methods=['DELETE'])
def delete_recipe(recipe_id):
    global saved_recipes
    originial_count = len(saved_recipes)
    saved_recipes = [recipe for recipe in saved_recipes if recipe['id'] != recipe_id]

    if len(saved_recipes) == originial_count:
        return jsonify({'error': 'Recipe not found'}), 404
    
    return jsonify({'message': 'Recipe deleted successfully'}), 200

# meal plan endpoint
@app.route('/api/meal-plan', methods=['GET'])
def get_meal_plan():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    filtered_plan = meal_plan
    if start_date:
        filtered_plan = [meal for meal in meal_plan if meal['date'] >= start_date]
    if end_date:
        filtered_plan = [meal for meal in filtered_plan if meal['date'] <= end_date]

    sorted_plan = sorted(filtered_plan, key=lambda x: x['created_at'], reverse=True)
    return jsonify(sorted_plan)


    


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


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
