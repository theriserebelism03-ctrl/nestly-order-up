import { Plus, Minus, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { motion } from 'framer-motion';

interface MenuCardProps {
  id: string;
  name: string;
  price: number;
  description: string | null;
  category: string;
  image_url?: string | null;
  stock_quantity: number;
}

export default function MenuCard({ id, name, price, description, category, image_url, stock_quantity }: MenuCardProps) {
  const { items, addItem, updateQuantity } = useCart();
  const cartItem = items.find(i => i.id === id);
  const quantity = cartItem?.quantity || 0;
  const outOfStock = stock_quantity <= 0;
  const maxReached = quantity >= stock_quantity;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass rounded-xl overflow-hidden flex items-stretch hover:shadow-warm transition-shadow ${outOfStock ? 'opacity-60' : ''}`}
    >
      {image_url ? (
        <img src={image_url} alt={name} className="w-20 h-20 object-cover shrink-0" />
      ) : (
        <div className="w-20 h-20 bg-muted flex items-center justify-center shrink-0">
          <ImageIcon className="w-6 h-6 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0 p-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-sm truncate">{name}</h3>
          {description && <p className="text-xs text-muted-foreground truncate">{description}</p>}
          <p className="text-primary font-semibold text-sm mt-0.5">₹{price}</p>
          {outOfStock && <p className="text-destructive text-xs font-bold">OUT OF STOCK</p>}
          {!outOfStock && stock_quantity <= 5 && <p className="text-warning text-xs font-medium">Only {stock_quantity} left</p>}
        </div>
        {outOfStock ? (
          <Button size="sm" disabled className="shrink-0 rounded-xl px-5 h-9 opacity-50">
            ADD
          </Button>
        ) : quantity === 0 ? (
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
              disabled={maxReached}
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
