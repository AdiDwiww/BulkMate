// Utility functions untuk BulkMate

// Hitung BMR (Basal Metabolic Rate) menggunakan formula Mifflin-St Jeor
export function calculateBMR(gender, weight, height, age) {
  if (gender === 'male') {
    return Math.round((10 * weight) + (6.25 * height) - (5 * age) + 5)
  } else {
    return Math.round((10 * weight) + (6.25 * height) - (5 * age) - 161)
  }
}

// Activity multipliers
export const ACTIVITY_LEVELS = {
  sedentary: { label: 'Tidak Aktif (Kerja kantoran)', multiplier: 1.2 },
  light: { label: 'Sedikit Aktif (Olahraga 1-3x/minggu)', multiplier: 1.375 },
  moderate: { label: 'Cukup Aktif (Olahraga 3-5x/minggu)', multiplier: 1.55 },
  active: { label: 'Sangat Aktif (Olahraga 6-7x/minggu)', multiplier: 1.725 },
  very_active: { label: 'Ekstra Aktif (Fisik berat/2x sehari)', multiplier: 1.9 },
}

// Hitung TDEE (Total Daily Energy Expenditure)
export function calculateTDEE(bmr, activityLevel) {
  const multiplier = ACTIVITY_LEVELS[activityLevel]?.multiplier || 1.55
  return Math.round(bmr * multiplier)
}

// Hitung target protein (2g per kg berat badan)
export function calculateProteinTarget(weight) {
  return Math.round(weight * 2)
}

// Format kalori
export function formatCalories(cal) {
  return Math.round(cal).toLocaleString('id-ID')
}

// Format currency IDR
export function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Format tanggal Indonesia
export function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Format tanggal pendek
export function formatDateShort(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
  })
}

