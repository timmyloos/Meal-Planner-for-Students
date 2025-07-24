# Smart Meal Planner for Students

A web app to help students generate healthy, affordable, and personalized meal plans based on their dietary info, goals, and preferences.

---

## Quick Start

If you have cloned this project, run the following commands in the `smart-meal-planner` directory:

```sh
npm install   # Install all dependencies
npm run dev   # Start the development server
```

Then open the local URL (e.g., http://localhost:5173) in your browser.

---

## Features

- Login page (dummy for now)
- Diet input form (height, weight, goal, restrictions, foods you like)
- Meal plan generator (3 meals/day, macros, regenerate option)
- Calendar view for weekly meal plan
- Reminders to eat
- Recommendations based on meal history
- (Planned) AI-powered meal suggestions

---

## Tech Stack

- [React](https://react.dev/) (Vite)
- [React Router](https://reactrouter.com/)
- [Spoonacular API](https://spoonacular.com/food-api) (for recipes & nutrition)
- (Optional) [Cohere](https://cohere.com/) or [Hugging Face](https://huggingface.co/inference-api) for AI recommendations

---

## Getting Started

### 1. Clone the repository

```sh
git clone https://github.com/timmyloos/Meal-Planner-for-Students.git
cd smart-meal-planner
```

### 2. Install dependencies

```sh
npm install
```

### 3. Set up API keys

- **Spoonacular:** [Get your free API key here](https://spoonacular.com/food-api)
- (Optional) **Cohere/Hugging Face:** Sign up and get your API key if you want AI recommendations
- Create a `.env` file in the root of `smart-meal-planner` and add:
  ```env
  VITE_SPOONACULAR_API_KEY=your_spoonacular_api_key
  VITE_COHERE_API_KEY=your_cohere_api_key # optional
  ```

### 4. Start the development server

```sh
npm run dev
```

- Open the local URL (e.g., http://localhost:5173) in your browser

---

## Project Structure

```
smart-meal-planner/
  src/
    components/         # React components (pages, forms, etc.)
    utils/              # API helpers, reminder logic, etc.
    App.jsx             # Main app with routing
    main.jsx            # Entry point
  public/               # Static assets
  .env                  # API keys (not committed)
  README.md
```

---

## Notes

- This project is in early development. Pages are placeholders until features are built.
- For AI features, you can use Cohere or Hugging Face for free (see their docs for limits).
- Contributions welcome!
