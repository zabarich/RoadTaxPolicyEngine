import { create } from 'zustand';
import { BaselineData, ScenarioConfig, ScenarioResults, ScenarioSummary } from '@/lib/types';
import { baselineData } from '@/lib/data/baseline-data';
import { constants } from '@/lib/data/constants';
import { RevenueCalculator } from '@/lib/engine/revenue-calculator';

interface PolicyEngineStore {
  // Data
  baseline: BaselineData;
  currentScenario: ScenarioConfig;
  results: ScenarioResults | null;
  savedScenarios: ScenarioSummary[];
  
  // UI State
  isCalculating: boolean;
  activePanel: 'inputs' | 'results' | 'compare';
  selectedYearRange: [number, number];
  suppressAutoCalculation: boolean;
  
  // Actions
  updateScenarioParameter: (path: string, value: unknown, suppressCalculation?: boolean) => void;
  calculateResults: () => Promise<void>;
  saveScenario: (name: string, description?: string) => Promise<void>;
  loadScenario: (id: string) => Promise<void>;
  deleteScenario: (id: string) => Promise<void>;
  fetchScenarios: () => Promise<void>;
  resetToBaseline: () => void;
  setActivePanel: (panel: 'inputs' | 'results' | 'compare') => void;
  setYearRange: (range: [number, number]) => void;
  exportToPDF: (template?: 'executive' | 'detailed' | 'technical') => Promise<void>;
  exportToCSV: () => void;
}

