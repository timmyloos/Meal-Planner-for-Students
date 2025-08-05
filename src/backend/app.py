from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()
app = Flask(__name__)
CORS(app)

API_KEY = os.getenv('SPOONACULAR_API_KEY')
BASE_URL = 'https://api.spoonacular.com'

ingredients_list = []
saved_recipes = []
meal_plan = []

@app.route('/')
def home():
    return "Welcome to the Meal Planner API!"

@app.route('/api/recipes/by-ingredients', methods=['GET'])
def get_recipes_by_ingredients():
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


    
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')