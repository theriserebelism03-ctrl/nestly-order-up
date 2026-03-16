import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { motion } from 'framer-motion';

interface MenuCardProps {
  id: string;
  name: string;
  price: number;
  description: string | null;
  category: string;
}

const categoryEmoji: Record<string, string> = {
  Main: '🍛',
  Beverages: '🥤',
  Snacks: '🍟',
};

export default function MenuCard({ id, name, price, description, category }: MenuCardProps) {
  const { addItem } = useCart();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-4 flex items-center gap-4 hover:shadow-warm transition-shadow"
    >
      <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center text-2xl shrink-0">
        {categoryEmoji[category] || '🍽️'}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-display font-semibold text-sm truncate">{name}</h3>
        {description && <p className="text-xs text-muted-foreground truncate">{description}</p>}
        <p className="text-primary font-semibold text-sm mt-1">₹{price}</p>
      </div>
      <Button
        size="icon"
        className="shrink-0 gradient-primary text-primary-foreground rounded-xl h-10 w-10"
        onClick={() => addItem({ id, name, price })}
      >
        <Plus className="w-5 h-5" />
      </Button>
    </motion.div>
  );
}
