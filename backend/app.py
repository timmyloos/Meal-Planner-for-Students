from flask import Flask, request, jsonify, session
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv
from datetime import datetime
from functools import wraps
from pathlib import Path
import google.generativeai as genai
import hashlib
import uuid
import json

# Load .env from the project root (two directories up from backend)
load_dotenv('../../.env')
app = Flask(__name__)
app.secret_key = 'your-secret-key-change-in-production'  # For session management
CORS(app, supports_credentials=True)

# User management functions


def load_users():
    """Load users from JSON file"""
    try:
        with open('users.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {"users": {}}


def save_users(users_data):
    """Save users to JSON file"""
    with open('users.json', 'w') as f:
        json.dump(users_data, f, indent=2)


def hash_password(password):
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()


def create_user(username, email, password):
    """Create a new user account"""
    users_data = load_users()

    # Check if username or email already exists
    for user_id, user in users_data['users'].items():
        if user['username'] == username:
            return False, "Username already exists"
        if user['email'] == email:
            return False, "Email already exists"

    # Create new user
    user_id = str(uuid.uuid4())
    new_user = {
        'id': user_id,
        'username': username,
        'email': email,
        'password_hash': hash_password(password),
        'created_at': datetime.now().isoformat(),
        'diet_input': {},
        'meal_plans': [],
        'calendar_events': [],
        'recommendations': [],
        'preferences': {}
    }

    users_data['users'][user_id] = new_user
    save_users(users_data)
    return True, user_id


def authenticate_user(username, password):
    """Authenticate user login"""
    users_data = load_users()

    for user_id, user in users_data['users'].items():
        if user['username'] == username and user['password_hash'] == hash_password(password):
            return True, user_id, user
    return False, None, None


def get_user_data(user_id):
    """Get user data by ID"""
    users_data = load_users()
    return users_data['users'].get(user_id)


def update_user_data(user_id, data_type, data):
    """Update specific user data"""
    users_data = load_users()
    if user_id in users_data['users']:
        users_data['users'][user_id][data_type] = data
        save_users(users_data)
        return True
    return False


API_KEY = os.getenv('VITE_SPOONACULAR_API_KEY')
GEMINI_API_KEY = os.getenv('VITE_GEMINI_API_KEY')
BASE_URL = 'https://api.spoonacular.com'

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("Warning: Google Gemini API key not configured. Some features may not work.")

ingredients_list = []
saved_recipes = []
user_preferences = []
user_food_preferences = []

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

# Authentication endpoints


@app.route('/api/auth/signup', methods=['POST'])
@handle_errors
def signup():
    """User registration endpoint"""
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')

    if not username or not email or not password:
        return jsonify({'error': 'Username, email, and password are required'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    success, result = create_user(username, email, password)

    if success:
        return jsonify({
            'message': 'Account created successfully',
            'user_id': result
        }), 201
    else:
        return jsonify({'error': result}), 400


@app.route('/api/auth/login', methods=['POST'])
@handle_errors
def login():
    """User login endpoint"""
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    success, user_id, user_data = authenticate_user(username, password)

    if success:
        session['user_id'] = user_id
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': user_id,
                'username': user_data['username'],
                'email': user_data['email']
            }
        }), 200
    else:
        return jsonify({'error': 'Invalid username or password'}), 401


@app.route('/api/auth/logout', methods=['POST'])
@handle_errors
def logout():
    """User logout endpoint"""
    session.pop('user_id', None)
    return jsonify({'message': 'Logout successful'}), 200


@app.route('/api/auth/check', methods=['GET'])
@handle_errors
def check_auth():
    """Check if user is authenticated"""
    user_id = session.get('user_id')
    if user_id:
        user_data = get_user_data(user_id)
        if user_data:
            return jsonify({
                'authenticated': True,
                'user': {
                    'id': user_id,
                    'username': user_data['username'],
                    'email': user_data['email']
                }
            }), 200

    return jsonify({'authenticated': False}), 401

# User data endpoints


