import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import type { Tables } from '@/integrations/supabase/types';

type Nest = Tables<'nests'>;

export default function NestManager() {
  const [nests, setNests] = useState<Nest[]>([]);
  const [newNestNumber, setNewNestNumber] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchNests = useCallback(async () => {
    const { data } = await supabase.from('nests').select('*').order('nest_number', { ascending: true });
    if (data) setNests(data);
  }, []);

  useEffect(() => {
    fetchNests();
  }, [fetchNests]);

  const addNest = async () => {
    const num = parseInt(newNestNumber);
    if (isNaN(num) || num < 1) {
      toast.error('Enter a valid nest number');
      return;
    }
    if (nests.some(n => n.nest_number === num)) {
      toast.error('Nest number already exists');
      return;
    }
    setAdding(true);
    const { error } = await supabase.from('nests').insert({ nest_number: num });
    if (error) toast.error(error.message);
    else {
      toast.success(`Nest ${String(num).padStart(2, '0')} added`);
      setNewNestNumber('');
      fetchNests();
    }
    setAdding(false);
  };

  const deleteNest = async (id: string, nestNumber: number) => {
    const { error } = await supabase.from('nests').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Nest ${String(nestNumber).padStart(2, '0')} deleted`);
      fetchNests();
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display font-bold text-lg">Nest Manager</h2>

      {/* Add nest */}
      <div className="flex gap-2">
        <Input
          placeholder="Nest number (e.g. 17)"
          value={newNestNumber}
          onChange={e => setNewNestNumber(e.target.value)}
          type="number"
          min={1}
          className="flex-1"
        />
        <Button onClick={addNest} disabled={adding} className="gradient-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-1" /> Add Nest
        </Button>
      </div>

      {/* Nest list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {nests.map(nest => (
          <Card key={nest.id} className="glass">
            <CardContent className="p-4 flex flex-col items-center gap-3">
              <p className="font-display font-bold">Nest {String(nest.nest_number).padStart(2, '0')}</p>
              <div className="bg-white p-2 rounded-lg">
                <QRCodeSVG value={`NestID:${String(nest.nest_number).padStart(2, '0')}`} size={120} />
              </div>
              <p className="text-xs text-muted-foreground font-mono">NestID:{String(nest.nest_number).padStart(2, '0')}</p>
              {nest.is_occupied && (
                <p className="text-xs text-warning font-medium">🔒 Occupied</p>
              )}
              <Button
                size="sm"
                variant="destructive"
                onClick={() => deleteNest(nest.id, nest.nest_number)}
                className="w-full"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {nests.length === 0 && (
        <p className="text-muted-foreground text-center py-8">No nests configured</p>
      )}
    </div>
  );
}
