import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowLeft, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';
import { motion } from 'framer-motion';

type Order = Tables<'orders'>;
type OrderItem = Tables<'order_items'>;

export default function OrderSuccess() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const { profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    supabase.from('orders').select('*').eq('id', id).single().then(({ data }) => {
      if (data) setOrder(data);
    });
    supabase.from('order_items').select('*').eq('order_id', id).then(({ data }) => {
      if (data) setItems(data);
    });

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`order-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        (payload) => { setOrder(payload.new as Order); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  if (!order) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;

  const qrData = JSON.stringify({
    orderId: order.id,
    orderNumber: order.order_number,
    items: items.map(i => `${i.item_name} x${i.quantity}`),
    total: order.total_amount,
    time: order.created_at,
    studentName: profile?.full_name || '',
  });

  const statusColors: Record<string, string> = {
    placed: 'bg-info text-info-foreground',
    preparing: 'bg-warning text-warning-foreground',
    ready: 'bg-success text-success-foreground',
    picked_up: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-4">
        <div className="text-center space-y-2">
          <CheckCircle className="w-16 h-16 text-success mx-auto" />
          <h1 className="font-display text-2xl font-bold">Order Placed!</h1>
          <Badge className={statusColors[order.status] || ''}>{order.status.toUpperCase()}</Badge>
        </div>

        <Card className="glass shadow-warm">
          <CardContent className="p-6 text-center space-y-4">
            <div className="mx-auto w-fit p-4 bg-background rounded-2xl">
              <QRCodeSVG value={qrData} size={200} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">ORDER ID</p>
              <p className="font-display font-bold">#{order.order_number}</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">PICKUP CODE</p>
              <p className="font-display text-3xl font-bold tracking-widest gradient-text">{order.pickup_code}</p>
            </div>
            {order.nest_number && (
              <div className="bg-success/10 rounded-xl p-4 flex items-center justify-center gap-2">
                <MapPin className="w-5 h-5 text-success" />
                <p className="font-display font-bold text-lg">
                  Nest {String(order.nest_number).padStart(2, '0')}
                </p>
              </div>
            )}
            {order.status === 'ready' && order.nest_number && (
              <p className="text-success font-semibold animate-pulse">
                🎉 Your order is ready at Nest {String(order.nest_number).padStart(2, '0')}!
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-4 space-y-2">
            <h3 className="font-display font-semibold text-sm">Order Summary</h3>
            {items.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.item_name} × {item.quantity}</span>
                <span className="font-medium">₹{item.item_price * item.quantity}</span>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between font-display font-bold">
              <span>Total</span>
              <span className="text-primary">₹{order.total_amount}</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
