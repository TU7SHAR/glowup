-- ============================================
-- GlowUp AI - Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── USERS TABLE (extends Supabase auth.users) ───────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  age INTEGER CHECK (age >= 13 AND age <= 120),
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ANALYSES TABLE ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.analyses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL, -- For anonymous users
  
  -- Input data
  age INTEGER NOT NULL CHECK (age >= 13 AND age <= 120),
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  goal TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  photo_path TEXT, -- Supabase storage path
  
  -- Analysis status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- AI Results (stored as JSONB for flexibility)
  strengths JSONB DEFAULT '[]'::jsonb,
  improvements JSONB DEFAULT '[]'::jsonb,
  full_report JSONB DEFAULT '{}'::jsonb,
  ai_preview_url TEXT,
  
  -- Scores
  overall_score NUMERIC(4,2),
  improvement_potential NUMERIC(4,2),
  
  -- Metadata
  ai_model TEXT, -- Which AI model was used
  processing_time_ms INTEGER,
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PAYMENTS TABLE ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE SET NULL,
  session_id TEXT,
  
  -- Razorpay details
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT UNIQUE,
  razorpay_signature TEXT,
  
  -- Payment info
  amount INTEGER NOT NULL, -- Amount in paise (INR smallest unit)
  currency TEXT DEFAULT 'INR',
  plan TEXT NOT NULL CHECK (plan IN ('report', 'coach', 'monthly')),
  status TEXT DEFAULT 'created' CHECK (status IN ('created', 'authorized', 'captured', 'failed', 'refunded')),
  
  -- Metadata
  receipt TEXT,
  notes JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PROGRESS TRACKING TABLE ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.progress_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE,
  
  -- Daily tracking
  day_number INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 30),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Checklist items (JSONB array of completed items)
  checklist JSONB DEFAULT '[]'::jsonb,
  
  -- Selfie comparison (weekly)
  selfie_url TEXT,
  selfie_path TEXT,
  
  -- AI comparison results (weekly)
  comparison_results JSONB,
  
  -- Streak
  streak_count INTEGER DEFAULT 0,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One entry per user per day
  UNIQUE(user_id, date)
);

-- ─── STREAKS TABLE ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.streaks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_check_in DATE,
  total_check_ins INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INDEXES ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_analyses_session_id ON public.analyses(session_id);
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_status ON public.analyses(status);
CREATE INDEX IF NOT EXISTS idx_payments_session_id ON public.payments(session_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order ON public.payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_date ON public.progress_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_streaks_user ON public.streaks(user_id);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only see/edit their own
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Analyses: users can view their own, service role for inserts
CREATE POLICY "Users can view own analyses" ON public.analyses
  FOR SELECT USING (auth.uid() = user_id OR session_id = current_setting('app.session_id', true));
CREATE POLICY "Service role can insert analyses" ON public.analyses
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update analyses" ON public.analyses
  FOR UPDATE USING (true);

-- Payments: users can view own payments
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id OR session_id = current_setting('app.session_id', true));
CREATE POLICY "Service role can manage payments" ON public.payments
  FOR ALL USING (true);

-- Progress: users can manage own progress
CREATE POLICY "Users can view own progress" ON public.progress_entries
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON public.progress_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.progress_entries
  FOR UPDATE USING (auth.uid() = user_id);

-- Streaks: users can view own streaks
CREATE POLICY "Users can view own streaks" ON public.streaks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage streaks" ON public.streaks
  FOR ALL USING (true);

-- ─── FUNCTIONS ───────────────────────────────────────────────

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update streak function
CREATE OR REPLACE FUNCTION public.update_streak(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_last_check_in DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
BEGIN
  SELECT last_check_in, current_streak, longest_streak
  INTO v_last_check_in, v_current_streak, v_longest_streak
  FROM public.streaks
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.streaks (user_id, current_streak, longest_streak, last_check_in, total_check_ins)
    VALUES (p_user_id, 1, 1, CURRENT_DATE, 1);
    RETURN;
  END IF;

  IF v_last_check_in = CURRENT_DATE THEN
    RETURN; -- Already checked in today
  ELSIF v_last_check_in = CURRENT_DATE - INTERVAL '1 day' THEN
    v_current_streak := v_current_streak + 1;
  ELSE
    v_current_streak := 1; -- Streak broken
  END IF;

  IF v_current_streak > v_longest_streak THEN
    v_longest_streak := v_current_streak;
  END IF;

  UPDATE public.streaks
  SET current_streak = v_current_streak,
      longest_streak = v_longest_streak,
      last_check_in = CURRENT_DATE,
      total_check_ins = total_check_ins + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── STORAGE BUCKETS ─────────────────────────────────────────
-- Run these separately in Supabase dashboard or via API:
-- 
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('selfies', 'selfies', false);
-- 
-- INSERT INTO storage.buckets (id, name, public)  
-- VALUES ('previews', 'previews', false);
--
-- Storage policies:
-- CREATE POLICY "Users can upload selfies" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'selfies' AND auth.role() = 'authenticated');
-- CREATE POLICY "Users can view own selfies" ON storage.objects
--   FOR SELECT USING (bucket_id = 'selfies' AND auth.uid()::text = (storage.foldername(name))[1]);
