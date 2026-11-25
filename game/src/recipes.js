// The Copper Ladle menu: 8 pantry ingredients, 12 dishes, 12 regulars.
// A dish is a set of (ingredient, state) pairs. States a cook can make:
//   raw     — straight from the pantry
//   chopped — held at the chopping board until the knife is done
//   cooked  — finished on a stove burner before it burns
// A plate matches a recipe only when its items are exactly the recipe's
// needs, ingredient and state both. Nothing else is a match.

export const INGREDIENTS = [
  { id: 'tomato', name: 'Tomato', color: '#d9392b', dark: '#8f1f14', chop: true, cook: true, key: '1' },
  { id: 'lettuce', name: 'Lettuce', color: '#58a83c', dark: '#2f6b1e', chop: true, cook: false, key: '2' },
  { id: 'mushroom', name: 'Mushroom', color: '#c9a37e', dark: '#8a6a48', chop: true, cook: true, key: '3' },
  { id: 'bread', name: 'Bread', color: '#d9a05b', dark: '#9a6a2a', chop: false, cook: true, key: '4' },
  { id: 'cheese', name: 'Cheese', color: '#f2c230', dark: '#b98a12', chop: false, cook: true, key: '5' },
  { id: 'pasta', name: 'Pasta', color: '#f0d48a', dark: '#b3944a', chop: false, cook: true, key: '6' },
  { id: 'berry', name: 'Berry', color: '#7a3fa0', dark: '#4c2266', chop: false, cook: false, key: '7' },
  { id: 'egg', name: 'Egg', color: '#fdf3d0', dark: '#c9a85a', chop: false, cook: true, key: '8' },
];

export const INGREDIENT_BY_ID = {};
for (const ing of INGREDIENTS) INGREDIENT_BY_ID[ing.id] = ing;

function need(ing, state) {
  return { ing, state };
}

// rush = the first rush in which the dish appears on the menu.
export const RECIPES = [
  { id: 'tomato-soup', name: 'Tomato Soup', rush: 1, price: 8,
    needs: [need('tomato', 'cooked')] },
  { id: 'garden-salad', name: 'Garden Salad', rush: 1, price: 10,
    needs: [need('lettuce', 'chopped'), need('tomato', 'chopped')] },
  { id: 'grilled-cheese', name: 'Grilled Cheese', rush: 1, price: 11,
    needs: [need('bread', 'cooked'), need('cheese', 'cooked')] },
  { id: 'berry-tart', name: 'Berry Tart', rush: 1, price: 11,
    needs: [need('berry', 'raw'), need('bread', 'cooked')] },
  { id: 'mushroom-pasta', name: 'Mushroom Pasta', rush: 1, price: 13,
    needs: [need('pasta', 'cooked'), need('mushroom', 'chopped')] },
  { id: 'tomato-bruschetta', name: 'Tomato Bruschetta', rush: 1, price: 10,
    needs: [need('bread', 'raw'), need('tomato', 'chopped')] },
  { id: 'mushroom-soup', name: 'Mushroom Soup', rush: 2, price: 14,
    needs: [need('mushroom', 'cooked'), need('tomato', 'cooked')] },
  { id: 'cheese-pasta', name: 'Cheese Pasta', rush: 2, price: 14,
    needs: [need('pasta', 'cooked'), need('cheese', 'cooked')] },
  { id: 'berry-salad', name: 'Berry Salad', rush: 2, price: 12,
    needs: [need('berry', 'raw'), need('lettuce', 'chopped')] },
  { id: 'garden-pasta', name: 'Garden Pasta', rush: 3, price: 17,
    needs: [need('pasta', 'cooked'), need('lettuce', 'chopped'), need('tomato', 'chopped')] },
  { id: 'mushroom-omelette', name: 'Mushroom Omelette', rush: 3, price: 15,
    needs: [need('egg', 'cooked'), need('mushroom', 'chopped')] },
  { id: 'ladle-special', name: 'Ladle Special', rush: 3, price: 24,
    needs: [need('pasta', 'cooked'), need('tomato', 'cooked'),
            need('mushroom', 'chopped'), need('cheese', 'cooked')] },
];

export const RECIPE_BY_ID = {};
for (const recipe of RECIPES) RECIPE_BY_ID[recipe.id] = recipe;

export function recipesForRush(rush) {
  return RECIPES.filter((recipe) => recipe.rush <= rush);
}

export const CUSTOMERS = [
  'Mira', 'Bram', 'Sinta', 'Dedi', 'Lestari', 'Agus',
  'Rani', 'Joko', 'Putri', 'Budi', 'Dewi', 'Andi',
];

export const RUSH_NAMES = ['Morning Rush', 'Lunch Rush', 'Dinner Rush'];
export const RUSH_LENGTH_SECONDS = 150;
export const RUSH_HOUR_SECONDS = 60;
export const CHOP_SECONDS = 1.2;
export const COOK_SECONDS = 4;
export const BURN_SECONDS = 8;

export function describeItem(item) {
  if (!item) return '';
  if (item.plate) return 'Plate (' + item.items.length + ' items)';
  const ing = INGREDIENT_BY_ID[item.ing];
  const stateWord = item.state === 'raw' ? '' : item.state === 'burnt' ? 'burnt ' : item.state + ' ';
  return stateWord + (ing ? ing.name : item.ing);
}
