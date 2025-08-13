# Product Requirements Document
## Isle of Man Vehicle Duty Policy Engine

**Version:** 1.0  
**Status:** Draft  
**Product Type:** Next.js Web Application

---

## 1. Executive Summary

### 1.1 Purpose
A web-based modeling tool that enables government policy makers to simulate and analyze the fiscal, environmental, and social impacts of vehicle duty policy changes in real-time, with focus on revenue implications of electric vehicle adoption.

### 1.2 Problem Statement
The Isle of Man faces a projected £1.9 million revenue shortfall by 2030 as electric vehicle adoption accelerates. Policy makers currently lack tools to model complex interactions between duty rates, adoption curves, and revenue impacts.

### 1.3 Solution
An interactive policy modeling platform that transforms research data into a dynamic simulation environment, allowing policy makers to test scenarios, compare outcomes, and generate evidence-based policy recommendations.

---

## 2. Technical Stack

### 2.1 Core Technologies
- **Framework:** Next.js 14+ with App Router
- **Language:** TypeScript
- **UI Components:** shadcn/ui
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Charts:** Recharts
- **PDF Generation:** @react-pdf/renderer
- **Data Validation:** Zod
- **Deployment:** Vercel

### 2.2 Project Structure
```
/app
  /page.tsx                 # Landing page with context dashboard
  /model                    
    /page.tsx              # Main modeling interface
  /scenarios
    /page.tsx              # Saved scenarios management
    /[id]/page.tsx         # Individual scenario detail
  /compare
    /page.tsx              # Scenario comparison tool
  /api
    /calculate/route.ts    # Calculation engine endpoint
    /export-pdf/route.ts   # PDF generation endpoint
    /scenarios/route.ts    # CRUD for scenarios

/lib
  /engine
    /revenue-calculator.ts
    /adoption-model.ts
    /equity-analyzer.ts
    /types.ts
  /data
    /baseline-data.ts      # Processed from source data
    /constants.ts
    
/components
  /charts
    /revenue-projection.tsx
    /fleet-composition.tsx
    /impact-metrics.tsx
  /inputs
    /duty-rate-controls.tsx
    /adoption-curve-editor.tsx
    /timeline-selector.tsx
  /layout
    /modeling-panel.tsx
    /results-panel.tsx
  /reports
    /pdf-template.tsx
    
/data
  /source
    /vehicle-duty-rates.json
    /fleet-composition.json
    /revenue-baseline.json
```

---

## 3. Data Schema

### 3.1 Source Data Structure
```typescript
interface BaselineData {
  metadata: {
    lastUpdated: string;
    sources: string[];
  };
  
  financial: {
    vehicleDutyRevenue: number;  // £15,000,000
    roadsBudget: {
      maintenance: number;        // £6,600,000
      structural: number;         // £1,155,000
      total: number;             // £7,755,000
    };
  };
  
  fleet: {
    totalVehicles: number;        // 65,000
    currentComposition: {
      ev: number;                 // 1,500
      ice: number;                // 63,500
      evPercentage: number;       // 2.3
    };
    historicalData: Array<{
      year: number;
      evCount: number;
      iceCount: number;
    }>;
    projections: {
      governmentTarget2030: number;  // 13,000
      lowAmbition2030: number;       // 10,000
    };
  };
  
  dutyRates: {
    current: {
      ev: number;                     // 65
      iceAverage: number;             // 230
      iceByEmissionBand: Record<string, number>;
      motorcycles: number;            // 28
    };
    revenuePerConversion: number;    // -165 (loss per vehicle)
  };
}
```

