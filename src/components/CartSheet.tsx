import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function generatePickupCode(): string {
  const random4 = String(Math.floor(1000 + Math.random() * 9000));
  const special4 = String(Math.floor(1000 + Math.random() * 9000));
  return random4 + special4;
}

export default function CartSheet() {
  const { items, updateQuantity, removeItem, clearCart, total, itemCount } = useCart();
  const { user } = useAuth();
  const [placing, setPlacing] = useState(false);
  const navigate = useNavigate();

  const placeOrder = async () => {
    if (!user || items.length === 0) return;
    setPlacing(true);
    try {
      // Stock validation
      const ids = items.map(i => i.id);
      const { data: menuData } = await supabase.from('menu_items').select('id, name, stock_quantity').in('id', ids);
      if (menuData) {
        for (const item of items) {
          const mi = menuData.find((m: any) => m.id === item.id);
          if (!mi) { toast.error(`${item.name} is no longer available`); setPlacing(false); return; }
          if ((mi as any).stock_quantity < item.quantity) {
            toast.error(`Only ${(mi as any).stock_quantity} of ${item.name} available`);
            setPlacing(false);
            return;
          }
        }
      }

      const pickupCode = generatePickupCode();
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({ user_id: user.id, total_amount: total, pickup_code: pickupCode })
        .select()
        .single();
      if (orderErr) throw orderErr;

      const orderItems = items.map(item => ({
        order_id: order.id,
        menu_item_id: item.id,
        item_name: item.name,
        item_price: item.price,
        quantity: item.quantity,
      }));
      const { error: itemsErr } = await supabase.from('order_items').insert(orderItems);
      if (itemsErr) throw itemsErr;

      // Decrement stock via server-side function
      for (const item of items) {
        const { error: stockErr } = await supabase.rpc('decrement_stock', {
          p_item_id: item.id,
          p_quantity: item.quantity,
        });
        if (stockErr) {
          console.error('Stock decrement error:', stockErr.message);
        }
      }

      clearCart();
      toast.success('Order placed!');
      navigate(`/order/${order.id}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="fixed bottom-6 right-6 h-14 w-14 rounded-2xl gradient-primary text-primary-foreground shadow-warm animate-pulse-warm z-50">
          <ShoppingCart className="w-6 h-6" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
              {itemCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-display">Your Cart</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-auto py-4 space-y-3">
          {items.length === 0 && (
            <p className="text-muted-foreground text-center py-8">Your cart is empty</p>
          )}
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <div className="flex-1">
                <p className="font-medium text-sm">{item.name}</p>
                <p className="text-primary text-sm font-semibold">₹{item.price * item.quantity}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="outline" className="h-7 w-7 rounded-lg" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                <Button size="icon" variant="outline" className="h-7 w-7 rounded-lg" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                  <Plus className="w-3 h-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeItem(item.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        {items.length > 0 && (
          <div className="border-t pt-4 space-y-3">
            <div className="flex justify-between font-display text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">₹{total}</span>
            </div>
            <Button className="w-full gradient-primary text-primary-foreground" size="lg" onClick={placeOrder} disabled={placing}>
              {placing ? 'Placing Order...' : 'Place Order'}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
