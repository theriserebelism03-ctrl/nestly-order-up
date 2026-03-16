
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('student', 'chef', 'admin');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student'));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Menu items table
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  category TEXT NOT NULL DEFAULT 'Main',
  description TEXT,
  image_url TEXT,
  available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view menu" ON public.menu_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage menu" ON public.menu_items FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number SERIAL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  total_amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'placed' CHECK (status IN ('placed', 'preparing', 'ready', 'picked_up')),
  pickup_code TEXT NOT NULL,
  nest_number INTEGER CHECK (nest_number >= 1 AND nest_number <= 16),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Students can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Chefs can view all orders" ON public.orders FOR SELECT USING (public.has_role(auth.uid(), 'chef'));
CREATE POLICY "Chefs can update orders" ON public.orders FOR UPDATE USING (public.has_role(auth.uid(), 'chef'));
CREATE POLICY "Admins can do anything with orders" ON public.orders FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Order items
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  menu_item_id UUID REFERENCES public.menu_items(id) NOT NULL,
  item_name TEXT NOT NULL,
  item_price INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Users can insert own order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Chefs can view order items" ON public.order_items FOR SELECT USING (public.has_role(auth.uid(), 'chef'));
CREATE POLICY "Admins can do anything with order items" ON public.order_items FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Nests table
CREATE TABLE public.nests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nest_number INTEGER NOT NULL UNIQUE CHECK (nest_number >= 1 AND nest_number <= 16),
  current_order_id UUID REFERENCES public.orders(id),
  is_occupied BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.nests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view nests" ON public.nests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Chefs can update nests" ON public.nests FOR UPDATE USING (public.has_role(auth.uid(), 'chef'));
CREATE POLICY "Admins can manage nests" ON public.nests FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Insert 16 nests
INSERT INTO public.nests (nest_number) VALUES
  (1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11),(12),(13),(14),(15),(16);

-- Insert sample menu items
INSERT INTO public.menu_items (name, price, category, description) VALUES
  ('Fried Rice', 120, 'Main', 'Delicious vegetable fried rice'),
  ('Coke', 40, 'Beverages', 'Chilled Coca-Cola 300ml'),
  ('Samosa', 10, 'Snacks', 'Crispy potato samosa'),
  ('Noodles', 100, 'Main', 'Spicy Hakka noodles'),
  ('Butter Chicken', 180, 'Main', 'Rich and creamy butter chicken'),
  ('Masala Dosa', 80, 'Main', 'Crispy dosa with potato filling'),
  ('Chai', 20, 'Beverages', 'Hot masala chai'),
  ('Vada Pav', 30, 'Snacks', 'Mumbai style vada pav');

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_nests_updated_at BEFORE UPDATE ON public.nests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for orders and nests
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.nests;
