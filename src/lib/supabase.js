import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials tidak ditemukan. Running in local-only mode.')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
)

// Helper: cek apakah Supabase terkonfigurasi
export const isSupabaseConfigured = () =>
  Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder'))

// =====================================================
// AUTH HELPERS
// =====================================================

export async function signUp(email, password, name) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  })
  return { data, error }
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// =====================================================
// PROFILE
// =====================================================

export async function upsertProfile(userId, profile) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...profile, updated_at: new Date().toISOString() })
    .select()
    .single()
  return { data, error }
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

// =====================================================
// FOOD LOGS
// =====================================================

export async function addFoodLog(userId, log) {
  const { data, error } = await supabase
    .from('food_logs')
    .insert({
      user_id: userId,
      name: log.name,
      grams: log.grams || 0,
      calories: log.calories || 0,
      protein: log.protein || 0,
      carbs: log.carbs || 0,
      fat: log.fat || 0,
      meal_type: log.meal_type,
      is_snack: log.is_snack || false,
      from_ai: log.from_ai || false,
      log_date: log.date,
    })
    .select()
    .single()
  return { data, error }
}

export async function getFoodLogs(userId, date) {
  const { data, error } = await supabase
    .from('food_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('log_date', date)
    .order('created_at', { ascending: true })
  return { data, error }
}

export async function deleteFoodLog(id) {
  const { error } = await supabase.from('food_logs').delete().eq('id', id)
  return { error }
}

// =====================================================
// WEIGHT LOGS
// =====================================================

export async function addWeightLog(userId, log) {
  const { data, error } = await supabase
    .from('weight_logs')
    .insert({
      user_id: userId,
      weight: log.weight,
      log_date: log.date,
      note: log.note || null,
    })
    .select()
    .single()
  return { data, error }
}

export async function getWeightLogs(userId) {
  const { data, error } = await supabase
    .from('weight_logs')
    .select('*')
    .eq('user_id', userId)
    .order('log_date', { ascending: true })
  return { data, error }
}

// =====================================================
// EXPENSES
// =====================================================

export async function addExpense(userId, expense) {
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      user_id: userId,
      name: expense.name,
      amount: expense.amount,
      category: expense.category || 'meal',
      expense_date: expense.date,
    })
    .select()
    .single()
  return { data, error }
}

export async function getExpenses(userId) {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .order('expense_date', { ascending: false })
  return { data, error }
}

export async function deleteExpense(id) {
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  return { error }
}

// =====================================================
// FAVORITES
// =====================================================

export async function addFavoriteFood(userId, food) {
  const { data, error } = await supabase
    .from('favorite_foods')
    .insert({ user_id: userId, ...food })
    .select()
    .single()
  return { data, error }
}

export async function getFavoriteFoods(userId) {
  const { data, error } = await supabase
    .from('favorite_foods')
    .select('*')
    .eq('user_id', userId)
  return { data, error }
}

export async function deleteFavoriteFood(id) {
  const { error } = await supabase.from('favorite_foods').delete().eq('id', id)
  return { error }
}

// =====================================================
// AI SCAN HISTORY
// =====================================================

export async function saveAIScanHistory(userId, scanData) {
  const { data, error } = await supabase
    .from('ai_scan_history')
    .insert({
      user_id: userId,
      detected_foods: scanData.foods,
      total_calories: scanData.totalCalories,
      total_protein: scanData.totalProtein,
      confidence_score: scanData.confidence,
    })
    .select()
    .single()
  return { data, error }
}

// =====================================================
// MEAL PLANS
// =====================================================

export async function saveMealPlan(userId, plan) {
  const { data, error } = await supabase
    .from('meal_plans')
    .insert({
      user_id: userId,
      plan_date: plan.date,
      breakfast_data: plan.breakfast,
      lunch_data: plan.lunch,
      dinner_data: plan.dinner,
      snack_data: plan.snack,
      total_calories: plan.totalCals,
      total_protein: plan.totalProtein,
      total_cost: plan.totalCost,
      budget: plan.budget,
    })
    .select()
    .single()
  return { data, error }
}
