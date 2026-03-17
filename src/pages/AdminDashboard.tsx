import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Shield, Users, ShoppingBag, IndianRupee, ScanLine, Box, UtensilsCrossed } from 'lucide-react';
import QRScanner from '@/components/QRScanner';
import AdminMenuManager from '@/components/AdminMenuManager';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Order = Tables<'orders'>;
type Nest = Tables<'nests'>;

interface OrderWithItems extends Order {
  order_items: Tables<'order_items'>[];
}

interface UserWithRole {
  user_id: string;
  full_name: string;
  role: string;
}

const statusColors: Record<string, string> = {
  placed: 'bg-info text-info-foreground',
  preparing: 'bg-warning text-warning-foreground',
  ready: 'bg-success text-success-foreground',
  picked_up: 'bg-muted text-muted-foreground',
};

export default function AdminDashboard() {
  const { signOut, profile } = useAuth();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [nests, setNests] = useState<Nest[]>([]);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [scanning, setScanning] = useState(false);
  const [pickupVerify, setPickupVerify] = useState('');

  const fetchData = useCallback(async () => {
    const [ordersRes, nestsRes, profilesRes, rolesRes] = await Promise.all([
      supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(50),
      supabase.from('nests').select('*').order('nest_number'),
      supabase.from('profiles').select('user_id, full_name'),
      supabase.from('user_roles').select('user_id, role'),
    ]);
    if (ordersRes.data) setOrders(ordersRes.data as OrderWithItems[]);
    if (nestsRes.data) setNests(nestsRes.data);
    if (profilesRes.data && rolesRes.data) {
      const combined = profilesRes.data.map(p => ({
        ...p,
        role: rolesRes.data.find(r => r.user_id === p.user_id)?.role || 'student',
      }));
      setUsers(combined);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('admin-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'nests' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const totalRevenue = orders.reduce((sum, o) => sum + o.total_amount, 0);
  const occupiedNests = nests.filter(n => n.is_occupied).length;

  const handleOrderQRScan = (data: string) => {
    setScanning(false);
    try {
      const parsed = JSON.parse(data);
      toast.info(`Order #${parsed.orderNumber} — Total: ₹${parsed.total}`);
    } catch {
      toast.error('Invalid QR code');
    }
  };

  const verifyPickup = () => {
    const order = orders.find(o => o.pickup_code === pickupVerify);
    if (order) {
      toast.success(`Verified! Order #${order.order_number} — Status: ${order.status}`);
    } else {
      toast.error('Invalid pickup code');
    }
    setPickupVerify('');
  };

  const overrideNest = async (orderId: string, nestNumber: number) => {
    await supabase.from('orders').update({ nest_number: nestNumber, status: 'ready' }).eq('id', orderId);
    await supabase.from('nests').update({ current_order_id: orderId, is_occupied: true }).eq('nest_number', nestNumber);
    toast.success('Nest overridden');
  };

  return (
    <div className="min-h-screen bg-background">
      {scanning && <QRScanner onScan={handleOrderQRScan} onClose={() => setScanning(false)} />}

      <div className="bg-sidebar px-4 pt-6 pb-6 rounded-b-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sidebar-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-sidebar-primary" />
            </div>
            <div>
              <p className="text-sidebar-foreground/70 text-xs">Admin Panel</p>
              <p className="text-sidebar-foreground font-display font-bold">{profile?.full_name || 'Admin'}</p>
            </div>
          </div>
          <Button size="icon" variant="ghost" className="text-sidebar-foreground hover:bg-sidebar-accent" onClick={signOut}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 p-4 -mt-4">
        <Card className="glass shadow-warm">
          <CardContent className="p-4 text-center">
            <IndianRupee className="w-6 h-6 mx-auto text-primary mb-1" />
            <p className="font-display text-xl font-bold">₹{totalRevenue}</p>
            <p className="text-xs text-muted-foreground">Revenue</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4 text-center">
            <ShoppingBag className="w-6 h-6 mx-auto text-info mb-1" />
            <p className="font-display text-xl font-bold">{orders.length}</p>
            <p className="text-xs text-muted-foreground">Total Orders</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto text-accent mb-1" />
            <p className="font-display text-xl font-bold">{users.length}</p>
            <p className="text-xs text-muted-foreground">Users</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4 text-center">
            <Box className="w-6 h-6 mx-auto text-warning mb-1" />
            <p className="font-display text-xl font-bold">{occupiedNests}/16</p>
            <p className="text-xs text-muted-foreground">Nests Used</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="px-4 flex gap-2 mb-4">
        <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => setScanning(true)}>
          <ScanLine className="w-4 h-4 mr-1" /> Scan Order QR
        </Button>
        <div className="flex gap-1 flex-1">
          <Input
            placeholder="Verify pickup code"
            value={pickupVerify}
            onChange={e => setPickupVerify(e.target.value)}
            className="h-9"
          />
          <Button size="sm" variant="outline" onClick={verifyPickup}>Verify</Button>
        </div>
      </div>

      <Tabs defaultValue="orders" className="px-4">
        <TabsList className="w-full">
          <TabsTrigger value="orders" className="flex-1">Orders</TabsTrigger>
          <TabsTrigger value="menu" className="flex-1">Menu</TabsTrigger>
          <TabsTrigger value="nests" className="flex-1">Nests</TabsTrigger>
          <TabsTrigger value="users" className="flex-1">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-3 mt-3">
          {orders.slice(0, 20).map(order => (
            <Card key={order.id} className="glass">
              <CardContent className="p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-display font-bold text-sm">#{order.order_number}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={`${statusColors[order.status]} text-xs`}>{order.status}</Badge>
                    <p className="text-primary font-semibold text-sm">₹{order.total_amount}</p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Code: <span className="font-mono font-bold text-foreground">{order.pickup_code}</span>
                  {order.nest_number && <span className="ml-2">| Nest {String(order.nest_number).padStart(2, '0')}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="menu" className="mt-3">
          <AdminMenuManager />
        </TabsContent>

        <TabsContent value="nests" className="mt-3">
          <div className="grid grid-cols-4 gap-2">
            {nests.map(nest => (
              <Card key={nest.id} className={`text-center ${nest.is_occupied ? 'border-warning bg-warning/10' : 'glass'}`}>
                <CardContent className="p-3">
                  <p className="font-display font-bold">{String(nest.nest_number).padStart(2, '0')}</p>
                  <p className="text-xs text-muted-foreground">{nest.is_occupied ? 'Occupied' : 'Free'}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-2 mt-3">
          {users.map(u => (
            <div key={u.user_id} className="flex justify-between items-center p-3 rounded-xl bg-muted/50">
              <p className="text-sm font-medium">{u.full_name || 'Unnamed'}</p>
              <Badge variant="outline">{u.role}</Badge>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
