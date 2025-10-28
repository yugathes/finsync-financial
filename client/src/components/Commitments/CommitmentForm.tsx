import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, DollarSign, Tag, Calendar } from "lucide-react";

interface CommitmentFormProps {
  onSubmit: (commitment: {
    title: string;
    amount: number;
    type: 'static' | 'dynamic';
    category: string;
    recurring?: boolean;
    shared?: boolean;
  }) => void;
  onCancel: () => void;
  isVisible: boolean;
}

const categories = [
  "Housing", "Food", "Transportation", "Utilities", 
  "Entertainment", "Healthcare", "Education", "Shopping", "Other"
];

export const CommitmentForm = ({ onSubmit, onCancel, isVisible }: CommitmentFormProps) => {
  const [formData, setFormData] = useState<{
    title: string;
    amount: string;
    type: 'static' | 'dynamic';
    category: string;
    recurring: boolean;
    shared: boolean;
  }>({
    title: "",
    amount: "",
    type: "static",
    category: "",
    recurring: true,
    shared: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount || !formData.category) return;
    
    onSubmit({
      title: formData.title,
      amount: parseFloat(formData.amount),
      type: formData.type,
      category: formData.category,
      recurring: formData.recurring,
      shared: formData.shared
    });
    
    // Reset form
    setFormData({
      title: "",
      amount: "",
      type: "static",
      category: "",
      recurring: true,
      shared: false
    });
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in">
      <Card className="w-full max-w-md bg-background animate-slide-up sm:animate-scale-in">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Add New Commitment
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
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
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Rent, Groceries, Phone Bill"
                className="text-lg"
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (MYR)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                className="text-lg"
              />
            </div>

            {/* Type Selection */}
            <div className="space-y-2">
              <Label>Commitment Type</Label>
              <div className="flex gap-2">
                <Badge
                  variant={formData.type === 'static' ? 'default' : 'outline'}
                  className="cursor-pointer px-4 py-2 transition-smooth"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'static' }))}
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Static (Fixed)
                </Badge>
                <Badge
                  variant={formData.type === 'dynamic' ? 'default' : 'outline'}
                  className="cursor-pointer px-4 py-2 transition-smooth"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'dynamic' }))}
                >
                  <Tag className="h-4 w-4 mr-1" />
                  Dynamic (Variable)
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {formData.type === 'static' 
                  ? "Fixed amount every month (e.g., rent, subscriptions)"
                  : "Variable amount that changes monthly (e.g., groceries, utilities)"
                }
              </p>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Recurring and Shared Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="recurring">Recurring Monthly</Label>
                  <p className="text-xs text-muted-foreground">
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
                  <p className="text-xs text-muted-foreground">
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

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="flex-1">
                Add Commitment
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};