@app.route('/api/user/data/<data_type>', methods=['GET'])
@handle_errors
def get_user_data_endpoint(data_type):
    """Get user data by type"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401

    print(f"Getting {data_type} for user {user_id}")

    user_data = get_user_data(user_id)
    if not user_data:
        print(f"User {user_id} not found")
        return jsonify({'error': 'User not found'}), 404

    if data_type not in user_data:
        print(f"Data type {data_type} not found for user {user_id}")
        return jsonify({'error': 'Data type not found'}), 404

    print(f"Returning {data_type}: {user_data[data_type]}")
    return jsonify({data_type: user_data[data_type]}), 200


@app.route('/api/user/data/<data_type>', methods=['POST'])
@handle_errors
def save_user_data_endpoint(data_type):
    """Save user data by type"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    print(f"Saving {data_type} for user {user_id}")
    print(f"Data to save: {data}")

    success = update_user_data(user_id, data_type, data)
    if success:
        print(f"Successfully saved {data_type}")
        return jsonify({'message': f'{data_type} saved successfully'}), 200
    else:
        print(f"Failed to save {data_type}")
        return jsonify({'error': 'Failed to save data'}), 500

# generate recommendations using Google Gemini


@app.route('/api/estimate-nutrition', methods=['POST'])
@handle_errors
def estimate_nutrition():
    print("Received nutrition estimation request")
    data = request.get_json()
    print(f"Request data: {data}")

    if not data:
        print("No data provided")
        return jsonify({'error': 'No data provided'}), 400

    title = data.get('title', '')
    ingredients = data.get('ingredients', '')
    print(f"Title: {title}, Ingredients: {ingredients}")

    if not title or not ingredients:
        print("Missing title or ingredients")
        return jsonify({'error': 'Title and ingredients are required'}), 400

    try:
        # First try to get nutrition from Spoonacular by analyzing ingredients
        if API_KEY:
            print(f"Analyzing ingredients: {ingredients}")

            # Split ingredients and analyze each one
            ingredient_list = [ingredient.strip().lower()
                               for ingredient in ingredients.split(',')]
            total_calories = 0
            total_protein = 0
            total_carbs = 0
            total_fat = 0
            analyzed_ingredients = 0

            for ingredient in ingredient_list:
                try:
                    # Search for the specific ingredient
                    ingredient_response = requests.get(f'{BASE_URL}/food/ingredients/search', params={
                        'query': ingredient,
                        'number': 1,
                        'apiKey': API_KEY
                    })

                    if ingredient_response.ok:
                        ingredient_data = ingredient_response.json()
                        if ingredient_data.get('results'):
                            ingredient_id = ingredient_data['results'][0]['id']

                            # Get nutrition for this ingredient
                            nutrition_response = requests.get(f'{BASE_URL}/food/ingredients/{ingredient_id}/information', params={
                                'amount': 100,  # 100g serving
                                'unit': 'g',
                                'apiKey': API_KEY
                            })

                            if nutrition_response.ok:
                                nutrition_data = nutrition_response.json()
                                nutrients = nutrition_data.get(
                                    'nutrition', {}).get('nutrients', [])

                                calories = next(
                                    (n for n in nutrients if n['name'] == 'Calories'), None)
                                protein = next(
                                    (n for n in nutrients if n['name'] == 'Protein'), None)
                                carbs = next(
                                    (n for n in nutrients if n['name'] == 'Carbohydrates'), None)
                                fat = next(
                                    (n for n in nutrients if n['name'] == 'Total Lipid (g)'), None)

                                if calories and protein:
                                    total_calories += calories['amount']
                                    total_protein += protein['amount']
                                    total_carbs += carbs['amount'] if carbs else 0
                                    total_fat += fat['amount'] if fat else 0
                                    analyzed_ingredients += 1
                                    print(
                                        f"Analyzed {ingredient}: {calories['amount']} cal, {protein['amount']}g protein")

                except Exception as e:
                    print(f"Error analyzing ingredient {ingredient}: {e}")
                    continue

            # If we successfully analyzed ingredients, return the totals
            if analyzed_ingredients > 0:
                # Adjust for typical serving size (divide by number of ingredients for rough estimate)
                # At least 1 serving
                serving_factor = max(1, analyzed_ingredients)

                return jsonify({
                    'calories': round(total_calories / serving_factor),
                    'protein': round(total_protein / serving_factor, 1),
                    'carbs': round(total_carbs / serving_factor, 1),
                    'fat': round(total_fat / serving_factor, 1),
                    'source': f'Spoonacular (analyzed {analyzed_ingredients} ingredients)'
                })

            # Fallback: try recipe search if ingredient analysis failed
            print(f"Falling back to recipe search with title: {title}")
            search_response = requests.get(f'{BASE_URL}/recipes/complexSearch', params={
                'query': title,
                'number': 1,
                'addRecipeNutrition': True,
                'apiKey': API_KEY
            })

            print(
                f"Spoonacular response status: {search_response.status_code}")
            if search_response.ok:
                search_data = search_response.json()
                if search_data.get('results'):
                    recipe = search_data['results'][0]
                    nutrition = recipe.get('nutrition', {})
                    nutrients = nutrition.get('nutrients', [])

                    calories = next(
                        (n for n in nutrients if n['name'] == 'Calories'), None)
                    protein = next(
                        (n for n in nutrients if n['name'] == 'Protein'), None)
                    carbs = next(
                        (n for n in nutrients if n['name'] == 'Carbohydrates'), None)
                    fat = next(
                        (n for n in nutrients if n['name'] == 'Fat'), None)

                    return jsonify({
                        'calories': calories['amount'] if calories else 0,
                        'protein': protein['amount'] if protein else 0,
                        'carbs': carbs['amount'] if carbs else 0,
                        'fat': fat['amount'] if fat else 0,
                        'source': 'Spoonacular (recipe search)'
                    })

        # Fallback to Gemini AI estimation
        if GEMINI_API_KEY:
            print("Trying Gemini AI estimation")
            model = genai.GenerativeModel('gemini-1.5-flash')

            prompt = f"""
Estimate the nutritional content for this meal based on the ingredients provided.

Meal Title: {title}
Ingredients: {ingredients}

Please provide estimated nutritional values for a typical serving size. Return only a JSON object with these exact keys:
{{
    "calories": <estimated calories>,
    "protein": <estimated protein in grams>,
    "carbs": <estimated carbohydrates in grams>,
    "fat": <estimated fat in grams>
}}

Provide realistic estimates based on common nutritional values for the ingredients listed. Round to reasonable numbers.
"""

            response = model.generate_content(prompt)

            try:
                # Try to parse the response as JSON
                import json
                result = json.loads(response.text)
                return jsonify({
                    'calories': result.get('calories', 0),
                    'protein': result.get('protein', 0),
                    'carbs': result.get('carbs', 0),
                    'fat': result.get('fat', 0),
                    'source': 'Gemini AI'
                })
            except json.JSONDecodeError:
                # If JSON parsing fails, try to extract numbers from text
                import re
                text = response.text
                calories_match = re.search(
                    r'calories?[:\s]*(\d+)', text, re.IGNORECASE)
                protein_match = re.search(
                    r'protein[:\s]*(\d+(?:\.\d+)?)', text, re.IGNORECASE)
                carbs_match = re.search(
                    r'carbs?[:\s]*(\d+(?:\.\d+)?)', text, re.IGNORECASE)
                fat_match = re.search(
                    r'fat[:\s]*(\d+(?:\.\d+)?)', text, re.IGNORECASE)

                return jsonify({
                    'calories': float(calories_match.group(1)) if calories_match else 0,
                    'protein': float(protein_match.group(1)) if protein_match else 0,
                    'carbs': float(carbs_match.group(1)) if carbs_match else 0,
                    'fat': float(fat_match.group(1)) if fat_match else 0,
                    'source': 'Gemini AI (parsed)'
                })

        # If no APIs available, return basic estimation
        print("Using default estimation")
        return jsonify({
            'calories': 300,
            'protein': 15,
            'carbs': 30,
            'fat': 10,
            'source': 'Default estimation'
        })

    except Exception as e:
        print(f"Nutrition estimation error: {e}")
        return jsonify({'error': f'Failed to estimate nutrition: {str(e)}'}), 500


