'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MetricCard } from '@/components/ui/metric-card';
import { RevenueProjection } from '@/components/charts/revenue-projection';
import { FleetComposition } from '@/components/charts/fleet-composition';
import { DutyRateControls } from '@/components/inputs/duty-rate-controls';
import { usePolicyEngineStore } from '@/lib/store/policy-engine-store';
import { RevenueChartData, FleetChartData } from '@/lib/types';
import { constants } from '@/lib/data/constants';
import { Save, Download, RotateCcw, Calculator } from 'lucide-react';
import Link from 'next/link';

export default function ModelPage() {
  const { 
    currentScenario, 
    results, 
    isCalculating, 
    calculateResults,
    resetToBaseline
  } = usePolicyEngineStore();

  // Initial calculation
  useEffect(() => {
    if (!results) {
      calculateResults();
    }
  }, [calculateResults, results]);

  // Transform results into chart data
  const getRevenueChartData = (): RevenueChartData[] => {
    if (!results) return [];
    
    return Object.values(results.revenue.byYear).map(yearData => ({
      year: yearData.year,
      baseline: 15000000, // Simplified baseline
      scenario: yearData.total,
      ev: yearData.fromEV,
      ice: yearData.fromICE
    }));
  };

  const getFleetChartData = (): FleetChartData[] => {
    if (!results) return [];
    
    return Object.values(results.fleet.compositionByYear).map(yearData => ({
      year: yearData.year,
      evCount: yearData.ev,
      iceCount: yearData.ice,
      evPercentage: yearData.evPercentage,
      target: yearData.year === 2030 ? 20 : undefined // 20% target
    }));
  };

  const getKeyMetrics = () => {
    if (!results) return [];

    const currentYear = constants.modelingDefaults.startYear;
    const endYear = constants.modelingDefaults.endYear;
    const currentRevenue = results.revenue.byYear[currentYear];
    const finalRevenue = results.revenue.byYear[endYear];

    return [
      {
        title: `${currentYear} Revenue`,
        value: currentRevenue?.total || 0,
        format: 'currency' as const,
        severity: undefined
      },
      {
        title: `${endYear} Revenue`,
        value: finalRevenue?.total || 0,
        format: 'currency' as const,
        change: (finalRevenue?.total || 0) - 15000000,
        trend: (finalRevenue?.total || 0) > 15000000 ? 'up' as const : 'down' as const,
        severity: (finalRevenue?.total || 0) < 14000000 ? 'error' as const : 'success' as const
      },
      {
        title: 'Peak Revenue Gap',
        value: Math.abs(results.metrics.peakRevenueGap),
        format: 'currency' as const,
        trend: 'down' as const,
        severity: Math.abs(results.metrics.peakRevenueGap) > 1000000 ? 'error' as const : 'warning' as const
      },
      {
        title: 'Target Achievement',
        value: results.impacts.meetsTargets ? `${results.metrics.targetAchievementYear || 'N/A'}` : 'Not Met',
        format: 'number' as const,
        severity: results.impacts.meetsTargets ? 'success' as const : 'warning' as const
      }
    ];
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Policy Modeling Interface
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Scenario: {currentScenario.name}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/">
                <Button variant="outline">
                  Back to Dashboard
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={resetToBaseline}
                disabled={isCalculating}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button 
                onClick={calculateResults}
                disabled={isCalculating}
              >
                <Calculator className="h-4 w-4 mr-2" />
                {isCalculating ? 'Calculating...' : 'Recalculate'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1 space-y-6">
            <DutyRateControls />
            
            {/* Additional controls would go here */}
            <Card>
              <CardHeader>
                <CardTitle>Adoption Model</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Current: S-Curve model with 2030 target of 13,000 EVs
                </div>
                <div className="mt-4 space-y-2">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Linear Growth
                  </Button>
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Exponential Growth
                  </Button>
                  <Button size="sm" className="w-full text-xs">
                    S-Curve (Current)
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Save/Export Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save Scenario
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Center Panel - Visualizations */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="revenue" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="revenue">Revenue Projection</TabsTrigger>
                <TabsTrigger value="fleet">Fleet Composition</TabsTrigger>
              </TabsList>
              
              <TabsContent value="revenue" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Projection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {results ? (
                      <RevenueProjection 
                        data={getRevenueChartData()}
                        showBreakdown={true}
                      />
                    ) : (
                      <div className="h-96 flex items-center justify-center text-muted-foreground">
                        {isCalculating ? 'Calculating...' : 'No data available'}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="fleet" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Fleet Composition</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {results ? (
                      <FleetComposition 
                        data={getFleetChartData()}
                        targetLine={20}
                      />
                    ) : (
                      <div className="h-96 flex items-center justify-center text-muted-foreground">
                        {isCalculating ? 'Calculating...' : 'No data available'}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Panel - Metrics */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {getKeyMetrics().map((metric, index) => (
                    <MetricCard key={index} {...metric} />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Warnings/Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {results && (
                    <>
                      {results.metrics.peakRevenueGap < -1000000 && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border-l-4 border-red-500">
                          <div className="font-medium text-red-700 dark:text-red-300">
                            Critical Revenue Loss
                          </div>
                          <div className="text-red-600 dark:text-red-400">
                            Peak gap exceeds £1M annually
                          </div>
                        </div>
                      )}
                      
                      {!results.impacts.meetsTargets && (
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-500">
                          <div className="font-medium text-yellow-700 dark:text-yellow-300">
                            Target Not Met
                          </div>
                          <div className="text-yellow-600 dark:text-yellow-400">
                            EV adoption falls short of 2030 goal
                          </div>
                        </div>
                      )}
                      
                      {results.revenue.breakEvenYear && (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
                          <div className="font-medium text-green-700 dark:text-green-300">
                            Break-even Achieved
                          </div>
                          <div className="text-green-600 dark:text-green-400">
                            Revenue stabilizes by {results.revenue.breakEvenYear}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
