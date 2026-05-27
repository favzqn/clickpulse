CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.sites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  tracking_key TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE NOT NULL,
  visitor_id TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  page_count INT DEFAULT 0,
  device_type TEXT,
  viewport_width INT,
  viewport_height INT,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.page_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  path TEXT NOT NULL,
  referrer TEXT,
  viewport_width INT,
  viewport_height INT,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ
);

CREATE TABLE public.click_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  page_view_id UUID REFERENCES public.page_views(id) ON DELETE CASCADE NOT NULL,
  x FLOAT NOT NULL,
  y FLOAT NOT NULL,
  element_tag TEXT,
  element_class TEXT,
  element_id TEXT,
  element_text TEXT,
  is_rage_click BOOLEAN DEFAULT false,
  is_dead_click BOOLEAN DEFAULT false,
  timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.scroll_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  page_view_id UUID REFERENCES public.page_views(id) ON DELETE CASCADE NOT NULL,
  scroll_depth_percent FLOAT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  status TEXT DEFAULT 'active',
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sites_user ON public.sites(user_id);
CREATE INDEX idx_sites_tracking_key ON public.sites(tracking_key);
CREATE INDEX idx_sessions_site ON public.sessions(site_id, started_at DESC);
CREATE INDEX idx_sessions_visitor ON public.sessions(site_id, visitor_id);
CREATE INDEX idx_page_views_session ON public.page_views(session_id, started_at);
CREATE INDEX idx_page_views_path ON public.page_views(path, started_at DESC);
CREATE INDEX idx_click_events_page ON public.click_events(page_view_id, timestamp);
CREATE INDEX idx_click_events_coords ON public.click_events(page_view_id, x, y);
CREATE INDEX idx_scroll_events_page ON public.scroll_events(page_view_id, timestamp);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.click_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scroll_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own sites" ON public.sites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create sites" ON public.sites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sites" ON public.sites FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sites" ON public.sites FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own sessions" ON public.sessions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.sites WHERE sites.id = sessions.site_id AND sites.user_id = auth.uid())
);

CREATE POLICY "Users can view own page_views" ON public.page_views FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.sessions
    JOIN public.sites ON sites.id = sessions.site_id
    WHERE sessions.id = page_views.session_id AND sites.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view own click_events" ON public.click_events FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.page_views
    JOIN public.sessions ON sessions.id = page_views.session_id
    JOIN public.sites ON sites.id = sessions.site_id
    WHERE page_views.id = click_events.page_view_id AND sites.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view own scroll_events" ON public.scroll_events FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.page_views
    JOIN public.sessions ON sessions.id = page_views.session_id
    JOIN public.sites ON sites.id = sessions.site_id
    WHERE page_views.id = scroll_events.page_view_id AND sites.user_id = auth.uid()
  )
);

CREATE POLICY "Service role full access sessions" ON public.sessions USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access page_views" ON public.page_views USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access click_events" ON public.click_events USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access scroll_events" ON public.scroll_events USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access subscriptions" ON public.subscriptions USING (true) WITH CHECK (true);

CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    COALESCE(new.raw_user_meta_data->>'avatar_url', '')
  );
  INSERT INTO public.subscriptions (user_id, plan) VALUES (new.id, 'free');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