@app.route('/api/chatbot', methods=['POST'])
@handle_errors
def chatbot():
    """Chatbot endpoint using Gemini AI for nutrition and meal planning assistance"""
    data = request.get_json()

    if not data or 'message' not in data:
        return jsonify({'error': 'Message is required'}), 400

    user_message = data['message']
    print(f"Chatbot request: {user_message}")

    if not GEMINI_API_KEY:
        return jsonify({
            'response': "I'm sorry, but I'm not available right now. Please check back later or contact support."
        })

    try:
        model = genai.GenerativeModel('gemini-1.5-flash')

        # Create a context-aware prompt for nutrition assistance
        prompt = f"""
You are a helpful nutrition assistant for a meal planning app. The user is asking: "{user_message}"

Please provide a helpful, informative response about nutrition, meal planning, healthy eating, or general food advice. 

Guidelines:
- Keep responses conversational and friendly
- Provide practical, actionable advice
- Include specific examples when helpful
- Focus on evidence-based nutrition information
- Keep responses concise but informative (2-4 sentences)
- If asked about specific foods, mention their nutritional benefits
- If asked about meal planning, provide practical tips
- If asked about dietary restrictions, be supportive and helpful

Respond in a helpful, conversational tone as if you're a friendly nutrition expert.
"""

        response = model.generate_content(prompt)
        print(f"Chatbot response generated successfully")

        return jsonify({
            'response': response.text.strip()
        })

    except Exception as e:
        print(f"Chatbot error: {e}")
        return jsonify({
            'response': "I'm having trouble processing your request right now. Please try again in a moment!"
        })


