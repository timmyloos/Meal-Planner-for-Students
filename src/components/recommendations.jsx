const geminiResponse = await generateMealRecommendations({
  contents: [{
    parts: [{
      text: `
I need meal recommendations based on my dietary preferences and recent food history. Here are my details:
Height: ${userPreferences.height} cm
Weight: ${userPreferences.weight} kg
Dietary goal: ${userPreferences.goal}
Dietary restrictions: ${userPreferences.restrictions}

Here is what I’ve eaten recently: ${userPreferences.foodLog}

Here are some recipes I’ve tried or liked: ${userPreferences.recentRecipes?.join(', ')}

Based on all this, please:
1. Suggest 2-3 new meal ideas tailored to my needs
2. Give me 2-3 nutrition or habit tips to help me reach my goal
3. Let me know if there’s anything I should reduce or avoid in my current diet
`
    }]
  }]
});
