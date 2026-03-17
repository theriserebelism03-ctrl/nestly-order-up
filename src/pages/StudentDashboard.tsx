import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import MenuCard from '@/components/MenuCard';
import CartSheet from '@/components/CartSheet';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, User, LogOut, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type MenuItem = Tables<'menu_items'>;

const categories = ['All', 'Main', 'Snacks', 'Beverages'];

export default function StudentDashboard() {
  const { profile, user, signOut } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from('menu_items').select('*').eq('available', true).then(({ data }) => {
      if (data) setMenuItems(data);
    });
  }, []);

  const filtered = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-primary px-4 pt-6 pb-8 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <User className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-primary-foreground/70 text-xs">Welcome back,</p>
              <p className="text-primary-foreground font-display font-bold">{profile?.full_name || 'Student'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10" onClick={() => navigate('/my-orders')}>
              <ClipboardList className="w-5 h-5" />
            </Button>
            <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10" onClick={signOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search food..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-background border-none rounded-xl h-11"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 px-4 py-4 overflow-x-auto">
        {categories.map(cat => (
          <Badge
            key={cat}
            variant={activeCategory === cat ? 'default' : 'outline'}
            className={`cursor-pointer shrink-0 px-4 py-1.5 rounded-full ${
              activeCategory === cat ? 'gradient-primary text-primary-foreground border-none' : ''
            }`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </Badge>
        ))}
      </div>

      {/* Menu */}
      <div className="px-4 space-y-3">
        <h2 className="font-display font-bold text-lg">
          {activeCategory === 'All' ? 'Popular Items' : activeCategory}
        </h2>
        {filtered.map(item => (
          <MenuCard key={item.id} id={item.id} name={item.name} price={item.price} description={item.description} category={item.category} />
        ))}
        {filtered.length === 0 && (
          <p className="text-muted-foreground text-center py-8">No items found</p>
        )}
      </div>

      <CartSheet />
    </div>
  );
}