### 3.2 Scenario Configuration
```typescript
interface ScenarioConfig {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  
  parameters: {
    timeline: {
      startYear: number;
      endYear: number;
    };
    
    dutyRates: {
      ev: Record<number, number>;  // year -> rate
      iceBands: Record<string, Record<number, number>>;
    };
    
    adoptionModel: {
      type: 'linear' | 'exponential' | 'sCurve' | 'custom';
      targetEVCount: Record<number, number>;
      priceElasticity: number;  // -1 to 1
    };
    
    policyMechanisms: {
      weightBased: {
        enabled: boolean;
        ratePerKg: number;
        startYear: number;
      };
      distanceBased: {
        enabled: boolean;
        ratePerMile: number;
        startYear: number;
        averageMilesPerVehicle: number;
      };
    };
  };
}
```

### 3.3 Calculation Results
```typescript
interface ScenarioResults {
  revenue: {
    byYear: Record<number, {
      total: number;
      fromEV: number;
      fromICE: number;
      fromOtherMechanisms: number;
    }>;
    cumulativeImpact: number;
    breakEvenYear: number | null;
  };
  
  fleet: {
    compositionByYear: Record<number, {
      ev: number;
      ice: number;
      evPercentage: number;
    }>;
    adoptionRate: Record<number, number>;
  };
  
  impacts: {
    averageDutyByType: Record<number, {
      ev: number;
      ice: number;
      ratio: number;
    }>;
    revenueGap: Record<number, number>;
    meetsTargets: boolean;
  };
  
  metrics: {
    totalRevenueChange: number;
    peakRevenueGap: number;
    targetAchievementYear: number | null;
  };
}
```

---

## 4. Core Features

### 4.1 Landing Page Dashboard
```typescript
interface DashboardProps {
  currentSituation: {
    revenue: number;
    evPercentage: number;
    projectedGap2030: number;
  };
  keyMetrics: MetricCard[];
  recentScenarios: ScenarioSummary[];
  quickActions: Action[];
}
```

**Components:**
- Executive summary cards
- Current crisis visualization
- Quick navigation to modeling tool
- Recent scenarios carousel

### 4.2 Modeling Interface

**Layout:**
```typescript
interface ModelingInterfaceLayout {
  leftPanel: {
    type: 'inputs';
    sections: [
      'DutyRates',
      'AdoptionCurve', 
      'PolicyMechanisms',
      'Timeline'
    ];
  };
  centerPanel: {
    type: 'visualizations';
    charts: [
      'RevenueProjection',
      'FleetComposition',
      'ImpactComparison'
    ];
  };
  rightPanel: {
    type: 'metrics';
    displays: [
      'KeyMetrics',
      'Warnings',
      'Insights'
    ];
  };
}
```

**Key Interactions:**
- Real-time calculation on parameter change
- Hover states showing detailed breakdowns
- Preset scenario loading
- Undo/redo for parameter changes

### 4.3 Calculation Engine

```typescript
class RevenueCalculator {
  constructor(baseline: BaselineData) {}
  
  calculate(config: ScenarioConfig): ScenarioResults {
    // Core calculation logic
  }
  
  private calculateYearRevenue(
    year: number,
    fleetComposition: FleetComposition,
    dutyRates: DutyRates
  ): YearRevenue {}
  
  private projectAdoption(
    model: AdoptionModel,
    yearOffset: number
  ): number {}
  
  private applyPriceElasticity(
    baseAdoption: number,
    priceChange: number,
    elasticity: number
  ): number {}
}
```

### 4.4 Report Generation

```typescript
interface PolicyReport {
  scenario: ScenarioConfig;
  results: ScenarioResults;
  
  sections: {
    executiveSummary: string;
    assumptions: Assumption[];
    projections: ChartData[];
    impacts: ImpactAnalysis;
    recommendations: string[];
    risks: Risk[];
  };
  
  metadata: {
    generatedAt: Date;
    generatedBy: string;
    version: string;
  };
}
```

---

## 5. API Endpoints

### 5.1 Calculation API
```typescript
// POST /api/calculate
interface CalculateRequest {
  baseline: BaselineData;
  scenario: ScenarioConfig;
}

interface CalculateResponse {
  results: ScenarioResults;
  warnings?: string[];
}
```

