// Context untuk state management global BulkMate
import { createContext, useContext, useReducer, useEffect } from 'react'
import { supabase, isSupabaseConfigured, upsertProfile, addFoodLog, addWeightLog, addExpense } from '../lib/supabase'

const AppContext = createContext(null)

function seedDemoData() {
  // Jangan seed jika user sudah onboarding atau sudah ada profile real
  const onboardingDone = localStorage.getItem('bulkmate_onboarding_done')
  if (onboardingDone) return

  const today = new Date().toISOString().split('T')[0]

  if (!localStorage.getItem('bulkmate_user')) {
    const demoUser = { id: 'demo-user-1', email: 'demo@bulkmate.app', name: 'Andi Pratama' }
    localStorage.setItem('bulkmate_user', JSON.stringify(demoUser))
  }

  if (!localStorage.getItem('bulkmate_profile')) {
    const demoProfile = {
      name: 'Andi Pratama', age: 21, gender: 'male', weight: 58, height: 170,
      activity_level: 'moderate', target_weight: 68, daily_calorie_target: 2800,
      protein_target: 140, carb_target: 350, fat_target: 90, surplus: 500, bmr: 1680, tdee: 2300
    }
    localStorage.setItem('bulkmate_profile', JSON.stringify(demoProfile))
    localStorage.setItem('bulkmate_target', JSON.stringify(demoProfile))
  }

  if (!localStorage.getItem('bulkmate_logs')) {
    const demoLogs = [
      { id: '1', date: today, meal_type: 'breakfast', name: 'Nasi Putih', grams: 200, calories: 260, protein: 5.4, carbs: 57.2, fat: 0.6 },
      { id: '2', date: today, meal_type: 'breakfast', name: 'Telur Rebus 2 butir', grams: 100, calories: 155, protein: 13, carbs: 1.1, fat: 11 },
      { id: '3', date: today, meal_type: 'breakfast', name: 'Susu UHT 250ml', grams: 250, calories: 168, protein: 8.5, carbs: 12.5, fat: 9.5 },
      { id: '4', date: today, meal_type: 'lunch', name: 'Nasi Putih', grams: 300, calories: 390, protein: 8.1, carbs: 85.8, fat: 0.9 },
      { id: '5', date: today, meal_type: 'lunch', name: 'Ayam Goreng', grams: 150, calories: 290, protein: 35, carbs: 0, fat: 16 },
      { id: '6', date: today, meal_type: 'snack', name: 'Pisang 2 buah', grams: 240, calories: 214, protein: 2.6, carbs: 55.2, fat: 0.7 },
    ]
    localStorage.setItem('bulkmate_logs', JSON.stringify(demoLogs))
  }

  if (!localStorage.getItem('bulkmate_weights')) {
    const weights = []
    for (let i = 14; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      weights.push({
        id: `w${i}`,
        date: d.toISOString().split('T')[0],
        weight: parseFloat((58 + (14 - i) * 0.07).toFixed(2)),
        note: '',
      })
    }
    localStorage.setItem('bulkmate_weights', JSON.stringify(weights))
  }

  if (!localStorage.getItem('bulkmate_expenses')) {
    const today2 = new Date()
    const expenses = [
      { id: 'e1', name: 'Nasi + Ayam', amount: 18000, category: 'meal', date: today },
      { id: 'e2', name: 'Es Teh Manis', amount: 5000, category: 'drink', date: today },
      { id: 'e3', name: 'Makan Siang Warteg', amount: 20000, category: 'meal', date: today },
    ]
    const y = new Date(today2)
    y.setDate(y.getDate() - 1)
    const yesterday = y.toISOString().split('T')[0]
    expenses.push({ id: 'e4', name: 'Sarapan Nasi Uduk', amount: 15000, category: 'meal', date: yesterday })
    expenses.push({ id: 'e5', name: 'Suplemen Protein', amount: 250000, category: 'supplement', date: yesterday })
    localStorage.setItem('bulkmate_expenses', JSON.stringify(expenses))
  }
}

seedDemoData()

