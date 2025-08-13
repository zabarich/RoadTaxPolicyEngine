'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePolicyEngineStore } from "@/lib/store/policy-engine-store";
import { constants } from "@/lib/data/constants";
import { ScenarioConfig } from "@/lib/types";
import { Zap, TrendingUp, DollarSign, Scale, Target } from "lucide-react";

interface PresetScenariosProps {
  className?: string;
}

export function PresetScenarios({ className }: PresetScenariosProps) {
  const { updateScenarioParameter, currentScenario } = usePolicyEngineStore();

  const createPresetScenario = (presetName: string): Partial<ScenarioConfig> => {
    const baseScenario = {
      parameters: {
        timeline: {
          startYear: constants.modelingDefaults.startYear,
          endYear: constants.modelingDefaults.endYear
        },
        dutyRates: {
          ev: {},
          iceBands: {}
        },
        adoptionModel: {
          type: 'sCurve' as const,
          targetEVCount: {
            2030: 13000
          },
          priceElasticity: -0.3
        },
        policyMechanisms: {
          weightBased: {
            enabled: false,
            ratePerKg: 0,
            startYear: constants.modelingDefaults.startYear
          },
          distanceBased: {
            enabled: false,
            ratePerMile: 0,
            startYear: constants.modelingDefaults.startYear,
            averageMilesPerVehicle: 10000
          }
        }
      }
    };

    switch (presetName) {
      case 'statusQuo':
        return {
          ...baseScenario,
          name: 'Status Quo',
          description: 'No changes to current duty rates - natural EV growth only',
          parameters: {
            ...baseScenario.parameters,
            dutyRates: {
              ev: { [constants.modelingDefaults.startYear]: 65 },
              iceBands: {}
            },
            adoptionModel: {
              ...baseScenario.parameters.adoptionModel,
              priceElasticity: 0 // No policy influence
            }
          }
        };

      case 'gradualTransition':
        const gradualEVRates: Record<number, number> = {};
        for (let year = 2024; year <= 2035; year++) {
          // Increase EV duty by £15 per year from £65 to £230
          gradualEVRates[year] = Math.min(65 + (year - 2024) * 15, 230);
        }
        return {
          ...baseScenario,
          name: 'Gradual Transition',
          description: 'Phased increase in EV duty over 12 years to match ICE average',
          parameters: {
            ...baseScenario.parameters,
            dutyRates: {
              ev: gradualEVRates,
              iceBands: {}
            },
            adoptionModel: {
              ...baseScenario.parameters.adoptionModel,
              priceElasticity: -0.15 // Moderate sensitivity
            }
          }
        };

      case 'revenueNeutral':
        return {
          ...baseScenario,
          name: 'Revenue Neutral',
          description: 'Dynamic duty adjustment to maintain current revenue levels',
          parameters: {
            ...baseScenario.parameters,
            dutyRates: {
              ev: { [constants.modelingDefaults.startYear]: 150 }, // Higher initial rate
              iceBands: {}
            },
            adoptionModel: {
              ...baseScenario.parameters.adoptionModel,
              priceElasticity: -0.2,
              targetEVCount: {
                2030: 10000 // Lower target due to higher duty
              }
            }
          }
        };

      case 'aggressiveIncentive':
        return {
          ...baseScenario,
          name: 'Aggressive EV Incentive',
          description: 'Keep EV duty low, implement weight-based mechanism for fairness',
          parameters: {
            ...baseScenario.parameters,
            dutyRates: {
              ev: { [constants.modelingDefaults.startYear]: 30 }, // Very low EV duty
              iceBands: {}
            },
            adoptionModel: {
              ...baseScenario.parameters.adoptionModel,
              priceElasticity: -0.4, // High sensitivity to price
              targetEVCount: {
                2030: 18000 // Ambitious target
              }
            },
            policyMechanisms: {
              ...baseScenario.parameters.policyMechanisms,
              weightBased: {
                enabled: true,
                ratePerKg: 0.08,
                startYear: 2026
              }
            }
          }
        };

      case 'usageBased':
        return {
          ...baseScenario,
          name: 'Usage-Based System',
          description: 'Distance-based charging for all vehicles from 2028',
          parameters: {
            ...baseScenario.parameters,
            dutyRates: {
              ev: { 
                [constants.modelingDefaults.startYear]: 65,
                2028: 20 // Reduce base duty when distance charging starts
              },
              iceBands: {}
            },
            adoptionModel: {
              ...baseScenario.parameters.adoptionModel,
              priceElasticity: -0.1, // Less sensitive due to usage-based fairness
              targetEVCount: {
                2030: 15000
              }
            },
            policyMechanisms: {
              ...baseScenario.parameters.policyMechanisms,
              distanceBased: {
                enabled: true,
                ratePerMile: 0.015,
                startYear: 2028,
                averageMilesPerVehicle: 8500
              }
            }
          }
        };

      default:
        return baseScenario;
    }
  };

  const applyPreset = (presetName: string) => {
    const preset = createPresetScenario(presetName);
    
    // Update scenario parameters
    Object.entries(preset.parameters?.dutyRates.ev || {}).forEach(([year, rate]) => {
      updateScenarioParameter(`parameters.dutyRates.ev.${year}`, rate);
    });

    updateScenarioParameter('parameters.adoptionModel.type', preset.parameters?.adoptionModel.type);
    updateScenarioParameter('parameters.adoptionModel.priceElasticity', preset.parameters?.adoptionModel.priceElasticity);
    
    Object.entries(preset.parameters?.adoptionModel.targetEVCount || {}).forEach(([year, count]) => {
      updateScenarioParameter(`parameters.adoptionModel.targetEVCount.${year}`, count);
    });

    // Policy mechanisms
    updateScenarioParameter('parameters.policyMechanisms.weightBased.enabled', preset.parameters?.policyMechanisms.weightBased.enabled);
    updateScenarioParameter('parameters.policyMechanisms.weightBased.ratePerKg', preset.parameters?.policyMechanisms.weightBased.ratePerKg);
    updateScenarioParameter('parameters.policyMechanisms.weightBased.startYear', preset.parameters?.policyMechanisms.weightBased.startYear);

    updateScenarioParameter('parameters.policyMechanisms.distanceBased.enabled', preset.parameters?.policyMechanisms.distanceBased.enabled);
    updateScenarioParameter('parameters.policyMechanisms.distanceBased.ratePerMile', preset.parameters?.policyMechanisms.distanceBased.ratePerMile);
    updateScenarioParameter('parameters.policyMechanisms.distanceBased.startYear', preset.parameters?.policyMechanisms.distanceBased.startYear);
    updateScenarioParameter('parameters.policyMechanisms.distanceBased.averageMilesPerVehicle', preset.parameters?.policyMechanisms.distanceBased.averageMilesPerVehicle);
  };

  const presets = [
    {
      id: 'statusQuo',
      name: 'Status Quo',
      description: 'Current policies with natural EV growth',
      icon: Target,
      color: 'blue',
      impact: 'Baseline scenario'
    },
    {
      id: 'gradualTransition',
      name: 'Gradual Transition',
      description: 'Phased duty increases over 12 years',
      icon: TrendingUp,
      color: 'green',
      impact: 'Moderate revenue recovery'
    },
    {
      id: 'revenueNeutral',
      name: 'Revenue Neutral',
      description: 'Maintain current revenue levels',
      icon: DollarSign,
      color: 'purple',
      impact: 'Stable government income'
    },
    {
      id: 'aggressiveIncentive',
      name: 'EV Incentive',
      description: 'Low EV duty + weight mechanism',
      icon: Zap,
      color: 'yellow',
      impact: 'Maximum EV adoption'
    },
    {
      id: 'usageBased',
      name: 'Usage-Based',
      description: 'Distance charging from 2028',
      icon: Scale,
      color: 'indigo',
      impact: 'Fair usage-based system'
    }
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Preset Scenarios</CardTitle>
        <p className="text-sm text-muted-foreground">
          Load common policy scenarios to explore different approaches
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {presets.map((preset) => {
          const IconComponent = preset.icon;
          return (
            <Button
              key={preset.id}
              variant="outline"
              className="w-full h-auto p-3 justify-start text-left"
              onClick={() => applyPreset(preset.id)}
            >
              <div className="flex items-start gap-3 w-full">
                <IconComponent className={`h-5 w-5 mt-0.5 text-${preset.color}-500`} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{preset.name}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {preset.description}
                  </div>
                  <div className={`text-xs font-medium text-${preset.color}-600 dark:text-${preset.color}-400 mt-1`}>
                    {preset.impact}
                  </div>
                </div>
              </div>
            </Button>
          );
        })}

        <div className="pt-3 border-t">
          <div className="text-xs text-muted-foreground">
            <div className="font-medium mb-1">💡 Pro Tip:</div>
            <div>Start with a preset, then customize parameters to create your own scenario variations.</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
