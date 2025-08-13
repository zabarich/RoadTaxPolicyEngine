'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePolicyEngineStore } from "@/lib/store/policy-engine-store";
import { constants } from "@/lib/data/constants";
import { Scale, Route, Calendar } from "lucide-react";

interface PolicyMechanismsProps {
  className?: string;
}

export function PolicyMechanisms({ className }: PolicyMechanismsProps) {
  const { currentScenario, updateScenarioParameter } = usePolicyEngineStore();
  
  const weightBased = currentScenario.parameters.policyMechanisms.weightBased;
  const distanceBased = currentScenario.parameters.policyMechanisms.distanceBased;

  const handleWeightBasedToggle = (enabled: boolean) => {
    updateScenarioParameter('parameters.policyMechanisms.weightBased.enabled', enabled);
  };

  const handleWeightRateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value) || 0;
    updateScenarioParameter('parameters.policyMechanisms.weightBased.ratePerKg', value);
  };

  const handleWeightStartYearChange = (year: string) => {
    updateScenarioParameter('parameters.policyMechanisms.weightBased.startYear', parseInt(year));
  };

  const handleDistanceBasedToggle = (enabled: boolean) => {
    updateScenarioParameter('parameters.policyMechanisms.distanceBased.enabled', enabled);
  };

  const handleDistanceRateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value) || 0;
    updateScenarioParameter('parameters.policyMechanisms.distanceBased.ratePerMile', value);
  };

  const handleDistanceStartYearChange = (year: string) => {
    updateScenarioParameter('parameters.policyMechanisms.distanceBased.startYear', parseInt(year));
  };

  const handleAverageMilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value) || 0;
    updateScenarioParameter('parameters.policyMechanisms.distanceBased.averageMilesPerVehicle', value);
  };

  const getYearOptions = () => {
    const years = [];
    for (let year = constants.modelingDefaults.startYear; year <= constants.modelingDefaults.endYear; year++) {
      years.push(year);
    }
    return years;
  };

  const calculateWeightBasedRevenue = () => {
    if (!weightBased.enabled) return 0;
    // Simplified calculation - assume average EV weight of 1800kg
    const averageEVWeight = 1800;
    const estimatedEVs = 5000; // Mid-range estimate
    return estimatedEVs * averageEVWeight * weightBased.ratePerKg;
  };

  const calculateDistanceBasedRevenue = () => {
    if (!distanceBased.enabled) return 0;
    const estimatedEVs = 5000; // Mid-range estimate
    return estimatedEVs * distanceBased.averageMilesPerVehicle * distanceBased.ratePerMile;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Policy Mechanisms</CardTitle>
        <p className="text-sm text-muted-foreground">
          Alternative revenue mechanisms to complement duty rates
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Weight-Based Mechanism */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4" />
              <Label htmlFor="weight-based" className="font-medium">
                Weight-Based Duty
              </Label>
            </div>
            <Switch
              id="weight-based"
              checked={weightBased.enabled}
              onCheckedChange={handleWeightBasedToggle}
            />
          </div>

          {weightBased.enabled && (
            <div className="space-y-3 pl-6 border-l-2 border-blue-200 dark:border-blue-800">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Rate per kg</Label>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={weightBased.ratePerKg}
                      onChange={handleWeightRateChange}
                      className="h-8 text-sm"
                      min={0}
                      max={1}
                      step={0.01}
                    />
                    <span className="text-xs text-muted-foreground">£</span>
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Start Year</Label>
                  <Select
                    value={weightBased.startYear.toString()}
                    onValueChange={handleWeightStartYearChange}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getYearOptions().map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Estimated Annual Revenue
                </div>
                <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  £{calculateWeightBasedRevenue().toLocaleString()}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  Based on average EV weight of 1,800kg
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                <div>• Heavier vehicles pay more (EVs typically 1.5-2.0t)</div>
                <div>• Fairer based on road wear impact</div>
                <div>• May encourage lighter vehicle designs</div>
              </div>
            </div>
          )}
        </div>

        {/* Distance-Based Mechanism */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Route className="h-4 w-4" />
              <Label htmlFor="distance-based" className="font-medium">
                Distance-Based Duty
              </Label>
            </div>
            <Switch
              id="distance-based"
              checked={distanceBased.enabled}
              onCheckedChange={handleDistanceBasedToggle}
            />
          </div>

          {distanceBased.enabled && (
            <div className="space-y-3 pl-6 border-l-2 border-green-200 dark:border-green-800">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Rate per mile</Label>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={distanceBased.ratePerMile}
                      onChange={handleDistanceRateChange}
                      className="h-8 text-sm"
                      min={0}
                      max={0.1}
                      step={0.001}
                    />
                    <span className="text-xs text-muted-foreground">£</span>
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Start Year</Label>
                  <Select
                    value={distanceBased.startYear.toString()}
                    onValueChange={handleDistanceStartYearChange}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getYearOptions().map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs">Average miles per vehicle/year</Label>
                <Input
                  type="number"
                  value={distanceBased.averageMilesPerVehicle}
                  onChange={handleAverageMilesChange}
                  className="h-8 text-sm mt-1"
                  min={0}
                  max={50000}
                />
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <div className="text-sm font-medium text-green-700 dark:text-green-300">
                  Estimated Annual Revenue
                </div>
                <div className="text-lg font-bold text-green-900 dark:text-green-100">
                  £{calculateDistanceBasedRevenue().toLocaleString()}
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">
                  Based on {distanceBased.averageMilesPerVehicle} miles/year average
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                <div>• Pay based on actual road usage</div>
                <div>• Requires odometer tracking or GPS</div>
                <div>• Most equitable but complex implementation</div>
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        {(weightBased.enabled || distanceBased.enabled) && (
          <div className="pt-4 border-t">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                  Additional Mechanisms Active
                </span>
              </div>
              <div className="text-xs text-yellow-600 dark:text-yellow-400 space-y-1">
                {weightBased.enabled && (
                  <div>• Weight-based duty from {weightBased.startYear}</div>
                )}
                {distanceBased.enabled && (
                  <div>• Distance-based duty from {distanceBased.startYear}</div>
                )}
                <div className="pt-1 font-medium">
                  Total Additional Revenue: £{(calculateWeightBasedRevenue() + calculateDistanceBasedRevenue()).toLocaleString()}/year
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Presets */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Quick Presets</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                updateScenarioParameter('parameters.policyMechanisms.weightBased.enabled', true);
                updateScenarioParameter('parameters.policyMechanisms.weightBased.ratePerKg', 0.05);
                updateScenarioParameter('parameters.policyMechanisms.weightBased.startYear', 2026);
              }}
              className="text-xs p-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Light Weight Tax
              <br />
              <span className="text-muted-foreground">£0.05/kg from 2026</span>
            </button>
            
            <button
              onClick={() => {
                updateScenarioParameter('parameters.policyMechanisms.distanceBased.enabled', true);
                updateScenarioParameter('parameters.policyMechanisms.distanceBased.ratePerMile', 0.01);
                updateScenarioParameter('parameters.policyMechanisms.distanceBased.startYear', 2027);
                updateScenarioParameter('parameters.policyMechanisms.distanceBased.averageMilesPerVehicle', 8000);
              }}
              className="text-xs p-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Mileage Tax
              <br />
              <span className="text-muted-foreground">1p/mile from 2027</span>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
