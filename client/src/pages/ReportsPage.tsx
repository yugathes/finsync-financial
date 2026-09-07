import { useEffect, useState } from 'react';
import { BarChart3, CircleDollarSign, PiggyBank, WalletCards } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MonthSelector } from '@/components/Dashboard/MonthSelector';
import { useSession } from '@/hooks/useSession';

type Scope = 'month' | 'all';

interface Commitment {
  amount: string | number;
  category: string;
  isImported?: boolean;
  isPaid: boolean;
  amountPaid?: string | number;
}

interface ReportTotals {
  income: number;
  committed: number;
  paid: number;
  categories: Map<string, number>;
}

const currentMonth = () => new Date().toISOString().slice(0, 7);
const categoryColors = ['#3b82f6', '#10b981', '#f97316', '#a855f7', '#ec4899', '#64748b'];

export default function ReportsPage() {
  const { user } = useSession();
  const [scope, setScope] = useState<Scope>('month');
  const [month, setMonth] = useState(currentMonth);
  const [report, setReport] = useState<ReportTotals>({ income: 0, committed: 0, paid: 0, categories: new Map() });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const loadReport = async () => {
      setLoading(true);
      setError(false);
      try {
        const months =
          scope === 'month'
            ? [month]
            : await fetch(`/api/commitments/user/${user.id}/months-with-data`).then(response => {
                if (!response.ok) throw new Error('Unable to load available months');
                return response.json() as Promise<string[]>;
              });
        const results = await Promise.all(
          months.map(async selectedMonth => {
            const [commitments, income] = await Promise.all([
              fetch(`/api/commitments/user/${user.id}/month/${selectedMonth}`).then(response => {
                if (!response.ok) throw new Error('Unable to load commitments');
                return response.json() as Promise<Commitment[]>;
              }),
              fetch(`/api/monthly-income/${user.id}/${selectedMonth}`).then(async response => {
                if (response.status === 404) return 0;
                if (!response.ok) throw new Error('Unable to load income');
                const data = await response.json();
                return Number(data.amount) || 0;
              }),
            ]);
            return { commitments, income };
          })
        );
        const categories = new Map<string, number>();
        let income = 0;
        let committed = 0;
        let paid = 0;
        results.forEach(result => {
          income += result.income;
          result.commitments
            .filter(item => !item.isImported)
            .forEach(item => {
              const amount = Number(item.amount) || 0;
              committed += amount;
              paid += item.isPaid ? Number(item.amountPaid ?? item.amount) || 0 : 0;
              categories.set(item.category, (categories.get(item.category) ?? 0) + amount);
            });
        });
        setReport({ income, committed, paid, categories });
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [month, scope, user?.id]);

  const remaining = report.income - report.paid;
  const chartMaximum = Math.max(report.income, report.committed, report.paid, 1);
  const categoryTotals = Array.from(report.categories.entries()).sort((first, second) => second[1] - first[1]);

  return (
    <Layout title="FinSync - Reports">
      <div className="mx-auto max-w-3xl space-y-5 pb-6">
        <div className="px-1">
          <p className="text-sm font-medium text-slate-500">Financial performance</p>
          <h2 className="text-2xl font-bold text-primary">Reports</h2>
        </div>
        <div className="grid grid-cols-2 rounded-lg bg-slate-100 p-1" role="group" aria-label="Report scope">
          <Button
            variant="ghost"
            size="sm"
            className={scope === 'month' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}
            onClick={() => setScope('month')}
            aria-pressed={scope === 'month'}
          >
            This month
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={scope === 'all' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}
            onClick={() => setScope('all')}
            aria-pressed={scope === 'all'}
          >
            All time
          </Button>
        </div>
        {scope === 'month' && (
          <Card className="border-blue-100 bg-white shadow-sm">
            <CardContent className="py-3">
              <MonthSelector currentMonth={month} onChange={setMonth} userId={user?.id} />
            </CardContent>
          </Card>
        )}
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">Loading report...</CardContent>
          </Card>
        ) : error ? (
          <Card className="border-rose-100 bg-rose-50">
            <CardContent className="p-8 text-center text-sm text-rose-700">
              Unable to load this report. Please try again.
            </CardContent>
          </Card>
        ) : (
          <>
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Report totals">
              <ReportMetric label="Income" value={report.income} icon={<CircleDollarSign />} tone="emerald" />
              <ReportMetric label="Committed" value={report.committed} icon={<WalletCards />} tone="violet" />
              <ReportMetric label="Paid" value={report.paid} icon={<BarChart3 />} tone="orange" />
              <ReportMetric label="Remaining" value={remaining} icon={<PiggyBank />} tone="blue" />
            </section>
            <Card className="border-0 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-base text-primary">Income vs commitments</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="flex h-52 items-end justify-around gap-5 border-b border-slate-100 px-3 pb-0"
                  aria-label="Income, commitments, and paid amounts bar chart"
                >
                  <ReportBar label="Income" value={report.income} maximum={chartMaximum} color="bg-emerald-500" />
                  <ReportBar label="Committed" value={report.committed} maximum={chartMaximum} color="bg-violet-500" />
                  <ReportBar label="Paid" value={report.paid} maximum={chartMaximum} color="bg-orange-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-base text-primary">Spending by category</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {categoryTotals.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No commitments recorded for this scope.
                  </p>
                ) : (
                  categoryTotals.map(([category, amount], index) => (
                    <div key={category}>
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="font-medium text-slate-700">{category}</span>
                        <span className="font-semibold text-primary">MYR {amount.toLocaleString()}</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(amount / report.committed) * 100}%`,
                            backgroundColor: categoryColors[index % categoryColors.length],
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
}

const ReportMetric = ({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: 'emerald' | 'violet' | 'orange' | 'blue';
}) => (
  <Card
    className={`border-0 shadow-sm ${tone === 'emerald' ? 'bg-emerald-50 text-emerald-700' : tone === 'violet' ? 'bg-violet-50 text-violet-700' : tone === 'orange' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'}`}
  >
    <CardContent className="p-4">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80">{icon}</span>
      <p className="mt-3 text-xs font-medium opacity-80">{label}</p>
      <p className="mt-1 text-lg font-bold">MYR {value.toLocaleString()}</p>
    </CardContent>
  </Card>
);

const ReportBar = ({
  label,
  value,
  maximum,
  color,
}: {
  label: string;
  value: number;
  maximum: number;
  color: string;
}) => (
  <div className="flex h-full flex-1 flex-col justify-end text-center">
    <p className="mb-2 text-xs font-semibold text-slate-700">MYR {value.toLocaleString()}</p>
    <div
      className={`mx-auto w-full max-w-14 rounded-t-md ${color}`}
      style={{ height: `${Math.max((value / maximum) * 150, value > 0 ? 8 : 0)}px` }}
    />
    <p className="mt-2 text-xs text-slate-500">{label}</p>
  </div>
);
