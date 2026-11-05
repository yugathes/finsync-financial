import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, DollarSign, Tag, Calendar } from 'lucide-react';
import { useSession } from '@/hooks/useSession';

interface CommitmentFormProps {
  onSubmit: (
    commitment: {
      title: string;
      amount: number;
      type: 'commitment' | 'expenses';
      category: string;
      recurring?: boolean;
      shared?: boolean;
      groupId?: string;
    },
    scope?: 'single' | 'all'
  ) => void | Promise<void>;
  onCancel: () => void;
  isVisible: boolean;
  /** Edit mode: prefill with these values and hide recurring/shared toggles */
  initialValues?: { title: string; amount: number | string; type: 'commitment' | 'expenses'; category: string };
  /** Edit mode for a recurring series row: ask whether to save this month only or the whole series */
  isSeries?: boolean;
  /** Edit mode for an older recurring item stored as one row shown in every month */
  isLegacyRecurring?: boolean;
}

interface Group {
  id: string;
  name: string;
  ownerId: string;
}

const categories = [
  'Housing',
  'Food',
  'Transportation',
  'Utilities',
  'Entertainment',
  'Healthcare',
  'Education',
  'Shopping',
  'Other',
];

export const CommitmentForm = ({
  onSubmit,
  onCancel,
  isVisible,
  initialValues,
  isSeries,
  isLegacyRecurring,
}: CommitmentFormProps) => {
  const isEdit = !!initialValues;
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const { user } = useSession();
  const [groups, setGroups] = useState<Group[]>([]);
  const [formData, setFormData] = useState<{
    title: string;
    amount: string;
    type: 'commitment' | 'expenses';
    category: string;
    recurring: boolean;
    shared: boolean;
    groupId: string;
  }>({
    title: '',
    amount: '',
    type: 'commitment',
    category: '',
    recurring: false,
    shared: false,
    groupId: '',
  });

  // Prefill when opened for editing
  useEffect(() => {
    if (isVisible && initialValues) {
      const { title, amount, type, category } = initialValues;
      setFormData(prev => ({ ...prev, title, type, category, amount: String(amount) }));
    }
  }, [isVisible, initialValues]);

  // Load user's groups when form becomes visible
  useEffect(() => {
    const loadGroups = async () => {
      if (!user?.id || !isVisible) return;

      try {
        const response = await fetch(`/api/groups/user/${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setGroups(data);
        }
      } catch (error) {
        console.error('Failed to load groups:', error);
      }
    };

    loadGroups();
  }, [user?.id, isVisible]);

  const handleSubmit = async (e: React.FormEvent, scope?: 'single' | 'all') => {
    e.preventDefault();
    // Ref blocks a second click before the disabled state re-renders
    if (savingRef.current || !formData.title || !formData.amount || !formData.category) return;

    // Validate group selection if shared is enabled
    if (formData.shared && !formData.groupId) {
      alert('Please select a group for shared commitment');
      return;
    }

    savingRef.current = true;
    setSaving(true);
    try {
      await onSubmit(
        {
          title: formData.title,
          amount: parseFloat(formData.amount),
          type: formData.type,
          category: formData.category,
          recurring: formData.recurring,
          shared: formData.shared,
          groupId: formData.shared ? formData.groupId : undefined,
        },
        scope
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }

    // Edit mode keeps its values so a failed save doesn't wipe the user's input;
    // the prefill effect overwrites them next time the form opens.
    if (isEdit) return;

    // Reset form
    setFormData({
      title: '',
      amount: '',
      type: 'commitment',
      category: '',
      recurring: false,
      shared: false,
      groupId: '',
    });
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in">
      <Card className="w-full max-w-md bg-background animate-slide-up sm:animate-scale-in max-h-[90dvh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              {isEdit ? 'Edit Commitment' : 'Add New Commitment'}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel} className="touch-target">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Commitment Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Rent, Groceries, Phone Bill"
                className="text-base"
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (MYR)</Label>
              <Input
                id="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={formData.amount}
                onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                className="text-base"
              />
            </div>

            {/* Type Selection */}
            <div className="space-y-2">
              <Label>Commitment Type</Label>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={formData.type === 'commitment' ? 'default' : 'outline'}
                  className="cursor-pointer px-4 py-2 transition-smooth touch-target"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'commitment' }))}
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Commitment (Fixed)
                </Badge>
                <Badge
                  variant={formData.type === 'expenses' ? 'default' : 'outline'}
                  className="cursor-pointer px-4 py-2 transition-smooth touch-target"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'expenses' }))}
                >
                  <Tag className="h-4 w-4 mr-1" />
                  Expenses
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {formData.type === 'commitment'
                  ? 'Fixed amount every month (e.g., rent, subscriptions)'
                  : 'Variable amount that changes monthly (e.g., groceries, utilities)'}
              </p>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={value => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Recurring and Shared Options (not editable after creation) */}
            {!isEdit && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5 min-w-0">
                    <Label htmlFor="recurring">Recurring Monthly</Label>
                    <p className="text-xs text-muted-foreground">Automatically appears every month</p>
                  </div>
                  <Switch
                    id="recurring"
                    checked={formData.recurring}
                    onCheckedChange={checked => setFormData({ ...formData, recurring: checked })}
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5 min-w-0">
                    <Label htmlFor="shared">Shared Commitment</Label>
                    <p className="text-xs text-muted-foreground">Split with family/roommates</p>
                  </div>
                  <Switch
                    id="shared"
                    checked={formData.shared}
                    onCheckedChange={checked =>
                      setFormData({ ...formData, shared: checked, groupId: checked ? formData.groupId : '' })
                    }
                  />
                </div>

                {/* Group Selector - Only show when shared is enabled */}
                {formData.shared && (
                  <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                    <Label htmlFor="group">Select Group</Label>
                    {groups.length > 0 ? (
                      <Select
                        value={formData.groupId}
                        onValueChange={value => setFormData(prev => ({ ...prev, groupId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a group to share with" />
                        </SelectTrigger>
                        <SelectContent>
                          {groups.map(group => (
                            <SelectItem key={group.id} value={group.id}>
                              {group.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                        No groups available. Create a group first in the Groups page.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {isSeries ? (
              <div className="space-y-2 pt-4">
                <p className="text-sm text-muted-foreground">
                  This is a recurring commitment. Apply changes to: (earlier months and other paid months stay
                  unchanged)
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={e => handleSubmit(e, 'single')}
                    disabled={saving}
                    className="flex-1 touch-target"
                  >
                    This month only
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={e => handleSubmit(e, 'all')}
                    disabled={saving}
                    className="flex-1 touch-target"
                  >
                    This & future months
                  </Button>
                </div>
                <Button type="button" variant="ghost" onClick={onCancel} className="w-full touch-target">
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="space-y-2 pt-4">
                {isLegacyRecurring && (
                  <p className="text-sm text-muted-foreground">
                    Older recurring item: changes apply to every month it appears in, including past ones.
                  </p>
                )}
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={onCancel} className="flex-1 touch-target">
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" disabled={saving} className="flex-1 touch-target">
                    {isEdit ? 'Save Changes' : 'Add Commitment'}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