// Create default scenario
const createDefaultScenario = (): ScenarioConfig => ({
  id: 'default',
  name: 'Default Scenario',
  description: 'Baseline scenario with current policies',
  createdAt: new Date(),
  parameters: {
    timeline: {
      startYear: constants.modelingDefaults.startYear,
      endYear: constants.modelingDefaults.endYear
    },
    dutyRates: {
      ev: {
        [constants.modelingDefaults.startYear]: constants.financialConstants.currentEVDuty
      },
      iceBands: {}
    },
    adoptionModel: {
      type: 'sCurve',
      targetEVCount: {
        2030: baselineData.fleet.projections.governmentTarget2030
      },
      priceElasticity: constants.modelingDefaults.defaultPriceElasticity
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
});

export const usePolicyEngineStore = create<PolicyEngineStore>((set, get) => ({
  // Initial state
  baseline: baselineData,
  currentScenario: createDefaultScenario(),
  results: null,
  savedScenarios: [],
  isCalculating: false,
  activePanel: 'inputs',
  selectedYearRange: [constants.modelingDefaults.startYear, constants.modelingDefaults.endYear],
  suppressAutoCalculation: false,

  // Actions
  updateScenarioParameter: (path: string, value: unknown, suppressCalculation = false) => {
    const scenario = get().currentScenario;
    const pathParts = path.split('.');
    
    // Create a deep copy of the scenario
    const updatedScenario = JSON.parse(JSON.stringify(scenario));
    
    // Navigate to the target property
    let current = updatedScenario;
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (!current[pathParts[i]]) {
        current[pathParts[i]] = {};
      }
      current = current[pathParts[i]];
    }
    
    // Set the value
    current[pathParts[pathParts.length - 1]] = value;
    
    set({ currentScenario: updatedScenario });
    
    // Trigger immediate recalculation only if not suppressed
    if (!suppressCalculation && !get().suppressAutoCalculation) {
      setTimeout(() => {
        if (!get().isCalculating) {
          get().calculateResults();
        }
      }, 100); // Slightly longer delay to prevent rapid firing
    }
  },

  calculateResults: async () => {
    const { currentScenario } = get();
    
    set({ isCalculating: true });
    
    try {
      // Use API endpoint for calculation
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenario: {
            ...currentScenario,
            createdAt: currentScenario.createdAt instanceof Date ? currentScenario.createdAt.toISOString() : currentScenario.createdAt,
            parameters: {
              ...currentScenario.parameters,
              dutyRates: {
                ev: Object.fromEntries(
                  Object.entries(currentScenario.parameters.dutyRates.ev).map(([year, rate]) => [year.toString(), rate])
                ),
                iceBands: Object.fromEntries(
                  Object.entries(currentScenario.parameters.dutyRates.iceBands).map(([band, rates]) => [
                    band,
                    Object.fromEntries(
                      Object.entries(rates).map(([year, rate]) => [year.toString(), rate])
                    )
                  ])
                )
              },
              adoptionModel: {
                ...currentScenario.parameters.adoptionModel,
                targetEVCount: Object.fromEntries(
                  Object.entries(currentScenario.parameters.adoptionModel.targetEVCount).map(([year, count]) => [year.toString(), count])
                )
              }
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Calculation failed: ${response.statusText}`);
      }

      const data = await response.json();
      set({ results: data.results, isCalculating: false });
      
      // Store warnings and insights if needed
      if (data.warnings?.length > 0) {
        console.warn('Calculation warnings:', data.warnings);
      }
      
    } catch (error) {
      console.error('Calculation error:', error);
      set({ isCalculating: false });
      // Fallback to client-side calculation
      try {
        const calculator = new RevenueCalculator(get().baseline);
        const results = calculator.calculate(currentScenario);
        set({ results, isCalculating: false });
      } catch (fallbackError) {
        console.error('Fallback calculation also failed:', fallbackError);
      }
    }
  },

  saveScenario: async (name: string, description = '') => {
    const { currentScenario, results } = get();
    
    if (!results) {
      await get().calculateResults();
    }
    
    const finalResults = get().results;
    if (!finalResults) return;
    
    try {
      // Use API endpoint to save scenario
      const response = await fetch('/api/scenarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          parameters: {
            ...currentScenario.parameters,
            dutyRates: {
              ev: Object.fromEntries(
                Object.entries(currentScenario.parameters.dutyRates.ev).map(([year, rate]) => [year.toString(), rate])
              ),
              iceBands: Object.fromEntries(
                Object.entries(currentScenario.parameters.dutyRates.iceBands).map(([band, rates]) => [
                  band,
                  Object.fromEntries(
                    Object.entries(rates).map(([year, rate]) => [year.toString(), rate])
                  )
                ])
              )
            },
            adoptionModel: {
              ...currentScenario.parameters.adoptionModel,
              targetEVCount: Object.fromEntries(
                Object.entries(currentScenario.parameters.adoptionModel.targetEVCount).map(([year, count]) => [year.toString(), count])
              )
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to save scenario: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Update local state with the saved scenario
      const scenarioSummary: ScenarioSummary = {
        id: data.scenario.id,
        name,
        description,
        createdAt: new Date(data.scenario.createdAt),
        lastModified: new Date(data.scenario.createdAt),
        keyMetrics: {
          totalRevenueChange: finalResults.metrics.totalRevenueChange,
          peakGap: finalResults.metrics.peakRevenueGap,
          targetYear: finalResults.metrics.targetAchievementYear
        }
      };
      
      const savedScenarios = [...get().savedScenarios, scenarioSummary];
      set({ savedScenarios });
      
    } catch (error) {
      console.error('Failed to save scenario via API:', error);
      
      // Fallback to localStorage
      const scenarioSummary: ScenarioSummary = {
        id: Date.now().toString(),
        name,
        description,
        createdAt: new Date(),
        lastModified: new Date(),
        keyMetrics: {
          totalRevenueChange: finalResults.metrics.totalRevenueChange,
          peakGap: finalResults.metrics.peakRevenueGap,
          targetYear: finalResults.metrics.targetAchievementYear
        }
      };
      
      const savedScenarios = [...get().savedScenarios, scenarioSummary];
      set({ savedScenarios });
      
      try {
        const existingScenarios = JSON.parse(localStorage.getItem('policyEngineScenarios') || '[]');
        existingScenarios.push({
          ...currentScenario,
          id: scenarioSummary.id,
          name,
          description
        });
        localStorage.setItem('policyEngineScenarios', JSON.stringify(existingScenarios));
      } catch (localError) {
        console.error('Failed to save scenario to localStorage:', localError);
      }
    }
  },

  loadScenario: async (id: string) => {
    try {
      // Try API first
      const response = await fetch(`/api/scenarios/${id}`);
      
      if (response.ok) {
        const data = await response.json();
        const scenario = {
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
        
        set({ currentScenario: scenario });
        await get().calculateResults();
        return;
      }
    } catch (error) {
      console.error('Failed to load scenario from API:', error);
    }
    
    // Fallback to localStorage
    try {
      const savedScenarios = JSON.parse(localStorage.getItem('policyEngineScenarios') || '[]');
      const scenario = savedScenarios.find((s: ScenarioConfig) => s.id === id);
      
      if (scenario) {
        set({ currentScenario: scenario });
        await get().calculateResults();
      }
    } catch (error) {
      console.error('Failed to load scenario from localStorage:', error);
    }
  },

  resetToBaseline: () => {
    set({ 
      currentScenario: createDefaultScenario(),
      results: null 
    });
    get().calculateResults();
  },

  setActivePanel: (panel: 'inputs' | 'results' | 'compare') => {
    set({ activePanel: panel });
  },

  setYearRange: (range: [number, number]) => {
    set({ selectedYearRange: range });
  },

  deleteScenario: async (id: string) => {
    try {
      // Try API first
      const response = await fetch(`/api/scenarios/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // Remove from local state
        const savedScenarios = get().savedScenarios.filter(s => s.id !== id);
        set({ savedScenarios });
        return;
      }
    } catch (error) {
      console.error('Failed to delete scenario from API:', error);
    }
    
    // Fallback to localStorage
    try {
      const savedScenarios = JSON.parse(localStorage.getItem('policyEngineScenarios') || '[]');
      const updatedScenarios = savedScenarios.filter((s: ScenarioConfig) => s.id !== id);
      localStorage.setItem('policyEngineScenarios', JSON.stringify(updatedScenarios));
      
      // Update local state
      const localSavedScenarios = get().savedScenarios.filter(s => s.id !== id);
      set({ savedScenarios: localSavedScenarios });
    } catch (error) {
      console.error('Failed to delete scenario from localStorage:', error);
    }
  },

  fetchScenarios: async () => {
    try {
      // Try API first
      const response = await fetch('/api/scenarios?summary=true');
      
      if (response.ok) {
        const data = await response.json();
        set({ savedScenarios: data.scenarios });
        return;
      }
    } catch (error) {
      console.error('Failed to fetch scenarios from API:', error);
    }
    
    // Fallback to localStorage
    try {
      const savedScenarios = JSON.parse(localStorage.getItem('policyEngineScenarios') || '[]');
      const summaries: ScenarioSummary[] = savedScenarios.map((scenario: ScenarioConfig) => ({
        id: scenario.id,
        name: scenario.name,
        description: scenario.description,
        createdAt: new Date(scenario.createdAt),
        lastModified: new Date(scenario.createdAt),
        keyMetrics: {
          totalRevenueChange: 0, // Would need to recalculate
          peakGap: 0,
          targetYear: null
        }
      }));
      
      set({ savedScenarios: summaries });
    } catch (error) {
      console.error('Failed to fetch scenarios from localStorage:', error);
    }
  },

  exportToPDF: async (template: 'executive' | 'detailed' | 'technical' = 'executive') => {
    const { currentScenario, results } = get();
    
    if (!results) {
      await get().calculateResults();
    }
    
    const finalResults = get().results;
    if (!finalResults) {
      throw new Error('No results available for export');
    }
    
    try {
      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenario: {
            ...currentScenario,
            createdAt: currentScenario.createdAt instanceof Date ? currentScenario.createdAt.toISOString() : currentScenario.createdAt
          },
          results: finalResults,
          template,
          options: {
            includeCharts: template !== 'executive',
            includeAssumptions: true,
            includeRecommendations: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`PDF export failed: ${response.statusText}`);
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `policy_report_${currentScenario.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('Failed to export PDF:', error);
      throw error;
    }
  },

  exportToCSV: () => {
    const { results, currentScenario } = get();
    
    if (!results) {
      throw new Error('No results available for export');
    }
    
    // Scenario metadata
    const scenarioInfo = [
      ['Scenario Name', currentScenario.name],
      ['Description', currentScenario.description],
      ['Generated', new Date().toISOString()],
      ['EV Target 2030', currentScenario.parameters.adoptionModel.targetEVCount[2030] || 13000],
      ['Current EV Duty', currentScenario.parameters.dutyRates.ev[2024] || 65],
      ['Target Achievement', results.metrics.targetAchievementYear || 'Not Met'],
      ['Break-even Year', results.revenue.breakEvenYear || 'Not Achieved'],
      ['Total Revenue Change', results.metrics.totalRevenueChange],
      ['Peak Revenue Gap', results.metrics.peakRevenueGap],
      ['']
    ];
    
    // Year-by-year data headers
    const headers = [
      'Year', 
      'Total Revenue (£)', 
      'EV Revenue (£)', 
      'ICE Revenue (£)', 
      'EV Count', 
      'ICE Count', 
      'EV Percentage (%)',
      'Revenue Gap (£)',
      'EV Duty Rate (£)',
      'Meets Target'
    ];
    
    // Year-by-year data rows
    const rows = Object.values(results.revenue.byYear).map(yearData => {
      const fleetData = results.fleet.compositionByYear[yearData.year];
      const evDuty = currentScenario.parameters.dutyRates.ev[yearData.year] || 
                    currentScenario.parameters.dutyRates.ev[2024] || 65;
      const target = currentScenario.parameters.adoptionModel.targetEVCount[2030] || 13000;
      const meetsTarget = (fleetData?.ev || 0) >= target ? 'Yes' : 'No';
      
      return [
        yearData.year,
        yearData.total,
        yearData.fromEV,
        yearData.fromICE,
        fleetData?.ev || 0,
        fleetData?.ice || 0,
        (fleetData?.evPercentage || 0).toFixed(1),
        results.impacts.revenueGap[yearData.year] || 0,
        evDuty,
        meetsTarget
      ];
    });
    
    // Convert to CSV with scenario info at top
    const csvContent = [
      // Scenario metadata section
      '# Scenario Information',
      ...scenarioInfo.map(row => row.join(',')),
      '# Year-by-Year Projections',
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `policy_analysis_${currentScenario.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}));

// Initialize saved scenarios from localStorage on app start
if (typeof window !== 'undefined') {
  try {
          const savedScenarios = JSON.parse(localStorage.getItem('policyEngineScenarios') || '[]');
      const summaries: ScenarioSummary[] = savedScenarios.map((scenario: ScenarioConfig) => ({
      id: scenario.id,
      name: scenario.name,
      description: scenario.description,
      createdAt: new Date(scenario.createdAt),
      lastModified: new Date(scenario.createdAt),
      keyMetrics: {
        totalRevenueChange: 0, // Would need to recalculate
        peakGap: 0,
        targetYear: null
      }
    }));
    
    // Update the store with saved scenarios
    usePolicyEngineStore.setState({ savedScenarios: summaries });
  } catch (error) {
    console.error('Failed to load scenarios from localStorage:', error);
  }
}
