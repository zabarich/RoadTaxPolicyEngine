'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePolicyEngineStore } from "@/lib/store/policy-engine-store";
import { constants } from "@/lib/data/constants";
import { RotateCcw } from "lucide-react";

interface DutyRateControlsProps {
  className?: string;
}

export function DutyRateControls({ className }: DutyRateControlsProps) {
  const { currentScenario, updateScenarioParameter } = usePolicyEngineStore();
  
  const currentEVDuty = currentScenario.parameters.dutyRates.ev[constants.modelingDefaults.startYear] || 
                       constants.financialConstants.currentEVDuty;

  const handleEVDutyChange = (values: number[]) => {
    const newValue = values[0];
    updateScenarioParameter(
      `parameters.dutyRates.ev.${constants.modelingDefaults.startYear}`, 
      newValue
    );
  };

  const handleEVDutyInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(event.target.value) || 0;
    if (newValue >= 0 && newValue <= constants.financialConstants.maximumDuty) {
      updateScenarioParameter(
        `parameters.dutyRates.ev.${constants.modelingDefaults.startYear}`, 
        newValue
      );
    }
  };

  const resetToBaseline = () => {
    updateScenarioParameter(
      `parameters.dutyRates.ev.${constants.modelingDefaults.startYear}`, 
      constants.financialConstants.currentEVDuty
    );
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
              onClick={() => handleEVDutyChange([currentICEDuty * 0.5])}
              className="text-xs"
            >
              50% of ICE
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleEVDutyChange([currentICEDuty * 0.75])}
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
      </CardContent>
    </Card>
  );
}