@app.route('/api/generate-recommendations', methods=['POST'])
@handle_errors
def generate_recommendations():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    if not GEMINI_API_KEY:
        return jsonify({'error': 'Google Gemini API key not configured'}), 500

    try:
        # get user prefrences
        user_prefs = data.get('userPreferences', {})

        # promt format
        if user_prefs.get('currentMeals'):
            current_meals_text = "\n".join([
                f"- {meal.get('type', 'Unknown')}: {meal.get('title', 'Unknown')} "
                f"({meal.get('calories', 0):.0f} calories, {meal.get('protein', 0):.0f}g protein, "
                f"{meal.get('carbs', 0):.0f}g carbs, {meal.get('fat', 0):.0f}g fat)"
                for meal in user_prefs.get('currentMeals', [])
            ])
        else:
            current_meals_text = "No current meal plan available"

        recent_recipes_text = ', '.join(user_prefs.get('recentRecipes', [])) if user_prefs.get(
            'recentRecipes') else 'No recent recipes available'

        prompt = f"""
I need personalized meal recommendations based on my dietary profile and current meal plan. Here are my details:
Personal Information:
- Height: {user_prefs.get('height', 'Not specified')} cm
- Weight: {user_prefs.get('weight', 'Not specified')} kg
- Dietary Goal: {user_prefs.get('goal', 'maintain weight')}
- Daily Calorie Target: {user_prefs.get('dailyCalories', 'Not specified')} calories
- Dietary Restrictions: {user_prefs.get('restrictions', 'None specified')}

Current Meal Plan:
{current_meals_text}

Food Preferences:
{user_prefs.get('foodLog', 'No food preferences specified')}

Recent Recipes I've Tried:
{recent_recipes_text}

Based on this information, please provide:

1. Meal Improvement Suggestions: 2-3 specific suggestions to improve my current meal plan, considering my goal of "{user_prefs.get('goal', 'maintaining weight')}" and any dietary restrictions.

2. New Recipe Recommendations: 2-3 healthy recipe ideas that would fit my dietary goal and preferences, with estimated nutritional information.

3. Nutrition & Habit Tips: 2-3 practical nutrition tips or healthy habits that would help me achieve my goal of "{user_prefs.get('goal', 'maintaining weight')}".

4. Foods to Limit or Avoid: Based on my current plan and goal, what foods or eating patterns should I be mindful of?

Please provide specific, actionable advice that I can implement immediately. Focus on practical suggestions rather than generic advice.
        """

        # Try different model names in order of preference
        model_names = [
            'gemini-1.5-flash',
            'gemini-1.5-pro',
            'gemini-pro',
            'models/gemini-pro',
            'models/gemini-1.5-flash'
        ]

        response = None
        used_model = None

        for model_name in model_names:
            try:
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(prompt)
                used_model = model_name
                break
            except Exception as model_error:
                continue

        if not response:
            return jsonify({'error': 'No available AI models found. Please check your API key permissions.'}), 500

        if response.text:
            return jsonify({
                'recommendations': response.text,
                'success': True,
                'model_used': used_model
            })
        else:
            return jsonify({'error': 'No recommendations generated by AI'}), 500

    except Exception as e:
        return jsonify({'error': f'Failed to generate recommendations: {str(e)}'}), 500

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
        # Parse dietary restrictions and food preferences
        restrictions = restrictions.lower() if restrictions else ''
        foods = foods.lower() if foods else ''

        # Build search parameters based on restrictions and preferences
        search_params = {
            'addRecipeNutrition': True,
            'number': 3,  # Get 3 options per meal type
            'apiKey': API_KEY
        }

        # Add dietary restrictions
        if 'vegetarian' in restrictions:
            search_params['diet'] = 'vegetarian'
        elif 'vegan' in restrictions:
            search_params['diet'] = 'vegan'
        elif 'gluten-free' in restrictions or 'gluten free' in restrictions:
            search_params['diet'] = 'gluten-free'
        elif 'dairy-free' in restrictions or 'dairy free' in restrictions:
            search_params['diet'] = 'dairy-free'
        elif 'keto' in restrictions:
            search_params['diet'] = 'ketogenic'
        elif 'paleo' in restrictions:
            search_params['diet'] = 'paleo'

        # Add food preferences to search query
        if foods:
            # Extract first few ingredients for search
            food_list = [f.strip() for f in foods.split(',')[:3]]
            search_params['includeIngredients'] = ','.join(food_list)

        # Add additional search parameters for better results
        search_params['sort'] = 'popularity'  # Get popular recipes
        search_params['sortDirection'] = 'desc'

        # Add intolerance filters if specified
        intolerances = []
        if 'gluten' in restrictions:
            intolerances.append('gluten')
        if 'dairy' in restrictions:
            intolerances.append('dairy')
        if 'nuts' in restrictions or 'peanut' in restrictions:
            intolerances.append('tree nut')
        if 'shellfish' in restrictions:
            intolerances.append('shellfish')
        if 'soy' in restrictions:
            intolerances.append('soy')
        if 'egg' in restrictions:
            intolerances.append('egg')
        if 'fish' in restrictions:
            intolerances.append('fish')

        if intolerances:
            search_params['intolerances'] = ','.join(intolerances)

        print(f"Search parameters: {search_params}")

        # Search for breakfast recipes with variety
        breakfast_queries = ['breakfast', 'morning meal',
                             'eggs', 'pancakes', 'oatmeal']
        breakfast_params = {**search_params, 'maxReadyTime': 30}

        breakfast_response = None
        for query in breakfast_queries:
            breakfast_params['query'] = query
            breakfast_response = requests.get(
                f'{BASE_URL}/recipes/complexSearch',
                params=breakfast_params
            )
            if breakfast_response.ok and breakfast_response.json().get('results'):
                print(f"Breakfast found with query '{query}'")
                break

        if not breakfast_response or not breakfast_response.ok:
            # Fallback to basic breakfast search
            breakfast_params['query'] = 'breakfast'
            breakfast_response = requests.get(
                f'{BASE_URL}/recipes/complexSearch',
                params=breakfast_params
            )

        print(
            f"Breakfast API Response Status: {breakfast_response.status_code if breakfast_response else 'No response'}")

        # Search for lunch recipes with variety
        lunch_queries = ['lunch', 'sandwich', 'salad', 'soup', 'pasta']
        lunch_params = {**search_params, 'maxReadyTime': 45}

        lunch_response = None
        for query in lunch_queries:
            lunch_params['query'] = query
            lunch_response = requests.get(
                f'{BASE_URL}/recipes/complexSearch',
                params=lunch_params
            )
            if lunch_response.ok and lunch_response.json().get('results'):
                print(f"Lunch found with query '{query}'")
                break

        if not lunch_response or not lunch_response.ok:
            # Fallback to basic lunch search
            lunch_params['query'] = 'lunch'
            lunch_response = requests.get(
                f'{BASE_URL}/recipes/complexSearch',
                params=lunch_params
            )

        print(
            f"Lunch API Response Status: {lunch_response.status_code if lunch_response else 'No response'}")

        # Search for dinner recipes with variety
        dinner_queries = ['dinner', 'main course',
                          'chicken', 'beef', 'fish', 'vegetarian main']
        dinner_params = {**search_params, 'maxReadyTime': 60}

        dinner_response = None
        for query in dinner_queries:
            dinner_params['query'] = query
            dinner_response = requests.get(
                f'{BASE_URL}/recipes/complexSearch',
                params=dinner_params
            )
            if dinner_response.ok and dinner_response.json().get('results'):
                print(f"Dinner found with query '{query}'")
                break

        if not dinner_response or not dinner_response.ok:
            # Fallback to basic dinner search
            dinner_params['query'] = 'dinner'
            dinner_response = requests.get(
                f'{BASE_URL}/recipes/complexSearch',
                params=dinner_params
            )

        print(
            f"Dinner API Response Status: {dinner_response.status_code if dinner_response else 'No response'}")

        enhanced_meals = []
        used_recipe_ids = set()  # Track used recipe IDs to avoid duplicates

        def process_meal_response(response, meal_type):
            """Process meal response and return the best meal, avoiding duplicates"""
            if not response.ok:
                return None

            data = response.json()
            if not data.get('results'):
                return None

            # Find the first recipe that hasn't been used yet
            for meal in data['results']:
                if meal['id'] not in used_recipe_ids:
                    used_recipe_ids.add(meal['id'])  # Mark this recipe as used
                    break
            else:
                # If all recipes are duplicates, use the first one but log it
                meal = data['results'][0]
                print(
                    f"Warning: Using duplicate recipe for {meal_type}: {meal['title']}")

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
                    f"Detailed {meal_type} recipe fetched: {detailed_recipe.get('title', 'Unknown')}")

            # Try to get equipment from a different endpoint or extract from instructions
            equipment_data = detailed_recipe.get('equipment', [])
            if not equipment_data and detailed_recipe.get('instructions'):
                # Extract common equipment from instructions
                instructions = detailed_recipe.get('instructions', '').lower()
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

            return {
                'type': meal_type,
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
            }

        # Process breakfast
        breakfast_meal = process_meal_response(breakfast_response, 'breakfast')
        if breakfast_meal:
            enhanced_meals.append(breakfast_meal)

        # Process lunch
        lunch_meal = process_meal_response(lunch_response, 'lunch')
        if lunch_meal:
            enhanced_meals.append(lunch_meal)

        # Process dinner
        dinner_meal = process_meal_response(dinner_response, 'dinner')
        if dinner_meal:
            enhanced_meals.append(dinner_meal)

        # If we have duplicates, try to get alternative recipes
        meal_titles = [meal['title'] for meal in enhanced_meals]
        if len(meal_titles) != len(set(meal_titles)):
            print("Detected duplicates, trying to get alternative recipes...")

            # Try alternative searches for duplicates
            for i, meal in enumerate(enhanced_meals):
                if meal_titles.count(meal['title']) > 1:
                    meal_type = meal['type']
                    print(f"Getting alternative for {meal_type}...")

                    # Try different search terms for this meal type
                    if meal_type == 'breakfast':
                        alt_queries = ['muffins',
                                       'cereal', 'yogurt', 'smoothie']
                    elif meal_type == 'lunch':
                        alt_queries = ['wrap', 'bowl', 'stir fry', 'quinoa']
                    else:  # dinner
                        alt_queries = ['roast', 'grill', 'bake', 'stew']

                    for alt_query in alt_queries:
                        alt_params = {**search_params, 'query': alt_query}
                        if meal_type == 'breakfast':
                            alt_params['maxReadyTime'] = 30
                        elif meal_type == 'lunch':
                            alt_params['maxReadyTime'] = 45
                        else:
                            alt_params['maxReadyTime'] = 60

                        alt_response = requests.get(
                            f'{BASE_URL}/recipes/complexSearch',
                            params=alt_params
                        )

                        if alt_response.ok:
                            alt_data = alt_response.json()
                            if alt_data.get('results'):
                                # Find first unused recipe
                                for alt_meal in alt_data['results']:
                                    if alt_meal['id'] not in used_recipe_ids:
                                        # Process this alternative meal
                                        alt_processed = process_meal_response(
                                            alt_response, meal_type)
                                        if alt_processed and alt_processed['title'] != meal['title']:
                                            enhanced_meals[i] = alt_processed
                                            print(
                                                f"Replaced {meal_type} with: {alt_processed['title']}")
                                            break
                                if enhanced_meals[i]['title'] != meal['title']:
                                    break

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
    existing = next((item for item in ingredients_list if item['ingredients'].lower(
    ) == ingredients.lower()), None)
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
    sorted_history = sorted(
        ingredients_list, key=lambda x: x['timestamp'], reverse=True)
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
        'gemini_api_key_configured': bool(GEMINI_API_KEY),
        'api_key_configured': bool(API_KEY),
        'api_key_preview': API_KEY[:8] + '...' if API_KEY else 'Not configured',
        'gemini_api_key_preview': GEMINI_API_KEY[:10] + '...' if GEMINI_API_KEY else 'Not configured',
        'saved_recipes_count': len(saved_recipes),
        'ingredient_searches_count': len(ingredients_list),
        'food_preferences_count': len(user_food_preferences)
    })


@app.route('/')
def home():
    return "Welcome to the Meal Planner API!"


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
