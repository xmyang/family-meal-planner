import { neon, type NeonQueryFunction } from '@neondatabase/serverless'
import type { PantryItem, Recipe, ShoppingItem, MasterShoppingItem } from './types'

let _sql: NeonQueryFunction<false, false> | null = null

function getSQL() {
  if (!_sql) {
    _sql = neon(process.env.DATABASE_URL!)
  }
  return _sql
}

export async function initDB() {
  const sql = getSQL()
  await sql`
    CREATE TABLE IF NOT EXISTS pantry_items (
      id        SERIAL PRIMARY KEY,
      name      VARCHAR(100) NOT NULL,
      category  VARCHAR(50)  NOT NULL DEFAULT '其他',
      qty       DECIMAL      NOT NULL DEFAULT 0,
      unit      VARCHAR(20)  NOT NULL DEFAULT '个',
      location  VARCHAR(20)  NOT NULL DEFAULT 'fridge',
      icon      VARCHAR(10)  NOT NULL DEFAULT '🛒',
      created_at TIMESTAMP   DEFAULT NOW(),
      updated_at TIMESTAMP   DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS recipes (
      id          SERIAL PRIMARY KEY,
      name        VARCHAR(100) NOT NULL,
      tags        TEXT[]       NOT NULL DEFAULT '{}',
      time        VARCHAR(20)  NOT NULL DEFAULT '',
      ingredients TEXT[]       NOT NULL DEFAULT '{}',
      steps       Text[]       NOT NULL DEFAULT '{}',
      nutrition   VARCHAR(200) NOT NULL DEFAULT '',
      icon        VARCHAR(10)  NOT NULL DEFAULT '🍽️',
      created_at  TIMESTAMP    DEFAULT NOW(),
      updated_at  TIMESTAMP    DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS shopping_items (
      id         SERIAL PRIMARY KEY,
      name       VARCHAR(100) NOT NULL,
      qty        DECIMAL      NOT NULL DEFAULT 1,
      unit       VARCHAR(20)  NOT NULL DEFAULT '个',
      checked    BOOLEAN      NOT NULL DEFAULT false,
      created_at TIMESTAMP    DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS master_shopping_items (
      id         SERIAL PRIMARY KEY,
      name       VARCHAR(100) NOT NULL UNIQUE,
      category   VARCHAR(20)  NOT NULL DEFAULT '其他',
      store      VARCHAR(20)  NOT NULL DEFAULT '',
      created_at TIMESTAMP    DEFAULT NOW(),
      updated_at TIMESTAMP    DEFAULT NOW()
    )
  `
}

export async function getPantryItems(): Promise<PantryItem[]> {
  const sql = getSQL()
  const rows = await sql`
    SELECT * FROM pantry_items ORDER BY location, name
  `
  return rows.map(r => ({ ...r, qty: Number(r.qty) })) as PantryItem[]
}

export async function updatePantryItemQty(id: number, qty: number): Promise<void> {
  const sql = getSQL()
  await sql`
    UPDATE pantry_items
    SET qty = ${Math.max(0, qty)}, updated_at = NOW()
    WHERE id = ${id}
  `
}

export async function addPantryItem(item: Omit<PantryItem, 'id' | 'created_at' | 'updated_at'>): Promise<PantryItem> {
  const sql = getSQL()
  const rows = await sql`
    INSERT INTO pantry_items (name, category, qty, unit, location, icon)
    VALUES (${item.name}, ${item.category}, ${item.qty}, ${item.unit}, ${item.location}, ${item.icon})
    RETURNING *
  `
  return rows[0] as PantryItem
}

