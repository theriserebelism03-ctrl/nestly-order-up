import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { LogOut, ScanLine, ChefHat } from 'lucide-react';
import NestManager from '@/components/NestManager';
import QRScanner from '@/components/QRScanner';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Order = Tables<'orders'>;

interface OrderWithItems extends Order {
  order_items: Tables<'order_items'>[];
}

const statusColors: Record<string, string> = {
  placed: 'bg-info text-info-foreground',
  preparing: 'bg-warning text-warning-foreground',
  ready: 'bg-success text-success-foreground',
  picked_up: 'bg-muted text-muted-foreground',
};

export default function ChefDashboard() {
  const { signOut, profile } = useAuth();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanningForOrder, setScanningForOrder] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .in('status', ['placed', 'preparing', 'ready'])
      .order('created_at', { ascending: true });
    if (data) setOrders(data as OrderWithItems[]);
  }, []);

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel('chef-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchOrders]);

  const updateStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (error) toast.error(error.message);
    else toast.success(`Order marked as ${status}`);
  };

  const handleNestScan = useCallback(async (data: string) => {
    setScanning(false);
    // Parse NestID:XX
    const match = data.match(/NestID:(\d+)/i);
    if (!match) {
      toast.error('Invalid nest QR code');
      return;
    }
    const nestNumber = parseInt(match[1]);
    if (nestNumber < 1 || nestNumber > 16) {
      toast.error('Invalid nest number');
      return;
    }
    if (!scanningForOrder) return;

    // Assign nest to order
    const { error: orderErr } = await supabase
      .from('orders')
      .update({ nest_number: nestNumber, status: 'ready' })
      .eq('id', scanningForOrder);
    if (orderErr) {
      toast.error(orderErr.message);
      return;
    }

    const { error: nestErr } = await supabase
      .from('nests')
      .update({ current_order_id: scanningForOrder, is_occupied: true })
      .eq('nest_number', nestNumber);
    if (nestErr) toast.error(nestErr.message);
    else toast.success(`Order assigned to Nest ${String(nestNumber).padStart(2, '0')}`);

    setScanningForOrder(null);
  }, [scanningForOrder]);

  const startNestScan = (orderId: string) => {
    setScanningForOrder(orderId);
    setScanning(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {scanning && <QRScanner onScan={handleNestScan} onClose={() => setScanning(false)} />}

      <div className="gradient-primary px-4 pt-6 pb-6 rounded-b-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-primary-foreground/70 text-xs">Chef Dashboard</p>
              <p className="text-primary-foreground font-display font-bold">{profile?.full_name || 'Chef'}</p>
            </div>
          </div>
          <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10" onClick={signOut}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <h2 className="font-display font-bold text-lg">Live Orders ({orders.length})</h2>
        {orders.map(order => (
          <Card key={order.id} className="glass">
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-display font-bold">#{order.order_number}</p>
                  <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleTimeString()}</p>
                </div>
                <Badge className={statusColors[order.status] || ''}>{order.status}</Badge>
              </div>

              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                {order.order_items.map(item => (
                  <div key={item.id} className="text-sm flex justify-between">
                    <span>{item.item_name} × {item.quantity}</span>
                    <span className="text-muted-foreground">₹{item.item_price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="text-sm">
                <span className="text-muted-foreground">Pickup Code: </span>
                <span className="font-mono font-bold">{order.pickup_code}</span>
              </div>

              {order.nest_number && (
                <p className="text-sm text-success font-medium">📍 Nest {String(order.nest_number).padStart(2, '0')}</p>
              )}

              <div className="flex gap-2">
                {order.status === 'placed' && (
                  <Button size="sm" className="bg-warning text-warning-foreground" onClick={() => updateStatus(order.id, 'preparing')}>
                    Start Preparing
                  </Button>
                )}
                {order.status === 'preparing' && (
                  <Button size="sm" className="bg-success text-success-foreground" onClick={() => startNestScan(order.id)}>
                    <ScanLine className="w-4 h-4 mr-1" /> Scan Nest QR
                  </Button>
                )}
                {order.status === 'ready' && (
                  <Button size="sm" variant="outline" onClick={() => updateStatus(order.id, 'picked_up')}>
                    Mark Picked Up
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {orders.length === 0 && (
          <p className="text-muted-foreground text-center py-12">No active orders</p>
        )}
      </div>
    </div>
  );
}
