'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePolicyEngineStore } from "@/lib/store/policy-engine-store";
import { CategoryAdjustment } from "@/lib/types";
import { constants } from "@/lib/data/constants";
import { RotateCcw, ChevronDown } from "lucide-react";

interface DutyRateControlsProps {
  className?: string;
}

export function DutyRateControls({ className }: DutyRateControlsProps) {
  const { currentScenario, updateScenarioParameter } = usePolicyEngineStore();
  
  const currentEVDuty = currentScenario.parameters.dutyRates.ev[constants.modelingDefaults.startYear] || 
                       constants.financialConstants.currentEVDuty;

  const handleEVDutyChange = (values: number[]) => {
    const newValue = values[0];
    // Set the duty rate for all years from start to end
    for (let year = constants.modelingDefaults.startYear; year <= constants.modelingDefaults.endYear; year++) {
      updateScenarioParameter(`parameters.dutyRates.ev.${year}`, newValue);
    }
  };

  const handleEVDutyInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(event.target.value) || 0;
    if (newValue >= 0 && newValue <= constants.financialConstants.maximumDuty) {
      // Set the duty rate for all years from start to end
      for (let year = constants.modelingDefaults.startYear; year <= constants.modelingDefaults.endYear; year++) {
        updateScenarioParameter(`parameters.dutyRates.ev.${year}`, newValue);
      }
    }
  };

  const resetToBaseline = () => {
    for (let year = constants.modelingDefaults.startYear; year <= constants.modelingDefaults.endYear; year++) {
      updateScenarioParameter(`parameters.dutyRates.ev.${year}`, constants.financialConstants.currentEVDuty);
    }
  };

  const currentICEDuty = constants.financialConstants.averageICEDuty;
  const dutyRatio = (currentEVDuty / currentICEDuty * 100);
  const revenuePerConversion = currentICEDuty - currentEVDuty;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Duty Rates
          <Button 
            variant="outline" 
            size="sm"
            onClick={resetToBaseline}
            className="h-8 w-8 p-0"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* EV Duty Control */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="ev-duty">Electric Vehicle Duty</Label>
            <div className="flex items-center gap-2">
              <Input
                id="ev-duty-input"
                type="number"
                value={currentEVDuty}
                onChange={handleEVDutyInputChange}
                className="w-20 h-8 text-sm"
                min={0}
                max={constants.financialConstants.maximumDuty}
              />
              <span className="text-sm text-muted-foreground">£</span>
            </div>
          </div>
          
          <div className="px-2">
            <Slider
              id="ev-duty"
              min={0}
              max={500}
              step={5}
              value={[currentEVDuty]}
              onValueChange={handleEVDutyChange}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>£0</span>
              <span>£500</span>
            </div>
          </div>
        </div>

        {/* ICE Duty Reference */}
        <div className="space-y-2">
          <Label>ICE Vehicle Duty (Average)</Label>
          <div className="flex items-center justify-between bg-muted p-3 rounded-lg">
            <span className="text-sm">Current average rate</span>
            <span className="font-semibold">£{currentICEDuty}</span>
          </div>
        </div>

        {/* Impact Metrics */}
        <div className="space-y-3 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                {dutyRatio.toFixed(1)}%
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">
                EV duty as % of ICE
              </div>
            </div>
            
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <div className="text-lg font-semibold text-red-700 dark:text-red-300">
                £{revenuePerConversion}
              </div>
              <div className="text-xs text-red-600 dark:text-red-400">
                Loss per conversion
              </div>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Each EV conversion costs £{revenuePerConversion} in annual revenue compared to ICE vehicles.
          </div>
        </div>

        {/* Preset Buttons */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Quick Presets</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleEVDutyChange([0])}
              className="text-xs"
            >
              Zero Duty
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleEVDutyChange([Math.round(currentICEDuty * 0.5)])}
              className="text-xs"
            >
              50% of ICE
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleEVDutyChange([Math.round(currentICEDuty * 0.75)])}
              className="text-xs"
            >
              75% of ICE
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleEVDutyChange([currentICEDuty])}
              className="text-xs"
            >
              Equal to ICE
            </Button>
          </div>
        </div>

        {/* Category Adjustments Section */}
        <CategoryAdjustmentSection />
      </CardContent>
    </Card>
  );
}

