'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MetricCard } from '@/components/ui/metric-card';
import { RevenueProjection } from '@/components/charts/revenue-projection';
import { FleetComposition } from '@/components/charts/fleet-composition';
import { usePolicyEngineStore } from '@/lib/store/policy-engine-store';
import { RevenueCalculator } from '@/lib/engine/revenue-calculator';
import { ScenarioResults, RevenueChartData, FleetChartData } from '@/lib/types';
import { ArrowLeft, BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';

interface ComparisonScenario {
  id: string;
  name: string;
  description: string;
  results: ScenarioResults | null;
  isLoading: boolean;
}

export default function ComparePage() {
  const { savedScenarios, fetchScenarios, baseline } = usePolicyEngineStore();
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>(['', '']);
  const [comparisonData, setComparisonData] = useState<ComparisonScenario[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadScenarios = async () => {
      await fetchScenarios();
      setIsLoading(false);
    };
    loadScenarios();
  }, [fetchScenarios]);

  const loadScenarioResults = async (scenarioId: string, index: number) => {
    if (!scenarioId) return;
    
    const updatedComparison = [...comparisonData];
    const scenario = savedScenarios.find(s => s.id === scenarioId);
    
    if (scenario) {
      updatedComparison[index] = {
        id: scenario.id,
        name: scenario.name,
        description: scenario.description,
        results: null,
        isLoading: true
      };
      setComparisonData(updatedComparison);

      try {
        // Load full scenario from API
        const response = await fetch(`/api/scenarios/${scenarioId}`);
        if (response.ok) {
          const data = await response.json();
          const fullScenario = {
            ...data.scenario,
            createdAt: new Date(data.scenario.createdAt),
            parameters: {
              ...data.scenario.parameters,
              dutyRates: {
                ev: Object.fromEntries(
                  Object.entries(data.scenario.parameters.dutyRates.ev).map(([year, rate]) => [parseInt(year), rate as number])
                ),
                iceBands: Object.fromEntries(
                  Object.entries(data.scenario.parameters.dutyRates.iceBands).map(([band, rates]) => [
                    band,
                    Object.fromEntries(
                      Object.entries(rates as Record<string, number>).map(([year, rate]) => [parseInt(year), rate])
                    )
                  ])
                )
              },
              adoptionModel: {
                ...data.scenario.parameters.adoptionModel,
                targetEVCount: Object.fromEntries(
                  Object.entries(data.scenario.parameters.adoptionModel.targetEVCount).map(([year, count]) => [parseInt(year), count as number])
                )
              }
            }
          };

          // Calculate results
          const calculator = new RevenueCalculator(baseline);
          const results = calculator.calculate(fullScenario);
          
          updatedComparison[index] = {
            ...updatedComparison[index],
            results,
            isLoading: false
          };
          setComparisonData([...updatedComparison]);
        }
      } catch (error) {
        console.error('Failed to load scenario:', error);
        updatedComparison[index] = {
          ...updatedComparison[index],
          isLoading: false
        };
        setComparisonData([...updatedComparison]);
      }
    }
  };

  const handleScenarioSelect = (scenarioId: string, index: number) => {
    const newSelection = [...selectedScenarios];
    newSelection[index] = scenarioId;
    setSelectedScenarios(newSelection);
    
    if (scenarioId) {
      loadScenarioResults(scenarioId, index);
    } else {
      const updatedComparison = [...comparisonData];
      updatedComparison[index] = {
        id: '',
        name: '',
        description: '',
        results: null,
        isLoading: false
      };
      setComparisonData(updatedComparison);
    }
  };

  const getRevenueComparisonData = (): RevenueChartData[] => {
    if (!comparisonData[0]?.results || !comparisonData[1]?.results) return [];
    
    const years = Object.keys(comparisonData[0].results.revenue.byYear).map(Number).sort();
    
    return years.map(year => ({
      year,
      baseline: 14702500, // Static baseline for comparison
      scenario: comparisonData[0].results!.revenue.byYear[year].total,
      ev: comparisonData[0].results!.revenue.byYear[year].fromEV,
      ice: comparisonData[0].results!.revenue.byYear[year].fromICE,
      scenario2: comparisonData[1].results!.revenue.byYear[year].total,
      ev2: comparisonData[1].results!.revenue.byYear[year].fromEV,
      ice2: comparisonData[1].results!.revenue.byYear[year].fromICE
    }));
  };

  const getFleetComparisonData = (): FleetChartData[] => {
    if (!comparisonData[0]?.results || !comparisonData[1]?.results) return [];
    
    const years = Object.keys(comparisonData[0].results.fleet.compositionByYear).map(Number).sort();
    
    return years.map(year => ({
      year,
      evCount: comparisonData[0].results!.fleet.compositionByYear[year].ev,
      iceCount: comparisonData[0].results!.fleet.compositionByYear[year].ice,
      evPercentage: comparisonData[0].results!.fleet.compositionByYear[year].evPercentage,
      evCount2: comparisonData[1].results!.fleet.compositionByYear[year].ev,
      iceCount2: comparisonData[1].results!.fleet.compositionByYear[year].ice,
      evPercentage2: comparisonData[1].results!.fleet.compositionByYear[year].evPercentage,
      target: year === 2030 ? 20 : undefined
    }));
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

  const bothScenariosLoaded = comparisonData[0]?.results && comparisonData[1]?.results;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Scenario Comparison
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Compare multiple policy scenarios side-by-side
            </p>
          </div>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-8">
              <div className="text-center text-muted-foreground">
                Loading scenarios...
              </div>
            </CardContent>
          </Card>
        ) : savedScenarios.length < 2 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Not Enough Scenarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                You need at least 2 saved scenarios to use the comparison tool. 
                Currently you have {savedScenarios.length} scenario{savedScenarios.length !== 1 ? 's' : ''}.
              </p>
              <Link href="/model">
                <Button>
                  Create More Scenarios
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Scenario Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Scenarios to Compare</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Scenario A</label>
                    <Select
                      value={selectedScenarios[0]}
                      onValueChange={(value) => handleScenarioSelect(value, 0)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select first scenario" />
                      </SelectTrigger>
                      <SelectContent>
                        {savedScenarios.map((scenario) => (
                          <SelectItem key={scenario.id} value={scenario.id}>
                            {scenario.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Scenario B</label>
                    <Select
                      value={selectedScenarios[1]}
                      onValueChange={(value) => handleScenarioSelect(value, 1)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select second scenario" />
                      </SelectTrigger>
                      <SelectContent>
                        {savedScenarios
                          .filter(s => s.id !== selectedScenarios[0])
                          .map((scenario) => (
                            <SelectItem key={scenario.id} value={scenario.id}>
                              {scenario.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {bothScenariosLoaded && (
              <>
                {/* Comparison Summary */}
                <div className="grid md:grid-cols-2 gap-6">
                  {comparisonData.map((scenario, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {scenario.name} (Scenario {String.fromCharCode(65 + index)})
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {scenario.description}
                        </p>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <MetricCard
                            title="Revenue Change"
                            value={scenario.results!.metrics.totalRevenueChange}
                            format="currency"
                            trend={scenario.results!.metrics.totalRevenueChange > 0 ? 'up' : 'down'}
                            severity={scenario.results!.metrics.totalRevenueChange > 0 ? 'success' : 'error'}
                          />
                          <MetricCard
                            title="Peak Gap"
                            value={Math.abs(scenario.results!.metrics.peakRevenueGap)}
                            format="currency"
                            severity={Math.abs(scenario.results!.metrics.peakRevenueGap) > 1000000 ? 'error' : 'success'}
                          />
                          <MetricCard
                            title="Target Year"
                            value={scenario.results!.metrics.targetAchievementYear || 'Not Met'}
                            format="number"
                            severity={scenario.results!.impacts.meetsTargets ? 'success' : 'warning'}
                          />
                          <MetricCard
                            title="Break-even"
                            value={scenario.results!.revenue.breakEvenYear || 'Never'}
                            format="number"
                            severity={scenario.results!.revenue.breakEvenYear && scenario.results!.revenue.breakEvenYear <= 2035 ? 'success' : 'warning'}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Comparative Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Comparative Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                          Better Revenue Performance
                        </div>
                        <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                          {comparisonData[0].results!.metrics.totalRevenueChange > comparisonData[1].results!.metrics.totalRevenueChange
                            ? comparisonData[0].name
                            : comparisonData[1].name}
                        </div>
                      </div>

                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <div className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                          Meets 2030 Targets
                        </div>
                        <div className="text-lg font-bold text-green-900 dark:text-green-100">
                          {comparisonData.filter(s => s.results!.impacts.meetsTargets).length} of 2
                        </div>
                      </div>

                      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                        <div className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                          Revenue Difference
                        </div>
                        <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                          {formatCurrency(Math.abs(
                            comparisonData[0].results!.metrics.totalRevenueChange - 
                            comparisonData[1].results!.metrics.totalRevenueChange
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Charts */}
                <Tabs defaultValue="revenue" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="revenue" className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Revenue Comparison
                    </TabsTrigger>
                    <TabsTrigger value="fleet" className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Fleet Comparison
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="revenue">
                    <Card>
                      <CardHeader>
                        <CardTitle>Revenue Projection Comparison</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {/* Note: This would need enhanced chart component for dual scenario comparison */}
                        <RevenueProjection 
                          data={getRevenueComparisonData()}
                          showBreakdown={false}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="fleet">
                    <Card>
                      <CardHeader>
                        <CardTitle>Fleet Composition Comparison</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {/* Note: This would need enhanced chart component for dual scenario comparison */}
                        <FleetComposition 
                          data={getFleetComparisonData()}
                          showPercentage={true}
                          targetLine={20}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            )}

            {comparisonData.some(s => s.isLoading) && (
              <Card>
                <CardContent className="p-8">
                  <div className="text-center text-muted-foreground">
                    Calculating scenario results...
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