### 5.2 Scenario Management
```typescript
// GET /api/scenarios
interface ScenariosResponse {
  scenarios: ScenarioSummary[];
}

// POST /api/scenarios
interface CreateScenarioRequest {
  config: ScenarioConfig;
}

// GET /api/scenarios/[id]
interface ScenarioResponse {
  config: ScenarioConfig;
  results: ScenarioResults;
}
```

### 5.3 Export API
```typescript
// POST /api/export-pdf
interface ExportPDFRequest {
  report: PolicyReport;
  template: 'executive' | 'detailed' | 'technical';
}

// Returns: PDF blob
```

---

## 6. UI Components Specification

### 6.1 Input Components

```typescript
// Duty Rate Slider
interface DutyRateSliderProps {
  label: string;
  year: number;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  comparison?: number;  // baseline for comparison
}

// Adoption Curve Editor
interface AdoptionCurveEditorProps {
  type: 'linear' | 'exponential' | 'sCurve' | 'custom';
  points: Point[];
  onTypeChange: (type: string) => void;
  onPointsChange: (points: Point[]) => void;
}
```

### 6.2 Visualization Components

```typescript
// Revenue Projection Chart
interface RevenueProjectionProps {
  data: YearlyRevenue[];
  baseline: YearlyRevenue[];
  showBreakdown: boolean;
  highlightYear?: number;
}

// Fleet Composition Chart
interface FleetCompositionProps {
  data: YearlyFleetData[];
  targetLine?: number;
  animateTransition: boolean;
}
```

### 6.3 Metric Components

```typescript
// Key Metric Card
interface MetricCardProps {
  title: string;
  value: number | string;
  change?: number;
  format: 'currency' | 'percentage' | 'number';
  trend?: 'up' | 'down' | 'neutral';
  severity?: 'success' | 'warning' | 'error';
}
```

---

## 7. State Management

```typescript
// Zustand Store Structure
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
  updateScenarioParameter: (path: string, value: any) => void;
  calculateResults: () => Promise<void>;
  saveScenario: (name: string) => Promise<void>;
  loadScenario: (id: string) => Promise<void>;
  exportReport: (format: 'pdf' | 'csv') => Promise<void>;
  resetToBaseline: () => void;
}
```

---

## 8. Implementation Priorities

### Phase 1: Core Functionality
- Basic calculation engine
- Simple parameter inputs (duty rates, timeline)
- Revenue projection visualization
- Data structure setup

### Phase 2: Enhanced Modeling
- Adoption curve models
- Fleet composition tracking
- Comparative analysis
- Scenario saving/loading

### Phase 3: Reporting & Export
- PDF report generation
- CSV data export
- Scenario comparison tool
- Preset scenarios

### Phase 4: Advanced Features
- Weight/distance-based mechanisms
- Monte Carlo simulation
- Sensitivity analysis
- Multi-objective optimization

---

## 9. Testing Requirements

```typescript
// Test Coverage Areas
describe('Revenue Calculator', () => {
  test('calculates baseline revenue correctly');
  test('applies duty rate changes accurately');
  test('projects adoption based on model type');
  test('handles edge cases (0% EVs, 100% EVs)');
});

describe('Scenario Management', () => {
  test('saves and retrieves scenarios');
  test('validates scenario configurations');
  test('compares multiple scenarios');
});

describe('UI Components', () => {
  test('updates visualizations on parameter change');
  test('handles invalid inputs gracefully');
  test('exports reports successfully');
});
```

---

## 10. Performance Requirements

- **Calculation Speed:** < 100ms for full scenario calculation
- **UI Responsiveness:** 60fps for all interactions
- **Chart Rendering:** < 200ms for data updates
- **PDF Generation:** < 5 seconds
- **Initial Load:** < 2 seconds

---

## 11. File Structure for Implementation

```
/iom-policy-engine
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── .env.local
├── /app
├── /components
├── /lib
├── /data
├── /public
└── /tests
```

---

## Document Control

| Version | Status | Description |
|---------|--------|-------------|
| 1.0 | Draft | Initial PRD for implementation |