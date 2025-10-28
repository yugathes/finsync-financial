import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, X, FileText, Check } from 'lucide-react';

interface ImportCommitment {
  type: string;
  title: string;
  category: string;
  amount: number;
  recurring?: boolean;
  startDate?: string;
  createdAt?: string;
}

interface ImportWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (commitments: ImportCommitment[]) => Promise<void>;
}

export const ImportWizardModal: React.FC<ImportWizardModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [step, setStep] = useState<'upload' | 'preview' | 'complete'>('upload');
  const [commitments, setCommitments] = useState<ImportCommitment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        
        if (file.name.endsWith('.json')) {
          // Parse JSON
          const data = JSON.parse(text);
          const parsed = Array.isArray(data) ? data : [data];
          setCommitments(parsed);
          setStep('preview');
        } else if (file.name.endsWith('.csv')) {
          // Parse CSV
          const lines = text.split('\n').filter(line => line.trim());
          const headers = lines[0].split(',').map(h => h.trim());
          
          const parsed = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            const obj: any = {};
            headers.forEach((header, i) => {
              obj[header] = values[i];
            });
            return {
              type: obj.type || 'static',
              title: obj.title,
              category: obj.category,
              amount: parseFloat(obj.amount),
              recurring: obj.recurring === 'true' || obj.recurring === '1',
              startDate: obj.startDate,
              createdAt: obj.createdAt,
            };
          });
          
          setCommitments(parsed);
          setStep('preview');
        } else {
          setError('Unsupported file format. Please upload a CSV or JSON file.');
        }
      } catch (err: any) {
        setError('Failed to parse file: ' + err.message);
      }
    };

    reader.onerror = () => {
      setError('Failed to read file');
    };

    reader.readAsText(file);
  };

  const handleImport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await onImport(commitments);
      setStep('complete');
    } catch (err: any) {
      setError(err.message || 'Failed to import commitments');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('upload');
    setCommitments([]);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Commitments
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">Upload your file</p>
                  <p className="text-sm text-gray-600">
                    Support for CSV and JSON formats
                  </p>
                </div>
                <label className="mt-4 inline-block">
                  <input
                    type="file"
                    accept=".csv,.json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button className="bg-blue-600 hover:bg-blue-700" asChild>
                    <span>Select File</span>
                  </Button>
                </label>
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">Required CSV columns:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>type (static/dynamic)</li>
                  <li>title</li>
                  <li>category</li>
                  <li>amount</li>
                </ul>
                <p className="mt-2">Optional: recurring, startDate, createdAt</p>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Preview Import</h3>
                  <p className="text-sm text-gray-600">
                    {commitments.length} commitment{commitments.length !== 1 ? 's' : ''} found
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setStep('upload')}
                  disabled={loading}
                >
                  Back
                </Button>
              </div>

              <div className="max-h-96 overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left p-2 border-b">Title</th>
                      <th className="text-left p-2 border-b">Category</th>
                      <th className="text-left p-2 border-b">Amount</th>
                      <th className="text-left p-2 border-b">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commitments.map((c, i) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="p-2">{c.title}</td>
                        <td className="p-2">{c.category}</td>
                        <td className="p-2">{c.amount}</td>
                        <td className="p-2">
                          <Badge variant={c.type === 'static' ? 'secondary' : 'outline'}>
                            {c.type}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? 'Importing...' : 'Import Commitments'}
                </Button>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center py-8">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Import Successful!</h3>
              <p className="text-gray-600 mb-6">
                {commitments.length} commitment{commitments.length !== 1 ? 's' : ''} imported successfully
              </p>
              <Button onClick={handleClose} className="bg-blue-600 hover:bg-blue-700">
                Close
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
