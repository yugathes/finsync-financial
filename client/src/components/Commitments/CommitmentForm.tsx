import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, DollarSign, Tag, Calendar } from "lucide-react";
import { useSession } from "@/hooks/useSession";

interface CommitmentFormProps {
  onSubmit: (commitment: {
    title: string;
    amount: number;
    type: 'static' | 'dynamic';
    category: string;
    recurring?: boolean;
    shared?: boolean;
    groupId?: string;
  }) => void;
  onCancel: () => void;
  isVisible: boolean;
}

interface Group {
  id: string;
  name: string;
  ownerId: string;
}

const categories = [
  "Housing", "Food", "Transportation", "Utilities", 
  "Entertainment", "Healthcare", "Education", "Shopping", "Other"
];

export const CommitmentForm = ({ onSubmit, onCancel, isVisible }: CommitmentFormProps) => {
  const { user } = useSession();
  const [groups, setGroups] = useState<Group[]>([]);
  const [formData, setFormData] = useState<{
    title: string;
    amount: string;
    type: 'static' | 'dynamic';
    category: string;
    recurring: boolean;
    shared: boolean;
    groupId: string;
  }>({
    title: "",
    amount: "",
    type: "static",
    category: "",
    recurring: true,
    shared: false,
    groupId: ""
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount || !formData.category) return;
    
    // Validate group selection if shared is enabled
    if (formData.shared && !formData.groupId) {
      alert('Please select a group for shared commitment');
      return;
    }
    
    onSubmit({
      title: formData.title,
      amount: parseFloat(formData.amount),
      type: formData.type,
      category: formData.category,
      recurring: formData.recurring,
      shared: formData.shared,
      groupId: formData.shared ? formData.groupId : undefined
    });
    
    // Reset form
    setFormData({
      title: "",
      amount: "",
      type: "static",
      category: "",
      recurring: true,
      shared: false,
      groupId: ""
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
                  onCheckedChange={(checked) => setFormData({ ...formData, shared: checked, groupId: checked ? formData.groupId : "" })}
                />
              </div>

              {/* Group Selector - Only show when shared is enabled */}
              {formData.shared && (
                <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                  <Label htmlFor="group">Select Group</Label>
                  {groups.length > 0 ? (
                    <Select 
                      value={formData.groupId} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, groupId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a group to share with" />
                      </SelectTrigger>
                      <SelectContent>
                        {groups.map((group) => (
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