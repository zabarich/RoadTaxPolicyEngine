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
  
  // Actions
  updateScenarioParameter: (path: string, value: unknown) => void;
  calculateResults: () => Promise<void>;
  saveScenario: (name: string, description?: string) => Promise<void>;
  loadScenario: (id: string) => Promise<void>;
  resetToBaseline: () => void;
  setActivePanel: (panel: 'inputs' | 'results' | 'compare') => void;
  setYearRange: (range: [number, number]) => void;
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

  // Actions
  updateScenarioParameter: (path: string, value: unknown) => {
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
    
    // Auto-calculate if not currently calculating
    if (!get().isCalculating) {
      get().calculateResults();
    }
  },

  calculateResults: async () => {
    const { baseline, currentScenario } = get();
    
    set({ isCalculating: true });
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const calculator = new RevenueCalculator(baseline);
      const results = calculator.calculate(currentScenario);
      
      set({ results, isCalculating: false });
    } catch (error) {
      console.error('Calculation error:', error);
      set({ isCalculating: false });
    }
  },

  saveScenario: async (name: string, description = '') => {
    const { currentScenario, results } = get();
    
    if (!results) {
      await get().calculateResults();
    }
    
    const finalResults = get().results;
    if (!finalResults) return;
    
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
    
    // In a real app, this would save to a backend
    const savedScenarios = [...get().savedScenarios, scenarioSummary];
    set({ savedScenarios });
    
    // Also save the full scenario config
    const scenarioToSave = {
      ...currentScenario,
      id: scenarioSummary.id,
      name,
      description
    };
    
    // Store in localStorage for persistence
    try {
      const existingScenarios = JSON.parse(localStorage.getItem('policyEngineScenarios') || '[]');
      existingScenarios.push(scenarioToSave);
      localStorage.setItem('policyEngineScenarios', JSON.stringify(existingScenarios));
    } catch (error) {
      console.error('Failed to save scenario to localStorage:', error);
    }
  },

  loadScenario: async (id: string) => {
    try {
      // Load from localStorage
      const savedScenarios = JSON.parse(localStorage.getItem('policyEngineScenarios') || '[]');
      const scenario = savedScenarios.find((s: ScenarioConfig) => s.id === id);
      
      if (scenario) {
        set({ currentScenario: scenario });
        await get().calculateResults();
      }
    } catch (error) {
      console.error('Failed to load scenario:', error);
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
