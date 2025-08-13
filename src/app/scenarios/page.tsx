'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/ui/metric-card';
import { usePolicyEngineStore } from '@/lib/store/policy-engine-store';
import { ArrowLeft, Plus, Trash2, Eye, Copy, Calendar } from 'lucide-react';

export default function ScenariosPage() {
  const { savedScenarios, fetchScenarios, loadScenario, deleteScenario } = usePolicyEngineStore();
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const loadScenarios = async () => {
      await fetchScenarios();
      setIsLoading(false);
    };
    loadScenarios();
  }, [fetchScenarios]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scenario?')) return;
    
    setDeletingId(id);
    try {
      await deleteScenario(id);
    } catch (error) {
      console.error('Failed to delete scenario:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleLoad = async (id: string) => {
    try {
      await loadScenario(id);
      // Navigate to model page
      window.location.href = '/model';
    } catch (error) {
      console.error('Failed to load scenario:', error);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: Math.abs(value) >= 1000000 ? 'compact' : 'standard'
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Saved Scenarios
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Browse and manage your policy scenarios
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <Link href="/model">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Scenario
              </Button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-8">
              <div className="text-center text-muted-foreground">
                Loading scenarios...
              </div>
            </CardContent>
          </Card>
        ) : savedScenarios.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Scenarios Yet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                You haven&apos;t saved any scenarios yet. Create your first scenario to start comparing policy options.
              </p>
              <Link href="/model">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Scenario
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {/* Summary Stats */}
            <div className="grid md:grid-cols-3 gap-4">
              <MetricCard
                title="Total Scenarios"
                value={savedScenarios.length}
                format="number"
              />
              <MetricCard
                title="Best Revenue Impact"
                value={Math.max(...savedScenarios.map(s => s.keyMetrics.totalRevenueChange))}
                format="currency"
                trend="up"
                severity="success"
              />
              <MetricCard
                title="Worst Revenue Impact" 
                value={Math.min(...savedScenarios.map(s => s.keyMetrics.totalRevenueChange))}
                format="currency"
                trend="down"
                severity="error"
              />
            </div>

            {/* Scenarios List */}
            <div className="grid gap-4">
              {savedScenarios.map((scenario) => (
                <Card key={scenario.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{scenario.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {scenario.description || 'No description provided'}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Created: {formatDate(scenario.createdAt)}
                          </div>
                          <div>
                            ID: {scenario.id}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLoad(scenario.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Load & Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLoad(scenario.id)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(scenario.id)}
                          disabled={deletingId === scenario.id}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {deletingId === scenario.id ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                          {formatCurrency(scenario.keyMetrics.totalRevenueChange)}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400">
                          Total Revenue Change
                        </div>
                      </div>

                      <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                        <div className="text-lg font-semibold text-red-700 dark:text-red-300">
                          {formatCurrency(Math.abs(scenario.keyMetrics.peakGap))}
                        </div>
                        <div className="text-xs text-red-600 dark:text-red-400">
                          Peak Revenue Gap
                        </div>
                      </div>

                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                        <div className="text-lg font-semibold text-green-700 dark:text-green-300">
                          {scenario.keyMetrics.targetYear || 'Not Met'}
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-400">
                          Target Achievement
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Comparison Link */}
            {savedScenarios.length >= 2 && (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-semibold mb-2">Compare Scenarios</h3>
                  <p className="text-muted-foreground mb-4">
                    You have {savedScenarios.length} scenarios. Compare them side-by-side to make informed decisions.
                  </p>
                  <Link href="/compare">
                    <Button>
                      <Copy className="h-4 w-4 mr-2" />
                      Compare Scenarios
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