// Category Adjustment Component
function CategoryAdjustmentSection() {
  const { currentScenario, updateScenarioParameter } = usePolicyEngineStore();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedYear, setSelectedYear] = useState(2025);

  // Key categories for manual adjustment
  const categories = [
    { id: 'ev', name: 'Electric Vehicles', baseRate: 65, path: 'ev' },
    { id: 'motorcycles', name: 'Motorcycles', baseRate: 28, path: 'motorcycles' },
    { id: 'light-goods', name: 'Light Goods (≤7.5t)', baseRate: 363, path: 'goodsVehicles.light' },
    { id: 'heavy-goods', name: 'Heavy Goods (>12t)', baseRate: 1100, path: 'goodsVehicles.heavy' },
    { id: 'high-emission', name: 'High Emission ICE', baseRate: 700, path: 'emissionBands.N' },
    { id: 'agricultural', name: 'Agricultural', baseRate: 65, path: 'specialCategories.agricultural' }
  ];

  const setAdjustment = (path: string, year: number, type: CategoryAdjustment['type'], value: number) => {
    const adjustment: CategoryAdjustment = {
      type,
      value,
      startYear: year,
      description: `${type === 'lift' ? 'Increase' : type === 'reduce' ? 'Decrease' : 'Hold'} for ${year}`
    };
    
    const parameterPath = `parameters.categoryAdjustments.${path}.${year}`;
    updateScenarioParameter(parameterPath, adjustment);
  };

  const removeAdjustment = (path: string, year: number) => {
    const parameterPath = `parameters.categoryAdjustments.${path}.${year}`;
    updateScenarioParameter(parameterPath, undefined);
  };

  const getAdjustment = (path: string, year: number): CategoryAdjustment | null => {
    if (!currentScenario.parameters.categoryAdjustments) return null;
    
    const parts = path.split('.');
    let adjustments: any = currentScenario.parameters.categoryAdjustments;
    
    for (const part of parts) {
      adjustments = adjustments?.[part];
      if (!adjustments) return null;
    }
    
    return adjustments[year] || null;
  };

  const calculateAdjustedRate = (baseRate: number, adjustment: CategoryAdjustment | null) => {
    if (!adjustment) return baseRate;
    
    switch (adjustment.type) {
      case 'lift':
        return baseRate * (1 + adjustment.value / 100);
      case 'reduce':
        return baseRate * (1 - adjustment.value / 100);
      case 'hold':
        return baseRate;
      case 'absolute':
        return adjustment.value;
      default:
        return baseRate;
    }
  };

  const getAdjustmentDisplay = (adjustment: CategoryAdjustment | null) => {
    if (!adjustment) return 'Base Rate';
    
    switch (adjustment.type) {
      case 'lift':
        return `+${adjustment.value}%`;
      case 'reduce':
        return `-${adjustment.value}%`;
      case 'hold':
        return 'Hold';
      case 'absolute':
        return `£${adjustment.value}`;
      default:
        return 'Base Rate';
    }
  };

  return (
    <div className="space-y-3 pt-4 border-t">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Category Adjustments</Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="h-8 text-xs"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced
          <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      <div className="text-xs text-muted-foreground">
        Apply manual lift, hold, or reduce adjustments to specific vehicle categories per year.
      </div>

      {showAdvanced && (
        <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
          {/* Year Selection */}
          <div className="flex items-center gap-2">
            <Label className="text-xs font-medium">Adjustment Year:</Label>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number(value))}>
              <SelectTrigger className="w-24 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => 2024 + i).map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Controls */}
          <div className="space-y-3">
            <Label className="text-xs font-medium">Vehicle Categories</Label>
            {categories.map((category) => {
              const adjustment = getAdjustment(category.path, selectedYear);
              const adjustedRate = calculateAdjustedRate(category.baseRate, adjustment);
              const hasAdjustment = !!adjustment;
              
              return (
                <div key={category.id} className="grid grid-cols-4 gap-2 items-center text-xs p-2 rounded border">
                  {/* Category Name */}
                  <div className="font-medium">{category.name}</div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-1">
                    <Button
                      variant={adjustment?.type === 'reduce' ? 'default' : 'outline'}
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        if (adjustment?.type === 'reduce') {
                          removeAdjustment(category.path, selectedYear);
                        } else {
                          setAdjustment(category.path, selectedYear, 'reduce', 15);
                        }
                      }}
                    >
                      -15%
                    </Button>
                    <Button
                      variant={adjustment?.type === 'hold' ? 'default' : 'outline'}
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        if (adjustment?.type === 'hold') {
                          removeAdjustment(category.path, selectedYear);
                        } else {
                          setAdjustment(category.path, selectedYear, 'hold', 0);
                        }
                      }}
                    >
                      Hold
                    </Button>
                    <Button
                      variant={adjustment?.type === 'lift' ? 'default' : 'outline'}
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        if (adjustment?.type === 'lift') {
                          removeAdjustment(category.path, selectedYear);
                        } else {
                          setAdjustment(category.path, selectedYear, 'lift', 20);
                        }
                      }}
                    >
                      +20%
                    </Button>
                  </div>
                  
                  {/* Current Rate */}
                  <div className="text-right">
                    <div className={`font-semibold ${hasAdjustment ? 'text-blue-600' : 'text-gray-600'}`}>
                      £{Math.round(adjustedRate)}
                    </div>
                  </div>
                  
                  {/* Adjustment Status */}
                  <div className="text-right">
                    <div className={`text-xs ${hasAdjustment ? 'text-blue-600' : 'text-muted-foreground'}`}>
                      {getAdjustmentDisplay(adjustment)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                categories.forEach(cat => removeAdjustment(cat.path, selectedYear));
              }}
            >
              Clear All
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                // Environmental policy: incentivize EVs, penalize high emissions
                setAdjustment('ev', selectedYear, 'reduce', 20);
                setAdjustment('emissionBands.N', selectedYear, 'lift', 30);
                setAdjustment('specialCategories.agricultural', selectedYear, 'reduce', 10);
              }}
            >
              Environmental Policy
            </Button>
          </div>

          <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
            💡 <strong>How it works:</strong> Select a year, then click the buttons to apply adjustments. 
            Blue rates show active adjustments. Changes apply from the selected year onwards.
          </div>
        </div>
      )}
    </div>
  );
}
