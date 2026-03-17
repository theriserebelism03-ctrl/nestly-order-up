import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, ImageIcon, Package } from 'lucide-react';
import { toast } from 'sonner';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string | null;
  category: string;
  available: boolean;
  image_url: string | null;
  stock_quantity: number;
}

const categories = ['Main', 'Snacks', 'Beverages'];

export default function AdminMenuManager() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [form, setForm] = useState({ name: '', price: '', description: '', category: 'Main', stock_quantity: '100' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    const { data } = await supabase.from('menu_items').select('*').order('created_at', { ascending: false });
    if (data) setItems(data as MenuItem[]);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const resetForm = () => {
    setForm({ name: '', price: '', description: '', category: 'Main', stock_quantity: '100' });
    setImageFile(null);
    setImagePreview(null);
    setEditing(null);
  };

  const openAdd = () => { resetForm(); setOpen(true); };

  const openEdit = (item: MenuItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      price: String(item.price),
      description: item.description || '',
      category: item.category,
      stock_quantity: String(item.stock_quantity),
    });
    setImagePreview(item.image_url);
    setImageFile(null);
    setOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('food-images').upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from('food-images').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price.trim()) {
      toast.error('Name and price are required');
      return;
    }
    const price = parseInt(form.price);
    const stockQty = parseInt(form.stock_quantity) || 0;
    if (isNaN(price) || price <= 0) { toast.error('Enter a valid price'); return; }

    setSaving(true);
    try {
      let imageUrl = editing?.image_url || null;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const record = {
        name: form.name.trim(),
        price,
        description: form.description.trim() || null,
        category: form.category,
        stock_quantity: stockQty,
        available: stockQty > 0,
        image_url: imageUrl,
      };

      if (editing) {
        const { error } = await supabase.from('menu_items').update(record).eq('id', editing.id);
        if (error) throw error;
        toast.success('Item updated');
      } else {
        const { error } = await supabase.from('menu_items').insert(record);
        if (error) throw error;
        toast.success('Item added');
      }

      setOpen(false);
      resetForm();
      fetchItems();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: MenuItem) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    const { error } = await supabase.from('menu_items').delete().eq('id', item.id);
    if (error) toast.error(error.message);
    else { toast.success('Item deleted'); fetchItems(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-lg">Menu Management</h2>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-primary text-primary-foreground" onClick={openAdd}>
              <Plus className="w-4 h-4 mr-1" /> Add Food Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">{editing ? 'Edit Food Item' : 'Add Food Item'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Food Name</Label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Fried Rice" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Price (₹)</Label>
                  <Input type="number" min={1} value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="120" />
                </div>
                <div>
                  <Label>Stock Quantity</Label>
                  <Input type="number" min={0} value={form.stock_quantity} onChange={e => setForm(p => ({ ...p, stock_quantity: e.target.value }))} placeholder="50" />
                </div>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description (optional)</Label>
                <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Short description..." rows={2} />
              </div>
              <div>
                <Label>Upload Image</Label>
                <Input type="file" accept="image/*" onChange={handleImageChange} className="mt-1" />
                {imagePreview && (
                  <div className="mt-2 rounded-xl overflow-hidden border border-border">
                    <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
                  </div>
                )}
              </div>
              <Button className="w-full gradient-primary text-primary-foreground" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editing ? 'Update Item' : 'Add Item'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Item list */}
      <div className="space-y-3">
        {items.map(item => (
          <Card key={item.id} className="glass overflow-hidden">
            <CardContent className="p-0">
              <div className="flex">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-20 h-20 object-cover shrink-0" />
                ) : (
                  <div className="w-20 h-20 bg-muted flex items-center justify-center shrink-0">
                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 p-3 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-display font-semibold text-sm truncate">{item.name}</p>
                      <p className="text-primary font-semibold text-sm">₹{item.price}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(item)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(item)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Package className="w-3 h-3 text-muted-foreground" />
                    <span className={`text-xs font-medium ${item.stock_quantity === 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {item.stock_quantity === 0 ? 'Out of Stock' : `Stock: ${item.stock_quantity}`}
                    </span>
                    {!item.available && <span className="text-xs text-destructive font-medium">• Unavailable</span>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && <p className="text-muted-foreground text-center py-8">No menu items yet</p>}
      </div>
    </div>
  );
}