const initialState = {
  theme: localStorage.getItem('theme') || 'light',
  user: JSON.parse(localStorage.getItem('bulkmate_user') || 'null'),
  profile: JSON.parse(localStorage.getItem('bulkmate_profile') || 'null'),
  dailyLogs: JSON.parse(localStorage.getItem('bulkmate_logs') || '[]'),
  weightLogs: JSON.parse(localStorage.getItem('bulkmate_weights') || '[]'),
  favoriteFoods: JSON.parse(localStorage.getItem('bulkmate_favorites') || '[]'),
  expenses: JSON.parse(localStorage.getItem('bulkmate_expenses') || '[]'),
  reminders: JSON.parse(localStorage.getItem('bulkmate_reminders') || '[]'),
  progressPhotos: JSON.parse(localStorage.getItem('bulkmate_photos') || '[]'),
  nutritionTarget: JSON.parse(localStorage.getItem('bulkmate_target') || 'null'),
  mealPlans: JSON.parse(localStorage.getItem('bulkmate_mealplans') || '[]'),
  currentDate: new Date().toISOString().split('T')[0],
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_THEME':
      localStorage.setItem('theme', action.payload)
      return { ...state, theme: action.payload }

    case 'SET_USER':
      localStorage.setItem('bulkmate_user', JSON.stringify(action.payload))
      return { ...state, user: action.payload }

    case 'SET_PROFILE':
      localStorage.setItem('bulkmate_profile', JSON.stringify(action.payload))
      return { ...state, profile: action.payload }

    case 'CLEAR_DEMO_DATA':
      return {
        ...state,
        dailyLogs: [],
        weightLogs: [],
        expenses: [],
        favoriteFoods: [],
        reminders: [],
        progressPhotos: [],
      }

    case 'ADD_FOOD_LOG': {
      const newLogs = [...state.dailyLogs, { ...action.payload, id: Date.now().toString() }]
      localStorage.setItem('bulkmate_logs', JSON.stringify(newLogs))
      return { ...state, dailyLogs: newLogs }
    }

    case 'UPDATE_FOOD_LOG': {
      const updatedLogs = state.dailyLogs.map(l => l.id === action.payload.id ? action.payload : l)
      localStorage.setItem('bulkmate_logs', JSON.stringify(updatedLogs))
      return { ...state, dailyLogs: updatedLogs }
    }

    case 'DELETE_FOOD_LOG': {
      const filteredLogs = state.dailyLogs.filter(l => l.id !== action.payload)
      localStorage.setItem('bulkmate_logs', JSON.stringify(filteredLogs))
      return { ...state, dailyLogs: filteredLogs }
    }

    case 'DELETE_WEIGHT_LOG': {
      const filteredWeights = state.weightLogs.filter(w => w.id !== action.payload)
      localStorage.setItem('bulkmate_weights', JSON.stringify(filteredWeights))
      return { ...state, weightLogs: filteredWeights }
    }

    case 'UPDATE_EXPENSE': {
      const updatedExpenses = state.expenses.map(e => e.id === action.payload.id ? action.payload : e)
      localStorage.setItem('bulkmate_expenses', JSON.stringify(updatedExpenses))
      return { ...state, expenses: updatedExpenses }
    }

    case 'ADD_WEIGHT_LOG': {
      const newWeights = [...state.weightLogs, { ...action.payload, id: Date.now().toString() }]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
      localStorage.setItem('bulkmate_weights', JSON.stringify(newWeights))
      return { ...state, weightLogs: newWeights }
    }

    case 'ADD_FAVORITE': {
      const newFavs = [...state.favoriteFoods, { ...action.payload, id: Date.now().toString() }]
      localStorage.setItem('bulkmate_favorites', JSON.stringify(newFavs))
      return { ...state, favoriteFoods: newFavs }
    }

    case 'DELETE_FAVORITE': {
      const filteredFavs = state.favoriteFoods.filter(f => f.id !== action.payload)
      localStorage.setItem('bulkmate_favorites', JSON.stringify(filteredFavs))
      return { ...state, favoriteFoods: filteredFavs }
    }

    case 'ADD_EXPENSE': {
      const newExpenses = [...state.expenses, { ...action.payload, id: Date.now().toString() }]
      localStorage.setItem('bulkmate_expenses', JSON.stringify(newExpenses))
      return { ...state, expenses: newExpenses }
    }

    case 'DELETE_EXPENSE': {
      const filteredExpenses = state.expenses.filter(e => e.id !== action.payload)
      localStorage.setItem('bulkmate_expenses', JSON.stringify(filteredExpenses))
      return { ...state, expenses: filteredExpenses }
    }

    case 'SET_REMINDERS': {
      localStorage.setItem('bulkmate_reminders', JSON.stringify(action.payload))
      return { ...state, reminders: action.payload }
    }

    case 'ADD_REMINDER': {
      const newReminders = [...state.reminders, { ...action.payload, id: Date.now().toString() }]
      localStorage.setItem('bulkmate_reminders', JSON.stringify(newReminders))
      return { ...state, reminders: newReminders }
    }

    case 'DELETE_REMINDER': {
      const filteredReminders = state.reminders.filter(r => r.id !== action.payload)
      localStorage.setItem('bulkmate_reminders', JSON.stringify(filteredReminders))
      return { ...state, reminders: filteredReminders }
    }

    case 'ADD_PROGRESS_PHOTO': {
      const newPhotos = [...state.progressPhotos, { ...action.payload, id: Date.now().toString() }]
      localStorage.setItem('bulkmate_photos', JSON.stringify(newPhotos))
      return { ...state, progressPhotos: newPhotos }
    }

    case 'DELETE_PROGRESS_PHOTO': {
      const filteredPhotos = state.progressPhotos.filter(p => p.id !== action.payload)
      localStorage.setItem('bulkmate_photos', JSON.stringify(filteredPhotos))
      return { ...state, progressPhotos: filteredPhotos }
    }

    case 'SET_NUTRITION_TARGET':
      localStorage.setItem('bulkmate_target', JSON.stringify(action.payload))
      return { ...state, nutritionTarget: action.payload }

    case 'ADD_MEAL_PLAN': {
      const newPlans = [...state.mealPlans, { ...action.payload, id: Date.now().toString() }]
      localStorage.setItem('bulkmate_mealplans', JSON.stringify(newPlans))
      return { ...state, mealPlans: newPlans }
    }

    case 'SET_DATE':
      return { ...state, currentDate: action.payload }

    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Theme sync
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme)
  }, [state.theme])

  // Supabase Auth Listener
  useEffect(() => {
    if (!isSupabaseConfigured()) return

    // Cek session yang sudah ada
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        dispatch({
          type: 'SET_USER',
          payload: {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || session.user.email,
          }
        })
      }
    })

    // Listen perubahan auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const userData = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || session.user.email,
          }
          dispatch({ type: 'SET_USER', payload: userData })

          // Sync profile ke Supabase
          if (state.profile) {
            await upsertProfile(session.user.id, state.profile).catch(console.error)
          }
        } else if (event === 'SIGNED_OUT') {
          dispatch({ type: 'SET_USER', payload: null })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Helper: sync action ke Supabase di background
  const dispatchWithSync = async (action) => {
    dispatch(action)

    if (!isSupabaseConfigured() || !state.user?.id || state.user.id === 'demo-user-1') return

    try {
      const userId = state.user.id
      if (action.type === 'ADD_FOOD_LOG') {
        await addFoodLog(userId, action.payload)
      } else if (action.type === 'ADD_WEIGHT_LOG') {
        await addWeightLog(userId, action.payload)
      } else if (action.type === 'ADD_EXPENSE') {
        await addExpense(userId, action.payload)
      } else if (action.type === 'SET_PROFILE') {
        await upsertProfile(userId, action.payload)
      }
    } catch (err) {
      console.warn('Supabase sync error (data saved locally):', err.message)
    }
  }

  return (
    <AppContext.Provider value={{ state, dispatch: dispatchWithSync }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
