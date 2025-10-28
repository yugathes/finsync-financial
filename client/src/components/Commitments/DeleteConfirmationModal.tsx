import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Trash2, Calendar } from 'lucide-react';
import { CommitmentWithStatus } from './CommitmentList';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  commitment: CommitmentWithStatus | null;
  onConfirm: (deleteScope: 'single' | 'all') => Promise<void>;
  onCancel: () => void;
  currentMonth: string;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  commitment,
  onConfirm,
  onCancel,
  currentMonth,
}) => {
  const [deleting, setDeleting] = useState(false);
  const [selectedScope, setSelectedScope] = useState<'single' | 'all'>('single');

  if (!isOpen || !commitment) return null;

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm(selectedScope);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Delete Commitment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Commitment Details */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="font-medium text-gray-900">{commitment.title}</p>
            <p className="text-sm text-gray-600">{commitment.category}</p>
            <p className="text-lg font-semibold text-gray-900 mt-2">
              MYR {parseFloat(commitment.amount).toLocaleString()}
            </p>
          </div>

          {/* Warning Message */}
          <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-medium">This action cannot be undone.</p>
              <p className="mt-1">
                This will permanently delete the commitment and all associated payment records.
              </p>
            </div>
          </div>

          {/* Delete Scope Options */}
          {commitment.recurring && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">
                This is a recurring commitment. Choose deletion scope:
              </p>
              
              <div className="space-y-2">
                {/* Single Month Option */}
                <button
                  onClick={() => setSelectedScope('single')}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                    selectedScope === 'single'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      selectedScope === 'single'
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedScope === 'single' && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-600" />
                        <p className="font-medium text-gray-900">
                          Delete for {formatMonth(currentMonth)} only
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Removes only the payment record for this month. The commitment will still appear in other months.
                      </p>
                    </div>
                  </div>
                </button>

                {/* All Months Option */}
                <button
                  onClick={() => setSelectedScope('all')}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                    selectedScope === 'all'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      selectedScope === 'all'
                        ? 'border-red-500 bg-red-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedScope === 'all' && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Trash2 className="h-4 w-4 text-red-600" />
                        <p className="font-medium text-gray-900">
                          Delete permanently (all months)
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Completely removes this commitment and all payment records across all months.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Non-recurring commitment message */}
          {!commitment.recurring && (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700">
                This is a one-time commitment and will be permanently deleted.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={deleting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={deleting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? 'Deleting...' : selectedScope === 'all' ? 'Delete Permanently' : 'Delete for This Month'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
