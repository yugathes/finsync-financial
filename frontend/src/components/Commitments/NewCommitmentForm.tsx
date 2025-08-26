import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { PlusCircle } from 'lucide-react';

export interface NewCommitmentData {
  type: 'static' | 'dynamic';
  title: string;
  category: string;
  amount: number;
  recurring: boolean;
  shared: boolean;
}

interface NewCommitmentFormProps {
  onSubmit: (commitment: NewCommitmentData) => Promise<void>;
  onCancel: () => void;
  isVisible: boolean;
  currency?: string;
}

const CATEGORIES = [
  'Housing',
  'Transportation', 
  'Food & Dining',
  'Utilities',
  'Healthcare',
  'Entertainment',
  'Shopping',
  'Education',
  'Insurance',
  'Savings',
  'Debt Payment',
  'Personal Care',
  'Travel',
  'Charity',
  'Other'
];

export const NewCommitmentForm: React.FC<NewCommitmentFormProps> = ({
  onSubmit,
  onCancel,
  isVisible,
  currency = "MYR"
}) => {
  const [formData, setFormData] = useState<NewCommitmentData>({
    type: 'static',
    title: '',
    category: '',
    amount: 0,
    recurring: true,
    shared: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.title.trim()) {
      setError('Please enter a title');
      return;
    }
    
    if (!formData.category) {
      setError('Please select a category');
      return;
    }
    
    if (formData.amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    setLoading(true);
    
    try {
      await onSubmit(formData);
      // Reset form
      setFormData({
        type: 'static',
        title: '',
        category: '',
        amount: 0,
        recurring: true,
        shared: false
      });
    } catch (error: any) {
      setError(error.message || 'Failed to create commitment');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      type: 'static',
      title: '',
      category: '',
      amount: 0,
      recurring: true,
      shared: false
    });
    setError(null);
    onCancel();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2 text-blue-800">
            <PlusCircle className="h-5 w-5" />
            New Commitment
          </CardTitle>
          <CardDescription>
            Add a new financial commitment to track
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Rent, Groceries, Phone Bill"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: 'static' | 'dynamic') => 
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="static">Static (Fixed amount)</SelectItem>
                  <SelectItem value="dynamic">Dynamic (Variable amount)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {formData.type === 'static' 
                  ? 'Fixed amount every month (e.g., rent, subscriptions)' 
                  : 'Variable amount each month (e.g., groceries, utilities)'
                }
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  {currency}
                </span>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="pl-12"
                  placeholder="0.00"
                  required
                />
              </div>
              {formData.type === 'dynamic' && (
                <p className="text-xs text-gray-500">
                  Enter your estimated monthly amount. You can adjust this when marking as paid.
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="recurring">Recurring Monthly</Label>
                  <p className="text-xs text-gray-500">
                    Automatically appears every month
                  </p>
                </div>
                <Switch
                  id="recurring"
                  checked={formData.recurring}
                  onCheckedChange={(checked) => setFormData({ ...formData, recurring: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="shared">Shared Commitment</Label>
                  <p className="text-xs text-gray-500">
                    Split with family/roommates
                  </p>
                </div>
                <Switch
                  id="shared"
                  checked={formData.shared}
                  onCheckedChange={(checked) => setFormData({ ...formData, shared: checked })}
                />
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? 'Creating...' : 'Create Commitment'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};