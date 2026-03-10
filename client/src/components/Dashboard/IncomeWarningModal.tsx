import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface IncomeWarningModalProps {
  isOpen: boolean;
  commitment: {
    id: string;
    title: string;
    amount: number;
  } | null;
  onContinue: () => Promise<void>;
  onCancel: () => void;
}

export const IncomeWarningModal: React.FC<IncomeWarningModalProps> = ({
  isOpen,
  commitment,
  onContinue,
  onCancel,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !commitment) return null;

  const handleContinue = async () => {
    setIsProcessing(true);
    try {
      await onContinue();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2 text-amber-600">
            <AlertCircle className="h-5 w-5" />
            No Income Set
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Commitment Details */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="font-medium text-gray-900">{commitment.title}</p>
            <p className="text-lg font-semibold text-gray-900 mt-2">
              MYR {parseFloat(commitment.amount.toString()).toLocaleString()}
            </p>
          </div>

          {/* Warning Message */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Your monthly income is $0.</p>
              <p className="mt-1">
                Marking commitments as paid won't affect your spending percentage since there's no income set for this month.
              </p>
              <p className="mt-2 font-medium">Would you like to update your income first?</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleContinue}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? 'Processing...' : 'Continue Anyway'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
