import { Plus, Minus } from 'lucide-react';
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
  const { items, addItem, updateQuantity } = useCart();
  const cartItem = items.find(i => i.id === id);
  const quantity = cartItem?.quantity || 0;

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
      {quantity === 0 ? (
        <Button
          size="sm"
          className="shrink-0 gradient-primary text-primary-foreground rounded-xl px-5 h-9"
          onClick={() => addItem({ id, name, price })}
        >
          ADD
        </Button>
      ) : (
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 rounded-lg border-primary text-primary"
            onClick={() => updateQuantity(id, quantity - 1)}
          >
            <Minus className="w-3.5 h-3.5" />
          </Button>
          <span className="w-7 text-center font-semibold text-sm">{quantity}</span>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 rounded-lg border-primary text-primary"
            onClick={() => updateQuantity(id, quantity + 1)}
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </motion.div>
  );
}
