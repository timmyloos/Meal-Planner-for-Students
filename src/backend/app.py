from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv

load_dotenv() 
app = Flask(__name__)
CORS(app)

API_KEY = os.getenv('FOOD_API_KEY')
print("Loaded API Key:", API_KEY)
BASE_URL = 'https://api.spoonacular.com/recipes/findByIngredients'

@app.route('/')
def home():
    return 'Flask API is running! Try /api/recipes/by-ingredients?ingredients=apple,bannana'

@app.route('/api/recipes/by-ingredients')
def search_by_ingredients():
    ingredients = request.args.get('ingredients')
    if not ingredients:
        print("No ingredients provided in the request.")
        return jsonify({'error': 'No ingredients provided'}), 400
    
    print(f"Requesting recipes with ingredients: {ingredients}")
    print(f"Using API Key: {API_KEY}") 

    #url = f"{BASE_URL}/findByIngredients?ingredients={ingredients}&apiKey={API_KEY}"
    params = {
        'ingredients': ingredients,
        'number': 10,  
        'apiKey': API_KEY
    }
    response = requests.get(BASE_URL, params=params)
    
    print(f"Spoonacular Response Status: {response.status_code}")
    print(f"Spoonacular Response Text: {response.text}")
    
    if response.status_code != 200:
        print('API Error:', response.text)
        return jsonify({'error': 'Failed to fetch recipes'}), 500

    return jsonify(response.json())


if __name__ == '__main__':
    app.run(debug=True, port=5000)