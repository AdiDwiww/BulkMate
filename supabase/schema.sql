-- BulkMate Database Schema untuk Supabase PostgreSQL
-- Jalankan di Supabase SQL Editor

-- Enable Row Level Security
ALTER DATABASE postgres SET timezone TO 'Asia/Jakarta';

-- ============================================
-- TABLE: profiles
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  age INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female')),
  weight DECIMAL(5,2),
  height INTEGER,
  target_weight DECIMAL(5,2),
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  bmr INTEGER,
  tdee INTEGER,
  daily_calorie_target INTEGER,
  protein_target INTEGER,
  carb_target INTEGER,
  fat_target INTEGER,
  surplus INTEGER DEFAULT 500,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR ALL USING (auth.uid() = id);

-- ============================================
-- TABLE: foods (master database)
-- ============================================
CREATE TABLE IF NOT EXISTS foods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  calories_per_100g DECIMAL(8,2),
  protein_per_100g DECIMAL(6,2),
  carbs_per_100g DECIMAL(6,2),
  fat_per_100g DECIMAL(6,2),
  category TEXT DEFAULT 'general',
  is_indonesian BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: food_logs
-- ============================================
CREATE TABLE IF NOT EXISTS food_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  grams DECIMAL(7,2) DEFAULT 0,
  calories DECIMAL(8,2) DEFAULT 0,
  protein DECIMAL(6,2) DEFAULT 0,
  carbs DECIMAL(6,2) DEFAULT 0,
  fat DECIMAL(6,2) DEFAULT 0,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  is_snack BOOLEAN DEFAULT FALSE,
  from_ai BOOLEAN DEFAULT FALSE,
  log_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own food logs" ON food_logs FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_food_logs_user_date ON food_logs(user_id, log_date);

-- ============================================
-- TABLE: favorite_foods
-- ============================================
CREATE TABLE IF NOT EXISTS favorite_foods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  grams DECIMAL(7,2) DEFAULT 100,
  calories DECIMAL(8,2),
  protein DECIMAL(6,2),
  carbs DECIMAL(6,2),
  fat DECIMAL(6,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE favorite_foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own favorites" ON favorite_foods FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- TABLE: weight_logs
-- ============================================
CREATE TABLE IF NOT EXISTS weight_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  weight DECIMAL(5,2) NOT NULL,
  log_date DATE DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own weight logs" ON weight_logs FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_weight_logs_user_date ON weight_logs(user_id, log_date);

-- ============================================
-- TABLE: expenses
-- ============================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  category TEXT DEFAULT 'meal',
  expense_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own expenses" ON expenses FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_expenses_user_date ON expenses(user_id, expense_date);

-- ============================================
-- TABLE: meal_reminders
-- ============================================
CREATE TABLE IF NOT EXISTS meal_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  reminder_time TIME NOT NULL,
  emoji TEXT DEFAULT '🍽️',
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE meal_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own reminders" ON meal_reminders FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- TABLE: progress_photos
-- ============================================
CREATE TABLE IF NOT EXISTS progress_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  note TEXT,
  photo_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own photos" ON progress_photos FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- TABLE: nutrition_targets
-- ============================================
CREATE TABLE IF NOT EXISTS nutrition_targets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  daily_calorie_target INTEGER NOT NULL,
  protein_target INTEGER,
  carb_target INTEGER,
  fat_target INTEGER,
  surplus INTEGER DEFAULT 500,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE nutrition_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own targets" ON nutrition_targets FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- TABLE: ai_scan_history
-- ============================================
CREATE TABLE IF NOT EXISTS ai_scan_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_url TEXT,
  detected_foods JSONB DEFAULT '[]',
  total_calories DECIMAL(8,2),
  total_protein DECIMAL(6,2),
  confidence_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_scan_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own scan history" ON ai_scan_history FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- TABLE: meal_plans
-- ============================================
CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_date DATE DEFAULT CURRENT_DATE,
  breakfast_data JSONB,
  lunch_data JSONB,
  dinner_data JSONB,
  snack_data JSONB,
  total_calories DECIMAL(8,2),
  total_protein DECIMAL(6,2),
  total_cost DECIMAL(12,2),
  budget DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own meal plans" ON meal_plans FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- TABLE: notifications
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to get daily nutrition summary
CREATE OR REPLACE FUNCTION get_daily_nutrition(p_user_id UUID, p_date DATE)
RETURNS TABLE(
  total_calories DECIMAL,
  total_protein DECIMAL,
  total_carbs DECIMAL,
  total_fat DECIMAL,
  log_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(calories), 0),
    COALESCE(SUM(protein), 0),
    COALESCE(SUM(carbs), 0),
    COALESCE(SUM(fat), 0),
    COUNT(*)::INTEGER
  FROM food_logs
  WHERE user_id = p_user_id AND log_date = p_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SEED: Indonesian Food Database
-- ============================================
INSERT INTO foods (name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, category, is_indonesian)
VALUES
  ('Nasi Putih', 130, 2.7, 28.6, 0.3, 'carbs', true),
  ('Nasi Merah', 111, 2.6, 23, 0.9, 'carbs', true),
  ('Ayam Goreng', 193, 23.4, 0, 10.9, 'protein', true),
  ('Ayam Bakar', 120, 22, 0, 3.5, 'protein', true),
  ('Daging Sapi', 187, 26, 0, 9, 'protein', false),
  ('Ikan Goreng', 189, 22, 0, 11, 'protein', true),
  ('Telur Rebus', 155, 13, 1.1, 11, 'protein', false),
  ('Telur Goreng', 196, 14, 0.4, 15, 'protein', false),
  ('Tempe Goreng', 281, 20, 13.7, 18, 'protein', true),
  ('Tahu Goreng', 120, 8, 5, 7, 'protein', true),
  ('Susu UHT Full Cream', 67, 3.4, 5, 3.8, 'dairy', false),
  ('Roti Tawar', 265, 9, 49, 3.3, 'carbs', false),
  ('Mie Instan', 436, 9.3, 62, 16.5, 'carbs', true),
  ('Pisang', 89, 1.1, 23, 0.3, 'fruit', true),
  ('Alpukat', 160, 2, 9, 15, 'fruit', true),
  ('Oatmeal', 389, 17, 66, 7, 'carbs', false),
  ('Kacang Tanah', 567, 26, 16, 49, 'nuts', true),
  ('Rendang Sapi', 261, 24, 8, 15, 'protein', true)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE profiles IS 'Profil pengguna BulkMate';
COMMENT ON TABLE food_logs IS 'Log makanan harian pengguna';
COMMENT ON TABLE weight_logs IS 'Log berat badan pengguna';
COMMENT ON TABLE expenses IS 'Pengeluaran makanan pengguna';
COMMENT ON TABLE meal_reminders IS 'Pengingat waktu makan';
COMMENT ON TABLE progress_photos IS 'Foto progress bulking';
COMMENT ON TABLE ai_scan_history IS 'Riwayat scan makanan dengan AI';
COMMENT ON TABLE meal_plans IS 'Rencana makan harian yang dibuat AI';
