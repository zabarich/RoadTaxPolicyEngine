// Core data types for the IOM Vehicle Duty Policy Engine

export interface BaselineData {
  metadata: {
    lastUpdated: string;
    currency: string;
    sources: string[];
  };
  
  financial: {
    vehicleDutyRevenue: {
      current: number;
      preIncrease2023: number;
      note: string;
    };
    roadsBudget: {
      maintenance: number;
      structural: number;
      total: number;
      year: string;
    };
    revenueDestination: string;
    roadsAsPercentOfRevenue: number;
  };
  
  fleet: {
    totalVehicles: number;
    currentComposition: {
      ev: number;
      ice: number;
      evPercentage: number;
      year: number;
    };
    projections: {
      governmentTarget2030: number;
      lowAmbition2030: number;
      targetEVPercentage2030: number;
    };
    chargingInfrastructure: {
      chargingPoints: number;
      vehiclesPerChargingPoint: number;
      year: number;
    };
  };
  
  revenueModel: {
    currentAnnualRevenue: number;
    revenuePerEV: number;
    revenuePerICE: number;
    lossPerConversion: number;
    lossPerPercentFleet: number;
    breakdownCurrent: {
      fromEVs: number;
      fromICEs: number;
    };
  };
}

export interface DutyRates {
  metadata: {
    source: string;
    effectiveDate: string;
    lastIncrease: string;
    currency: string;
  };
  
  electricVehicles: {
    flatRate: {
      annual: number;
      sixMonth: number;
      band: string;
      description: string;
    };
  };
  
  emissionBands: {
    description: string;
    bands: Record<string, {
      co2Range: string;
      annual: number;
      sixMonth: number;
      description?: string;
    }>;
  };
  
  statistics: {
    averageICEDuty: number;
    averageEVDuty: number;
    evAsPercentOfICE: number;
    sixMonthAdminCharge: number;
    note: string;
  };
}

export interface Constants {
  metadata: {
    description: string;
    lastUpdated: string;
  };
  
  financialConstants: {
    revenuePerConversion: number;
    revenuePerPercentFleetConversion: number;
    averageICEDuty: number;
    currentEVDuty: number;
    evDutyAsPercentOfICE: number;
    sixMonthAdminCharge: number;
    minimumDuty: number;
    maximumDuty: number;
  };
  
  fleetConstants: {
    totalVehicles: number;
    vehiclesPerPercentage: number;
    currentEVCount: number;
    currentEVPercentage: number;
    motorcyclePercentage: number;
    goodsVehiclePercentage: number;
  };
  
  modelingDefaults: {
    startYear: number;
    endYear: number;
    defaultProjectionYears: number;
    defaultPriceElasticity: number;
    defaultAdoptionCurve: string;
    inflectionPointYear: number;
  };
  
  adoptionParameters: {
    baselineGrowthRate: number;
    conservativeGrowthRate: number;
    aggressiveGrowthRate: number;
    maxAdoptionRate: number;
    earlyAdopterThreshold: number;
    majorityThreshold: number;
    laggardThreshold: number;
  };
  
  scenarioPresets: Record<string, {
    name: string;
    description: string;
    evDutyGrowth?: number;
    iceDutyGrowth?: number;
    dynamicAdjustment?: boolean;
    targetRevenue?: number;
    targetRatio?: number;
    transitionYears?: number;
  }>;
  
  chartColors: Record<string, string>;
}

// Category adjustment types for manual duty rate control per year
export interface CategoryAdjustment {
  type: 'lift' | 'hold' | 'reduce' | 'absolute';
  value: number; // percentage for lift/reduce, or absolute amount for absolute
  startYear: number;
  endYear?: number; // if not specified, applies indefinitely
  description?: string; // optional explanation for the adjustment
}

export interface CategoryAdjustments {
  ev: Record<number, CategoryAdjustment>; // year -> adjustment
  motorcycles: Record<number, CategoryAdjustment>;
  goodsVehicles: {
    light: Record<number, CategoryAdjustment>; // up to 7.5t (C1)
    medium: Record<number, CategoryAdjustment>; // 7.5-12t (C)
    heavy: Record<number, CategoryAdjustment>; // 12t+ (larger goods)
  };
  emissionBands: {
    [band: string]: Record<number, CategoryAdjustment>; // 'A', 'B', 'C' etc.
  };
  specialCategories: {
    veteran: Record<number, CategoryAdjustment>; // 30+ year old vehicles
    welfare: Record<number, CategoryAdjustment>; // disabled drivers
    agricultural: Record<number, CategoryAdjustment>; // farming vehicles
    police: Record<number, CategoryAdjustment>; // police vehicles
  };
}

export interface ScenarioConfig {
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
    
    // Category-specific manual adjustments per year
    categoryAdjustments?: CategoryAdjustments;
  };
}

export interface YearRevenue {
  year: number;
  total: number;
  fromEV: number;
  fromICE: number;
  fromOtherMechanisms: number;
}

export interface FleetComposition {
  year: number;
  ev: number;
  ice: number;
  evPercentage: number;
}

export interface ScenarioResults {
  revenue: {
    byYear: Record<number, YearRevenue>;
    cumulativeImpact: number;
    breakEvenYear: number | null;
  };
  
  fleet: {
    compositionByYear: Record<number, FleetComposition>;
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

export interface MetricCard {
  title: string;
  value: number | string;
  change?: number;
  format: 'currency' | 'percentage' | 'number';
  trend?: 'up' | 'down' | 'neutral';
  severity?: 'success' | 'warning' | 'error';
}

export interface ScenarioSummary {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  lastModified: Date;
  keyMetrics: {
    totalRevenueChange: number;
    peakGap: number;
    targetYear: number | null;
  };
}

// Chart data interfaces
export interface ChartDataPoint {
  year: number;
  [key: string]: number | string | undefined;
}

export interface RevenueChartData extends ChartDataPoint {
  baseline: number;
  scenario: number;
  ev: number;
  ice: number;
}

export interface FleetChartData extends ChartDataPoint {
  evCount: number;
  iceCount: number;
  evPercentage: number;
  target?: number;
}
