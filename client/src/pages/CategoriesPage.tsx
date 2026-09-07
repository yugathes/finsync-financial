import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Bus,
  CircleHelp,
  Clapperboard,
  GraduationCap,
  HeartPulse,
  Home,
  ShoppingBag,
  Utensils,
  WalletCards,
  Zap,
} from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MonthSelector } from '@/components/Dashboard/MonthSelector';
import { useSession } from '@/hooks/useSession';

type Scope = 'month' | 'all';

interface Commitment {
  amount: string | number;
  category: string;
  isImported?: boolean;
}

interface CategoryTotal {
  category: string;
  amount: number;
  color: string;
  Icon: LucideIcon;
}

const categoryMeta: Record<string, { color: string; Icon: LucideIcon }> = {
  Housing: { color: '#3b82f6', Icon: Home },
  Food: { color: '#f97316', Icon: Utensils },
  Transportation: { color: '#10b981', Icon: Bus },
  Utilities: { color: '#eab308', Icon: Zap },
  Entertainment: { color: '#a855f7', Icon: Clapperboard },
  Healthcare: { color: '#ef4444', Icon: HeartPulse },
  Education: { color: '#06b6d4', Icon: GraduationCap },
  Shopping: { color: '#ec4899', Icon: ShoppingBag },
  Other: { color: '#64748b', Icon: CircleHelp },
};

const currentMonth = () => new Date().toISOString().slice(0, 7);

export default function CategoriesPage() {
  const { user } = useSession();
  const [scope, setScope] = useState<Scope>('month');
  const [month, setMonth] = useState(currentMonth);
  const [totals, setTotals] = useState<CategoryTotal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const loadCategories = async () => {
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
        const records = await Promise.all(
          months.map(selectedMonth =>
            fetch(`/api/commitments/user/${user.id}/month/${selectedMonth}`).then(response => {
              if (!response.ok) throw new Error('Unable to load commitments');
              return response.json() as Promise<Commitment[]>;
            })
          )
        );
        const amounts = new Map<string, number>();
        records
          .flat()
          .filter(record => !record.isImported)
          .forEach(record => {
            amounts.set(record.category, (amounts.get(record.category) ?? 0) + (Number(record.amount) || 0));
          });
        setTotals(
          Array.from(amounts, ([category, amount]) => ({
            category,
            amount,
            ...(categoryMeta[category] ?? categoryMeta.Other),
          })).sort((first, second) => second.amount - first.amount)
        );
      } catch {
        setError(true);
        setTotals([]);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, [month, scope, user?.id]);

  const total = totals.reduce((sum, item) => sum + item.amount, 0);
  const gradient =
    totals.length === 0
      ? '#e2e8f0 0 100%'
      : totals
          .reduce<{ value: string; start: number }>(
            (result, item) => {
              const end = result.start + (item.amount / total) * 100;
              return { value: `${result.value}${item.color} ${result.start}% ${end}%, `, start: end };
            },
            { value: '', start: 0 }
          )
          .value.slice(0, -2);

  return (
    <Layout title="FinSync - Categories">
      <div className="mx-auto max-w-3xl space-y-5 pb-6">
        <div className="px-1">
          <p className="text-sm font-medium text-slate-500">Spending allocation</p>
          <h2 className="text-2xl font-bold text-primary">Categories</h2>
        </div>
        <div className="grid grid-cols-2 rounded-lg bg-slate-100 p-1" role="group" aria-label="Category scope">
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
        <Card className="border-0 bg-white shadow-sm">
          <CardContent className="grid gap-6 p-5 sm:grid-cols-[220px_1fr] sm:items-center">
            <div
              className="relative mx-auto flex h-52 w-52 items-center justify-center rounded-full"
              style={{ background: `conic-gradient(${gradient})` }}
              aria-label={`MYR ${total.toLocaleString()} in category commitments`}
            >
              <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-white text-center">
                <WalletCards className="mb-1 h-5 w-5 text-primary" />
                <span className="text-xs text-slate-500">Total</span>
                <strong className="text-lg text-primary">MYR {total.toLocaleString()}</strong>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary">Category breakdown</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {scope === 'month'
                  ? 'Commitments for the selected month.'
                  : 'All commitment months with recorded data.'}
              </p>
            </div>
          </CardContent>
        </Card>
        <section className="space-y-3" aria-label="Category totals">
          {loading ? (
            <Card className="border-blue-100">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">Loading categories...</CardContent>
            </Card>
          ) : error ? (
            <Card className="border-rose-100 bg-rose-50">
              <CardContent className="p-6 text-center text-sm text-rose-700">
                Unable to load categories. Please try again.
              </CardContent>
            </Card>
          ) : totals.length === 0 ? (
            <Card className="border-blue-100">
              <CardContent className="p-6 text-center">
                <p className="font-medium text-slate-700">No category data yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Add a commitment to see its category allocation.</p>
              </CardContent>
            </Card>
          ) : (
            totals.map(item => {
              const percentage = (item.amount / total) * 100;
              return (
                <Card key={item.category} className="border-blue-100 bg-white shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-full"
                        style={{ backgroundColor: `${item.color}1A`, color: item.color }}
                      >
                        <item.Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="font-semibold text-slate-800">{item.category}</p>
                          <p className="text-sm font-bold text-primary">MYR {item.amount.toLocaleString()}</p>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full"
                            style={{ backgroundColor: item.color, width: `${percentage}%` }}
                          />
                        </div>
                        <p className="mt-1 text-right text-xs text-slate-500">{percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </section>
      </div>
    </Layout>
  );
}
