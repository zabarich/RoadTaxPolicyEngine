'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/ui/metric-card';
import { baselineData, currentSituation } from '@/lib/data/baseline-data';
import { BarChart3, AlertTriangle, Target, ArrowRight, Database } from 'lucide-react';
import { HeaderWithLogout } from '@/components/header-with-logout';

export default function HomePage() {
  // Calculate key metrics for the dashboard
  const keyMetrics = [
    {
      title: "Current Annual Revenue",
      value: currentSituation.revenue,
      format: 'currency' as const,
      trend: 'neutral' as const,
      severity: undefined
    },
    {
      title: "EV Market Share",
      value: currentSituation.evPercentage,
      format: 'percentage' as const,
      trend: 'up' as const,
      severity: 'success' as const
    },
    {
      title: "Projected 2030 Gap",
      value: currentSituation.projectedGap2030,
      format: 'currency' as const,
      trend: 'down' as const,
      severity: 'error' as const
    },
    {
      title: "Revenue at Risk",
      value: currentSituation.revenueAtRisk,
      format: 'currency' as const,
      trend: 'down' as const,
      severity: 'warning' as const
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <HeaderWithLogout />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Isle of Man Vehicle Duty Policy Engine
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Model and analyze the fiscal, environmental, and social impacts of vehicle duty policy changes 
            as electric vehicle adoption accelerates.
          </p>
        </div>

        {/* Crisis Alert */}
        <Card className="mb-8 border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Revenue Crisis Warning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  The Isle of Man faces a projected <strong>£{(currentSituation.projectedGap2030 / 1000000).toFixed(1)}M revenue shortfall by 2030</strong> as 
                  electric vehicle adoption accelerates. Each percentage point increase in EV market share 
                  costs approximately <strong>£{(baselineData.revenueModel.lossPerPercentFleet / 1000).toFixed(0)}k</strong> in annual revenue.
                </p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-700 dark:text-red-400">
                  {baselineData.fleet.projections.targetEVPercentage2030}%
                </div>
                <div className="text-sm text-red-600 dark:text-red-300">
                  Government EV target by 2030
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {keyMetrics.map((metric, index) => (
            <MetricCard key={index} {...metric} />
          ))}
        </div>

        {/* Current Situation Overview */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Fleet Composition
              </CardTitle>
              <CardDescription>
                Current vehicle distribution and charging infrastructure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Electric Vehicles</span>
                  <span className="text-sm">
                    {baselineData.fleet.currentComposition.ev.toLocaleString()} 
                    ({currentSituation.evPercentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${currentSituation.evPercentage}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">ICE Vehicles</span>
                  <span className="text-sm">
                    {baselineData.fleet.currentComposition.ice.toLocaleString()} 
                    ({(100 - currentSituation.evPercentage).toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${100 - currentSituation.evPercentage}%` }}
                  ></div>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>{baselineData.fleet.chargingInfrastructure.chargingPoints}</strong> charging points 
                    ({baselineData.fleet.chargingInfrastructure.vehiclesPerChargingPoint.toFixed(1)} EVs per point)
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Policy Context
              </CardTitle>
              <CardDescription>
                Revenue dependency and policy targets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                    {baselineData.financial.roadsAsPercentOfRevenue}%
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    of vehicle duty funds road maintenance
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-700 dark:text-gray-300">
                      £{(baselineData.revenueModel.revenuePerEV).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Average EV duty
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-700 dark:text-gray-300">
                      £{(baselineData.revenueModel.revenuePerICE).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Average ICE duty
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Government target: <strong>{baselineData.fleet.projections.governmentTarget2030.toLocaleString()}</strong> EVs by 2030
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="text-center">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">Start Modeling</CardTitle>
                <CardDescription>
                  Create scenarios and analyze policy impacts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/model">
                  <Button className="w-full" size="lg">
                    Open Policy Modeler
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">View Scenarios</CardTitle>
                <CardDescription>
                  Browse and compare saved policy scenarios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/scenarios">
                  <Button variant="outline" className="w-full" size="lg">
                    Browse Scenarios
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">Compare Options</CardTitle>
                <CardDescription>
                  Side-by-side scenario comparison tool
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/compare">
                  <Button variant="outline" className="w-full" size="lg">
                    Compare Scenarios
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Data Sources
                </CardTitle>
                <CardDescription>
                  View source data and provenance for transparency
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/data-sources">
                  <Button variant="outline" className="w-full" size="lg">
                    View Data Sources
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 pt-8 border-t text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            <Link href="/data-sources" className="hover:text-blue-600 dark:hover:text-blue-400 underline">
              Data sources
            </Link>
            : {baselineData.metadata.sources.join(', ')} | 
            Last updated: {baselineData.metadata.lastUpdated}
          </p>
        </div>
      </div>
    </div>
  );
}