export async function replacePantry(items: Omit<PantryItem, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> {
  const sql = getSQL()
  await sql`DELETE FROM pantry_items`
  for (const item of items) {
    await sql`
      INSERT INTO pantry_items (name, category, qty, unit, location, icon)
      VALUES (${item.name}, ${item.category}, ${item.qty}, ${item.unit}, ${item.location}, ${item.icon})
    `
  }
}

// ── Recipes ────────────────────────────────────────────

export async function getRecipes(): Promise<Recipe[]> {
  const sql = getSQL()
  const rows = await sql`SELECT * FROM recipes ORDER BY id`
  return rows as Recipe[]
}

export async function addRecipe(recipe: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>): Promise<Recipe> {
  const sql = getSQL()
  const rows = await sql`
    INSERT INTO recipes (name, tags, time, ingredients, steps, nutrition, icon)
    VALUES (${recipe.name}, ${recipe.tags}, ${recipe.time}, ${recipe.ingredients}, ${recipe.steps}, ${recipe.nutrition}, ${recipe.icon})
    RETURNING *
  `
  return rows[0] as Recipe
}

export async function updateRecipeIngredients(id: number, ingredients: string[]): Promise<void> {
  const sql = getSQL()
  await sql`
    UPDATE recipes SET ingredients = ${ingredients}, updated_at = NOW()
    WHERE id = ${id}
  `
}

export async function seedRecipes(recipes: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> {
  const sql = getSQL()
  for (const r of recipes) {
    await sql`
      INSERT INTO recipes (name, tags, time, ingredients, steps, nutrition, icon)
      VALUES (${r.name}, ${r.tags}, ${r.time}, ${r.ingredients}, ${r.steps}, ${r.nutrition}, ${r.icon})
    `
  }
}

// ── Shopping List ──────────────────────────────────────

export async function getShoppingItems(): Promise<ShoppingItem[]> {
  const sql = getSQL()
  const rows = await sql`SELECT * FROM shopping_items ORDER BY checked, id`
  return rows.map(r => ({ ...r, qty: Number(r.qty) })) as ShoppingItem[]
}

export async function addShoppingItem(item: Omit<ShoppingItem, 'id' | 'created_at'>): Promise<ShoppingItem> {
  const sql = getSQL()
  const rows = await sql`
    INSERT INTO shopping_items (name, qty, unit, checked)
    VALUES (${item.name}, ${item.qty}, ${item.unit}, ${item.checked})
    RETURNING *
  `
  return rows[0] as ShoppingItem
}

export async function toggleShoppingItem(id: number, checked: boolean): Promise<void> {
  const sql = getSQL()
  await sql`UPDATE shopping_items SET checked = ${checked} WHERE id = ${id}`
}

export async function deleteShoppingItem(id: number): Promise<void> {
  const sql = getSQL()
  await sql`DELETE FROM shopping_items WHERE id = ${id}`
}

export async function replaceShoppingItems(items: Omit<ShoppingItem, 'id' | 'created_at'>[]): Promise<void> {
  const sql = getSQL()
  await sql`DELETE FROM shopping_items`
  for (const item of items) {
    await sql`
      INSERT INTO shopping_items (name, qty, unit, checked)
      VALUES (${item.name}, ${item.qty}, ${item.unit}, ${item.checked})
    `
  }
}

// ── Master Shopping List ──────────────────────────────

export async function getMasterShoppingItems(): Promise<MasterShoppingItem[]> {
  const sql = getSQL()
  const rows = await sql`SELECT * FROM master_shopping_items ORDER BY category, name`
  return rows as MasterShoppingItem[]
}

export async function upsertMasterShoppingItem(
  name: string,
  category: MasterShoppingItem['category'],
  store: MasterShoppingItem['store']
): Promise<MasterShoppingItem> {
  const sql = getSQL()
  const rows = await sql`
    INSERT INTO master_shopping_items (name, category, store)
    VALUES (${name}, ${category}, ${store})
    ON CONFLICT (name) DO UPDATE SET category = ${category}, store = ${store}, updated_at = NOW()
    RETURNING *
  `
  return rows[0] as MasterShoppingItem
}

export async function updateMasterItemStore(id: number, store: MasterShoppingItem['store']): Promise<void> {
  const sql = getSQL()
  await sql`UPDATE master_shopping_items SET store = ${store}, updated_at = NOW() WHERE id = ${id}`
}

export async function addToMasterList(name: string, category: MasterShoppingItem['category']): Promise<void> {
  const sql = getSQL()
  await sql`
    INSERT INTO master_shopping_items (name, category, store)
    VALUES (${name}, ${category}, '')
    ON CONFLICT (name) DO NOTHING
  `
}
