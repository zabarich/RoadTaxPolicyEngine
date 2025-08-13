'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePolicyEngineStore } from "@/lib/store/policy-engine-store";
import { constants } from "@/lib/data/constants";
import { RotateCcw, TrendingUp } from "lucide-react";

interface AdoptionCurveEditorProps {
  className?: string;
}

export function AdoptionCurveEditor({ className }: AdoptionCurveEditorProps) {
  const { currentScenario, updateScenarioParameter } = usePolicyEngineStore();
  
  const adoptionModel = currentScenario.parameters.adoptionModel;
  const target2030 = adoptionModel.targetEVCount[2030] || constants.fleetConstants.currentEVCount;

  const handleTypeChange = (type: 'linear' | 'exponential' | 'sCurve' | 'custom') => {
    updateScenarioParameter('parameters.adoptionModel.type', type);
  };

  const handleTargetChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(event.target.value) || 0;
    if (newValue >= 0 && newValue <= constants.fleetConstants.totalVehicles) {
      updateScenarioParameter('parameters.adoptionModel.targetEVCount.2030', newValue);
    }
  };

  const handleElasticityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(event.target.value) || 0;
    if (newValue >= -1 && newValue <= 1) {
      updateScenarioParameter('parameters.adoptionModel.priceElasticity', newValue);
    }
  };

  const resetToDefaults = () => {
    updateScenarioParameter('parameters.adoptionModel.type', 'sCurve');
    updateScenarioParameter('parameters.adoptionModel.targetEVCount.2030', 13000);
    updateScenarioParameter('parameters.adoptionModel.priceElasticity', -0.3);
  };

  const getTargetPercentage = () => {
    return (target2030 / constants.fleetConstants.totalVehicles * 100).toFixed(1);
  };

  const getProjectedGrowth = () => {
    const currentEVs = constants.fleetConstants.currentEVCount;
    const years = 2030 - 2024;
    const annualGrowthRate = Math.pow(target2030 / currentEVs, 1 / years) - 1;
    return (annualGrowthRate * 100).toFixed(1);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Adoption Model
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={resetToDefaults}
            className="h-8 w-8 p-0"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Model Type Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Growth Pattern</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant={adoptionModel.type === 'linear' ? 'default' : 'outline'}
              size="sm" 
              className="text-xs"
              onClick={() => handleTypeChange('linear')}
            >
              Linear
            </Button>
            <Button 
              variant={adoptionModel.type === 'exponential' ? 'default' : 'outline'}
              size="sm" 
              className="text-xs"
              onClick={() => handleTypeChange('exponential')}
            >
              Exponential
            </Button>
            <Button 
              variant={adoptionModel.type === 'sCurve' ? 'default' : 'outline'}
              size="sm" 
              className="text-xs col-span-2"
              onClick={() => handleTypeChange('sCurve')}
            >
              S-Curve (Recommended)
            </Button>
          </div>
        </div>

        {/* Target Settings */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="ev-target">2030 EV Target</Label>
            <div className="flex items-center gap-2">
              <Input
                id="ev-target"
                type="number"
                value={target2030}
                onChange={handleTargetChange}
                className="w-20 h-8 text-sm"
                min={constants.fleetConstants.currentEVCount}
                max={constants.fleetConstants.totalVehicles}
              />
              <span className="text-sm text-muted-foreground">EVs</span>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Target: {getTargetPercentage()}% of fleet ({target2030.toLocaleString()} vehicles)
          </div>
        </div>

        {/* Price Elasticity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="price-elasticity">Price Elasticity</Label>
            <div className="flex items-center gap-2">
              <Input
                id="price-elasticity"
                type="number"
                value={adoptionModel.priceElasticity}
                onChange={handleElasticityChange}
                className="w-20 h-8 text-sm"
                min={-1}
                max={1}
                step={0.05}
              />
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            <strong>Policy Assumption:</strong> How much duty changes affect EV adoption
          </div>
          <div className="text-xs space-y-1">
            <div>• <strong>0.0</strong> = Duty has no effect on adoption</div>
            <div>• <strong>-0.1</strong> = Small effect (realistic for annual fees)</div>
            <div>• <strong>-0.3</strong> = Large effect (like purchase price sensitivity)</div>
          </div>
        </div>

        {/* Quick Elasticity Presets */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Common Assumptions</Label>
          <div className="grid grid-cols-3 gap-1">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => updateScenarioParameter('parameters.adoptionModel.priceElasticity', 0)}
              className="text-xs p-1"
            >
              No Effect
              <br />
              <span className="text-xs text-muted-foreground">(0.0)</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => updateScenarioParameter('parameters.adoptionModel.priceElasticity', -0.05)}
              className="text-xs p-1"
            >
              Minimal
              <br />
              <span className="text-xs text-muted-foreground">(-0.05)</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => updateScenarioParameter('parameters.adoptionModel.priceElasticity', -0.3)}
              className="text-xs p-1"
            >
              Strong
              <br />
              <span className="text-xs text-muted-foreground">(-0.3)</span>
            </Button>
          </div>
        </div>

        {/* Growth Metrics */}
        <div className="space-y-3 pt-3 border-t">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                {getProjectedGrowth()}%
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">
                Annual growth needed
              </div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div className="text-lg font-semibold text-green-700 dark:text-green-300">
                {((target2030 - constants.fleetConstants.currentEVCount) / (2030 - 2024)).toFixed(0)}
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">
                EVs per year
              </div>
            </div>
          </div>
        </div>

        {/* Preset Targets */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Quick Targets</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => updateScenarioParameter('parameters.adoptionModel.targetEVCount.2030', 10000)}
              className="text-xs"
            >
              Conservative
              <br />
              <span className="text-xs text-muted-foreground">10k EVs</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => updateScenarioParameter('parameters.adoptionModel.targetEVCount.2030', 13000)}
              className="text-xs"
            >
              Government
              <br />
              <span className="text-xs text-muted-foreground">13k EVs</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => updateScenarioParameter('parameters.adoptionModel.targetEVCount.2030', 16000)}
              className="text-xs"
            >
              Ambitious
              <br />
              <span className="text-xs text-muted-foreground">16k EVs</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => updateScenarioParameter('parameters.adoptionModel.targetEVCount.2030', 20000)}
              className="text-xs"
            >
              Aggressive
              <br />
              <span className="text-xs text-muted-foreground">20k EVs</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