// Hitung total nutrisi dari log makanan
export function calculateTotals(logs, date) {
  const todayLogs = logs.filter(l => l.date === date)
  return todayLogs.reduce((acc, log) => ({
    calories: acc.calories + (log.calories || 0),
    protein: acc.protein + (log.protein || 0),
    carbs: acc.carbs + (log.carbs || 0),
    fat: acc.fat + (log.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
}

// Estimasi waktu mencapai target berat (1 kg = 7700 kalori)
export function estimateTimeToTarget(currentWeight, targetWeight, dailySurplus) {
  const weightDiff = targetWeight - currentWeight
  if (weightDiff <= 0) return 0
  const totalCaloriesNeeded = weightDiff * 7700
  const daysNeeded = Math.round(totalCaloriesNeeded / dailySurplus)
  return daysNeeded
}

// Kategorikan BMI
export function categorizeBMI(weight, height) {
  const bmi = weight / ((height / 100) ** 2)
  if (bmi < 18.5) return { label: 'Kurus', color: '#3b82f6', bmi: bmi.toFixed(1) }
  if (bmi < 25) return { label: 'Normal', color: '#22c55e', bmi: bmi.toFixed(1) }
  if (bmi < 30) return { label: 'Gemuk', color: '#f97316', bmi: bmi.toFixed(1) }
  return { label: 'Obesitas', color: '#ef4444', bmi: bmi.toFixed(1) }
}

// Get warna berdasarkan persentase
export function getProgressColor(percentage) {
  if (percentage < 50) return '#ef4444'
  if (percentage < 80) return '#f97316'
  if (percentage <= 100) return '#22c55e'
  return '#a855f7'
}

// Get greeting berdasarkan waktu
export function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Selamat Pagi'
  if (hour < 15) return 'Selamat Siang'
  if (hour < 18) return 'Selamat Sore'
  return 'Selamat Malam'
}

// Meal types
export const MEAL_TYPES = {
  breakfast: { label: 'Sarapan', emoji: '🌅', color: '#f97316' },
  lunch: { label: 'Makan Siang', emoji: '☀️', color: '#22c55e' },
  dinner: { label: 'Makan Malam', emoji: '🌙', color: '#3b82f6' },
  snack: { label: 'Snack', emoji: '🍪', color: '#a855f7' },
}

// Database makanan Indonesia (lokasi)
export const FOOD_DATABASE = [
  { name: 'Nasi Putih', per100g: { calories: 130, protein: 2.7, carbs: 28.6, fat: 0.3 } },
  { name: 'Nasi Merah', per100g: { calories: 111, protein: 2.6, carbs: 23, fat: 0.9 } },
  { name: 'Nasi Goreng', per100g: { calories: 163, protein: 4.5, carbs: 27, fat: 4.5 } },
  { name: 'Ayam Goreng', per100g: { calories: 193, protein: 23.4, carbs: 0, fat: 10.9 } },
  { name: 'Ayam Rebus', per100g: { calories: 120, protein: 22, carbs: 0, fat: 3.5 } },
  { name: 'Daging Sapi', per100g: { calories: 187, protein: 26, carbs: 0, fat: 9 } },
  { name: 'Ikan Goreng', per100g: { calories: 189, protein: 22, carbs: 0, fat: 11 } },
  { name: 'Ikan Bakar', per100g: { calories: 148, protein: 22, carbs: 0, fat: 6.5 } },
  { name: 'Telur Rebus', per100g: { calories: 155, protein: 13, carbs: 1.1, fat: 11 } },
  { name: 'Telur Goreng', per100g: { calories: 196, protein: 14, carbs: 0.4, fat: 15 } },
  { name: 'Telur Dadar', per100g: { calories: 185, protein: 13, carbs: 1, fat: 14.5 } },
  { name: 'Tempe Goreng', per100g: { calories: 281, protein: 20, carbs: 13.7, fat: 18 } },
  { name: 'Tahu Goreng', per100g: { calories: 120, protein: 8, carbs: 5, fat: 7 } },
  { name: 'Susu UHT Full Cream (250ml)', per100g: { calories: 67, protein: 3.4, carbs: 5, fat: 3.8 } },
  { name: 'Susu Kental Manis', per100g: { calories: 321, protein: 7.9, carbs: 55, fat: 8.5 } },
  { name: 'Roti Tawar', per100g: { calories: 265, protein: 9, carbs: 49, fat: 3.3 } },
  { name: 'Mie Instan', per100g: { calories: 436, protein: 9.3, carbs: 62, fat: 16.5 } },
  { name: 'Pisang', per100g: { calories: 89, protein: 1.1, carbs: 23, fat: 0.3 } },
  { name: 'Alpukat', per100g: { calories: 160, protein: 2, carbs: 9, fat: 15 } },
  { name: 'Mangga', per100g: { calories: 60, protein: 0.8, carbs: 15, fat: 0.4 } },
  { name: 'Semangka', per100g: { calories: 30, protein: 0.6, carbs: 7.5, fat: 0.2 } },
  { name: 'Bayam', per100g: { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 } },
  { name: 'Kangkung', per100g: { calories: 19, protein: 2.6, carbs: 1.8, fat: 0.4 } },
  { name: 'Singkong', per100g: { calories: 160, protein: 1.4, carbs: 38, fat: 0.3 } },
  { name: 'Kentang', per100g: { calories: 77, protein: 2, carbs: 17, fat: 0.1 } },
  { name: 'Bakso', per100g: { calories: 198, protein: 9, carbs: 21, fat: 9 } },
  { name: 'Soto Ayam (semangkuk)', per100g: { calories: 85, protein: 8, carbs: 6, fat: 3 } },
  { name: 'Gado-Gado', per100g: { calories: 120, protein: 6, carbs: 10, fat: 7 } },
  { name: 'Rendang', per100g: { calories: 261, protein: 24, carbs: 8, fat: 15 } },
  { name: 'Sate Ayam (1 tusuk)', per100g: { calories: 48, protein: 5.5, carbs: 1, fat: 2.5 } },
  { name: 'Kerupuk', per100g: { calories: 396, protein: 5, carbs: 82, fat: 5 } },
  { name: 'Kacang Tanah', per100g: { calories: 567, protein: 26, carbs: 16, fat: 49 } },
  { name: 'Oat/Oatmeal', per100g: { calories: 389, protein: 17, carbs: 66, fat: 7 } },
  { name: 'Peanut Butter', per100g: { calories: 598, protein: 22, carbs: 18, fat: 51 } },
  { name: 'Keju', per100g: { calories: 402, protein: 25, carbs: 1.3, fat: 33 } },
  { name: 'Yoghurt Plain', per100g: { calories: 61, protein: 3.5, carbs: 5, fat: 3.3 } },
]

// Favorite foods default
export const DEFAULT_FAVORITES = [
  { name: 'Nasi Putih 200g', calories: 260, protein: 5, carbs: 57, fat: 0.6, grams: 200 },
  { name: 'Ayam Goreng 100g', calories: 193, protein: 23, carbs: 0, fat: 11, grams: 100 },
  { name: 'Telur Rebus 1 butir', calories: 78, protein: 6.5, carbs: 0.6, fat: 5.5, grams: 50 },
  { name: 'Susu UHT 250ml', calories: 168, protein: 8.5, carbs: 12.5, fat: 9.5, grams: 250 },
  { name: 'Pisang 1 buah', calories: 107, protein: 1.3, carbs: 27, fat: 0.4, grams: 120 },
  { name: 'Roti Tawar 2 lembar', calories: 159, protein: 5.4, carbs: 29, fat: 2, grams: 60 },
  { name: 'Oatmeal 50g', calories: 195, protein: 8.5, carbs: 33, fat: 3.5, grams: 50 },
  { name: 'Tempe Goreng 100g', calories: 281, protein: 20, carbs: 14, fat: 18, grams: 100 },
]

// Snack/jajan populer Indonesia
export const POPULAR_SNACKS = [
  { name: 'Es Teh Manis', calories: 80, protein: 0.1, carbs: 20, fat: 0 },
  { name: 'Kopi Susu', calories: 120, protein: 3, carbs: 18, fat: 4 },
  { name: 'Burger', calories: 350, protein: 18, carbs: 38, fat: 15 },
  { name: 'Martabak Manis', calories: 420, protein: 10, carbs: 58, fat: 18 },
  { name: 'Gorengan (2 pcs)', calories: 160, protein: 3, carbs: 22, fat: 7 },
  { name: 'Mie Ayam', calories: 380, protein: 15, carbs: 55, fat: 10 },
  { name: 'Bakso 1 mangkuk', calories: 280, protein: 18, carbs: 32, fat: 8 },
  { name: 'Indomie Goreng', calories: 436, protein: 9, carbs: 62, fat: 17 },
  { name: 'Batagor (5 pcs)', calories: 320, protein: 12, carbs: 35, fat: 15 },
  { name: 'Siomay', calories: 280, protein: 15, carbs: 25, fat: 12 },
  { name: 'Dimsum 3 pcs', calories: 210, protein: 12, carbs: 22, fat: 8 },
  { name: 'Bubble Tea', calories: 300, protein: 3, carbs: 60, fat: 5 },
]

// Rekomendasi makanan untuk bulking
export const BULKING_FOODS = [
  { name: 'Susu 1 gelas (250ml)', calories: 168, protein: 8.5 },
  { name: 'Pisang 1 buah', calories: 107, protein: 1.3 },
  { name: 'Roti 2 lembar', calories: 159, protein: 5 },
  { name: 'Telur rebus 1 butir', calories: 78, protein: 6.5 },
  { name: 'Kacang tanah 30g', calories: 170, protein: 7.8 },
  { name: 'Tempe 100g', calories: 193, protein: 20 },
  { name: 'Oatmeal 50g', calories: 195, protein: 8.5 },
  { name: 'Peanut butter 2 sdm', calories: 190, protein: 7 },
  { name: 'Nasi 1 centong (150g)', calories: 195, protein: 4 },
  { name: 'Yoghurt 100g', calories: 61, protein: 3.5 },
]
