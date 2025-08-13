'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MetricCard } from '@/components/ui/metric-card';
import { RevenueProjection } from '@/components/charts/revenue-projection';
import { FleetComposition } from '@/components/charts/fleet-composition';
import { DutyRateControls } from '@/components/inputs/duty-rate-controls';
import { AdoptionCurveEditor } from '@/components/inputs/adoption-curve-editor';
import { PolicyMechanisms } from '@/components/inputs/policy-mechanisms';
import { PresetScenarios } from '@/components/inputs/preset-scenarios';

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
    resetToBaseline,
    saveScenario,
    exportToPDF,
    exportToCSV,
    downloadScenario
  } = usePolicyEngineStore();

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioDescription, setScenarioDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Initial calculation
  useEffect(() => {
    if (!results) {
      calculateResults();
    }
  }, [calculateResults, results]);

  const handleSaveScenario = async () => {
    if (!scenarioName.trim()) return;
    
    setIsSaving(true);
    try {
      await saveScenario(scenarioName.trim(), scenarioDescription.trim());
      setShowSaveDialog(false);
      setScenarioName('');
      setScenarioDescription('');
    } catch (error) {
      console.error('Failed to save scenario:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPDF = async (template: 'executive' | 'detailed' | 'technical' = 'executive') => {
    setIsExporting(true);
    try {
      await exportToPDF(template);
    } catch (error) {
      console.error('Failed to export PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = () => {
    try {
      exportToCSV();
    } catch (error) {
      console.error('Failed to export CSV:', error);
    }
  };

  // Transform results into chart data
  const getRevenueChartData = (): RevenueChartData[] => {
    if (!results) return [];
    
    return Object.values(results.revenue.byYear).map(yearData => {
      // Calculate baseline revenue using the same logic as the calculator
      const yearOffset = yearData.year - 2024;
      let baselineRevenue: number;
      
      if (yearOffset === 0) {
        baselineRevenue = 14702500;
      } else {
        // Natural EV growth with current duty rates (5% annual growth, cap at 15%)
        const currentEVs = 1500;
        const projectedEVs = Math.min(
          currentEVs * Math.pow(1.05, yearOffset),
          65000 * 0.15
        );
        const projectedICEs = 65000 - projectedEVs;
        baselineRevenue = (projectedEVs * 65) + (projectedICEs * 230);
      }
      
      return {
        year: yearData.year,
        baseline: baselineRevenue,
        scenario: yearData.total,
        ev: yearData.fromEV,
        ice: yearData.fromICE
      };
    });
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
        title: 'Peak Revenue Impact',
        value: Math.abs(results.metrics.peakRevenueGap),
        format: 'currency' as const,
        change: -results.metrics.peakRevenueGap, // Negative gap = positive impact
        trend: results.metrics.peakRevenueGap < 0 ? 'up' as const : 'down' as const,
        severity: results.metrics.peakRevenueGap > 1000000 ? 'error' as const : 
                 results.metrics.peakRevenueGap < -500000 ? 'success' as const : 'warning' as const
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
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Panel - Controls with Tabs for Better UX */}
          <div className="lg:col-span-4">
            <div className="sticky top-6">
              <Tabs defaultValue="controls" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="controls" className="text-xs">Controls</TabsTrigger>
                  <TabsTrigger value="presets" className="text-xs">Presets</TabsTrigger>
                  <TabsTrigger value="actions" className="text-xs">Actions</TabsTrigger>
                </TabsList>
                
                <TabsContent value="controls" className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                  <DutyRateControls />
                  <AdoptionCurveEditor />
                  <PolicyMechanisms />
                </TabsContent>
                
                <TabsContent value="presets" className="space-y-4">
                  <PresetScenarios />
                </TabsContent>
                
                <TabsContent value="actions" className="space-y-4">
                  {/* Save/Export Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Save & Export</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button 
                        className="w-full" 
                        size="sm"
                        onClick={() => setShowSaveDialog(true)}
                        disabled={isSaving}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save Scenario'}
                      </Button>
                      
                      <div className="space-y-2">
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          size="sm"
                          onClick={() => handleExportPDF('executive')}
                          disabled={isExporting}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {isExporting ? 'Exporting...' : 'Export PDF'}
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          size="sm"
                          onClick={handleExportCSV}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export CSV Data
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          size="sm"
                          onClick={() => downloadScenario()}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Scenario
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Right Panel - Results (Wider for better visibility) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Key Metrics - Always Visible at Top */}
            <Card>
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {getKeyMetrics().map((metric, index) => (
                    <MetricCard key={index} {...metric} />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Charts */}
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

            {/* Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  {results && (
                    <>
                      {results.metrics.peakRevenueGap > 1000000 && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border-l-4 border-red-500">
                          <div className="font-medium text-red-700 dark:text-red-300">
                            Critical Revenue Loss
                          </div>
                          <div className="text-red-600 dark:text-red-400">
                            Peak loss exceeds £1M annually
                          </div>
                        </div>
                      )}
                      
                      {results.metrics.peakRevenueGap < -1000000 && (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
                          <div className="font-medium text-green-700 dark:text-green-300">
                            Significant Revenue Gain
                          </div>
                          <div className="text-green-600 dark:text-green-400">
                            Peak gain exceeds £1M annually
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

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Save Scenario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name *</label>
                <input
                  type="text"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  className="w-full p-2 border rounded-md mt-1"
                  placeholder="Enter scenario name"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={scenarioDescription}
                  onChange={(e) => setScenarioDescription(e.target.value)}
                  className="w-full p-2 border rounded-md mt-1 h-20 resize-none"
                  placeholder="Optional description"
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setShowSaveDialog(false);
                    setScenarioName('');
                    setScenarioDescription('');
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm"
                  onClick={handleSaveScenario}
                  disabled={!scenarioName.trim() || isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
