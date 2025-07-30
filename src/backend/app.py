from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
CORS(app)

API_KEY = os.getenv('SPOONACULAR_API_KEY')
BASE_URL = 'https://api.spoonacular.com'
@app.route('/')
def home():
    return "Welcome to the Meal Planner API!"

@app.route('/api/recipes/by-ingredients', methods=['GET'])
def get_recipes_by_ingredients():
    print("Received request for ingredients search") 
    ingredients = request.args.get('ingredients')
    if not ingredients:
        return jsonify({'error': 'No ingredients provided'}), 400
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
    
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')