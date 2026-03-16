import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Order = Tables<'orders'>;

const statusColors: Record<string, string> = {
  placed: 'bg-info text-info-foreground',
  preparing: 'bg-warning text-warning-foreground',
  ready: 'bg-success text-success-foreground',
  picked_up: 'bg-muted text-muted-foreground',
};

export default function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setOrders(data);
    });

    const channel = supabase
      .channel('my-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
        () => {
          supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data }) => {
            if (data) setOrders(data);
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <div className="min-h-screen bg-background p-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>
      <h1 className="font-display text-xl font-bold mb-4">My Orders</h1>
      <div className="space-y-3">
        {orders.map(order => (
          <div
            key={order.id}
            className="glass rounded-xl p-4 cursor-pointer hover:shadow-warm transition-shadow"
            onClick={() => navigate(`/order/${order.id}`)}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-display font-bold">#{order.order_number}</p>
                <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
              </div>
              <div className="text-right space-y-1">
                <Badge className={statusColors[order.status] || ''}>{order.status}</Badge>
                <p className="text-primary font-semibold text-sm">₹{order.total_amount}</p>
              </div>
            </div>
            {order.nest_number && (
              <p className="text-xs text-success mt-2">📍 Nest {String(order.nest_number).padStart(2, '0')}</p>
            )}
          </div>
        ))}
        {orders.length === 0 && <p className="text-muted-foreground text-center py-8">No orders yet</p>}
      </div>
    </div>
  );
}
