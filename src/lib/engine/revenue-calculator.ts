import { BaselineData, ScenarioConfig, ScenarioResults, YearRevenue, FleetComposition } from '@/lib/types';
import { constants } from '@/lib/data/constants';

export class RevenueCalculator {
  private baseline: BaselineData;

  constructor(baseline: BaselineData) {
    this.baseline = baseline;
  }

  calculate(config: ScenarioConfig): ScenarioResults {
    const { timeline } = config.parameters;
    const years = this.generateYearRange(timeline.startYear, timeline.endYear);
    
    const results: ScenarioResults = {
      revenue: {
        byYear: {},
        cumulativeImpact: 0,
        breakEvenYear: null
      },
      fleet: {
        compositionByYear: {},
        adoptionRate: {}
      },
      impacts: {
        averageDutyByType: {},
        revenueGap: {},
        meetsTargets: false
      },
      metrics: {
        totalRevenueChange: 0,
        peakRevenueGap: 0,
        targetAchievementYear: null
      }
    };

    let cumulativeImpact = 0;
    let peakGap = 0;

    for (const year of years) {
      // Calculate fleet composition for this year
      const fleetComposition = this.calculateFleetComposition(year, config);
      results.fleet.compositionByYear[year] = fleetComposition;
      
      // Calculate adoption rate
      const adoptionRate = this.calculateAdoptionRate(year, config);
      results.fleet.adoptionRate[year] = adoptionRate;

      // Calculate revenue for this year
      const yearRevenue = this.calculateYearRevenue(year, fleetComposition, config);
      results.revenue.byYear[year] = yearRevenue;

      // Calculate baseline revenue for comparison
      const baselineRevenue = this.calculateBaselineRevenue(year);
      const revenueGap = baselineRevenue - yearRevenue.total;
      results.impacts.revenueGap[year] = revenueGap;

      // Track cumulative impact
      cumulativeImpact += revenueGap;
      if (Math.abs(revenueGap) > Math.abs(peakGap)) {
        peakGap = revenueGap;
      }

      // Calculate average duty by type
      results.impacts.averageDutyByType[year] = {
        ev: this.getEVDutyForYear(year, config),
        ice: this.getICEDutyForYear(year, config),
        ratio: this.getEVDutyForYear(year, config) / this.getICEDutyForYear(year, config)
      };

      // Check for break-even year
      if (!results.revenue.breakEvenYear && Math.abs(revenueGap) < baselineRevenue * 0.01) {
        results.revenue.breakEvenYear = year;
      }
    }

    // Set final metrics
    results.revenue.cumulativeImpact = cumulativeImpact;
    results.metrics.totalRevenueChange = cumulativeImpact;
    results.metrics.peakRevenueGap = peakGap;
    
    // Check if targets are met - use 2030 specifically for government target
    const targetYear = 2030;
    const targetFleet = results.fleet.compositionByYear[targetYear];
    const targetEVCount = config.parameters.adoptionModel.targetEVCount[2030] || 
                         this.baseline.fleet.projections.governmentTarget2030;
    results.impacts.meetsTargets = targetFleet && targetFleet.ev >= targetEVCount;
    
    if (results.impacts.meetsTargets) {
      // Find when target was achieved
      for (const year of years) {
        if (results.fleet.compositionByYear[year].ev >= targetEVCount) {
          results.metrics.targetAchievementYear = year;
          break;
        }
      }
    }

    return results;
  }

  private generateYearRange(startYear: number, endYear: number): number[] {
    const years: number[] = [];
    for (let year = startYear; year <= endYear; year++) {
      years.push(year);
    }
    return years;
  }

  private calculateFleetComposition(year: number, config: ScenarioConfig): FleetComposition {
    const yearOffset = year - config.parameters.timeline.startYear;
    const evCount = this.projectEVAdoption(yearOffset, config);
    const totalVehicles = this.baseline.fleet.totalVehicles;
    const iceCount = totalVehicles - evCount;
    
    return {
      year,
      ev: Math.max(0, Math.min(evCount, totalVehicles)),
      ice: Math.max(0, iceCount),
      evPercentage: (evCount / totalVehicles) * 100
    };
  }

  private projectEVAdoption(yearOffset: number, config: ScenarioConfig): number {
    const { adoptionModel } = config.parameters;
    const baseEVCount = this.baseline.fleet.currentComposition.ev;
    const targetYear = config.parameters.timeline.endYear;
    const totalYears = targetYear - config.parameters.timeline.startYear;
    
    // Get target for final year or use default projection
    const baseTarget = adoptionModel.targetEVCount[targetYear] || 
                      adoptionModel.targetEVCount[2030] || 
                      this.baseline.fleet.projections.governmentTarget2030;

    // Apply price elasticity effect
    const currentYear = config.parameters.timeline.startYear + yearOffset;
    const evDuty = this.getEVDutyForYear(currentYear, config);
    const iceDuty = this.getICEDutyForYear(currentYear, config);
    const baselineEVDuty = 65; // Current EV duty
    
    // Calculate price effect: higher EV duty = less adoption (negative elasticity)
    const priceRatio = evDuty / baselineEVDuty;
    const elasticity = adoptionModel.priceElasticity || -0.3;
    const priceEffect = Math.pow(priceRatio, elasticity);
    
    // With negative elasticity: 
    // - If EV duty increases (ratio > 1), priceEffect < 1 (less adoption)
    // - If EV duty decreases (ratio < 1), priceEffect > 1 (more adoption)
    
    // Apply price effect to target
    const adjustedTarget = Math.min(
      baseTarget * priceEffect,
      this.baseline.fleet.totalVehicles * 0.9 // Cap at 90% of fleet
    );

    let baseAdoption: number;
    switch (adoptionModel.type) {
      case 'linear':
        baseAdoption = this.linearAdoption(baseEVCount, adjustedTarget, yearOffset, totalYears);
        break;
      
      case 'exponential':
        baseAdoption = this.exponentialAdoption(baseEVCount, adjustedTarget, yearOffset, totalYears);
        break;
      
      case 'sCurve':
        baseAdoption = this.sCurveAdoption(baseEVCount, adjustedTarget, yearOffset, totalYears);
        break;
      
      case 'custom':
        baseAdoption = this.customAdoption(yearOffset, adoptionModel.targetEVCount, config.parameters.timeline.startYear);
        break;
      
      default:
        baseAdoption = this.sCurveAdoption(baseEVCount, adjustedTarget, yearOffset, totalYears);
    }

    return Math.max(baseEVCount, Math.min(baseAdoption, this.baseline.fleet.totalVehicles));
  }

  private linearAdoption(base: number, target: number, yearOffset: number, totalYears: number): number {
    const growthPerYear = (target - base) / totalYears;
    return base + (growthPerYear * yearOffset);
  }

  private exponentialAdoption(base: number, target: number, yearOffset: number, totalYears: number): number {
    if (yearOffset === 0) return base;
    const growthRate = Math.pow(target / base, 1 / totalYears) - 1;
    return base * Math.pow(1 + growthRate, yearOffset);
  }

  private sCurveAdoption(base: number, target: number, yearOffset: number, totalYears: number): number {
    if (yearOffset === 0) return base;
    
    // S-curve parameters - more realistic adoption curve
    const k = 0.8; // Steeper growth rate
    const midpoint = totalYears * 0.6; // Shift curve slightly right (slower start)
    
    // Logistic function
    const t = (yearOffset - midpoint) / (totalYears / 3);
    const logistic = 1 / (1 + Math.exp(-k * t));
    
    const result = base + (target - base) * logistic;
    
    // Ensure we don't exceed total vehicle count
    return Math.min(result, this.baseline.fleet.totalVehicles * 0.95);
  }

  private customAdoption(yearOffset: number, targetCounts: Record<number, number>, startYear: number): number {
    const currentYear = startYear + yearOffset;
    
    // If exact year is specified, use it
    if (targetCounts[currentYear]) {
      return targetCounts[currentYear];
    }
    
    // Otherwise interpolate between known points
    const years = Object.keys(targetCounts).map(Number).sort();
    
    // Find surrounding years
    let lowerYear = years[0];
    let upperYear = years[years.length - 1];
    
    for (let i = 0; i < years.length - 1; i++) {
      if (years[i] <= currentYear && years[i + 1] >= currentYear) {
        lowerYear = years[i];
        upperYear = years[i + 1];
        break;
      }
    }
    
    if (lowerYear === upperYear) {
      return targetCounts[lowerYear];
    }
    
    // Linear interpolation
    const ratio = (currentYear - lowerYear) / (upperYear - lowerYear);
    return targetCounts[lowerYear] + (targetCounts[upperYear] - targetCounts[lowerYear]) * ratio;
  }

  private calculateAdoptionRate(year: number, config: ScenarioConfig): number {
    if (year === config.parameters.timeline.startYear) return 0;
    
    const currentFleet = this.calculateFleetComposition(year, config);
    const previousFleet = this.calculateFleetComposition(year - 1, config);
    
    return currentFleet.ev - previousFleet.ev;
  }

  private calculateYearRevenue(year: number, fleet: FleetComposition, config: ScenarioConfig): YearRevenue {
    const evDuty = this.getEVDutyForYear(year, config);
    const iceDuty = this.getICEDutyForYear(year, config);
    
    const fromEV = fleet.ev * evDuty;
    const fromICE = fleet.ice * iceDuty;
    const fromOtherMechanisms = this.calculateOtherMechanisms(year, fleet, config);
    
    return {
      year,
      total: fromEV + fromICE + fromOtherMechanisms,
      fromEV,
      fromICE,
      fromOtherMechanisms
    };
  }

  private calculateBaselineRevenue(year: number): number {
    // Baseline assumes CURRENT duty rates with natural EV growth (no policy changes)
    const yearOffset = year - constants.modelingDefaults.startYear;
    
    if (yearOffset === 0) {
      return this.baseline.revenueModel.currentAnnualRevenue;
    }
    
    // Natural EV growth without policy intervention - conservative estimate
    const naturalGrowthRate = 0.05; // 5% annual growth (conservative)
    const currentEVs = this.baseline.fleet.currentComposition.ev;
    const projectedEVs = Math.min(
      currentEVs * Math.pow(1 + naturalGrowthRate, yearOffset),
      this.baseline.fleet.totalVehicles * 0.15 // Cap at 15% naturally by 2035
    );
    const projectedICEs = this.baseline.fleet.totalVehicles - projectedEVs;
    
    // Use CURRENT duty rates for baseline (£65 EV, £230 ICE)
    return (projectedEVs * 65) + (projectedICEs * 230);
  }

  private getEVDutyForYear(year: number, config: ScenarioConfig): number {
    // Check if there's a specific rate for this year
    if (config.parameters.dutyRates.ev[year] !== undefined) {
      return config.parameters.dutyRates.ev[year];
    }
    
    // Look for the most recent rate before this year
    const availableYears = Object.keys(config.parameters.dutyRates.ev)
      .map(Number)
      .filter(y => y <= year)
      .sort((a, b) => b - a);
    
    if (availableYears.length > 0) {
      return config.parameters.dutyRates.ev[availableYears[0]];
    }
    
    // Fallback to baseline
    return this.baseline.revenueModel.revenuePerEV;
  }

  private getICEDutyForYear(_year: number, _config: ScenarioConfig): number {
    // Simplified - use average ICE duty for now
    // In practice, this would need to account for emission band distribution
    return this.baseline.revenueModel.revenuePerICE;
  }

  private calculateOtherMechanisms(year: number, fleet: FleetComposition, config: ScenarioConfig): number {
    let additional = 0;
    
    const { policyMechanisms } = config.parameters;
    
    // Weight-based mechanism
    if (policyMechanisms.weightBased.enabled && year >= policyMechanisms.weightBased.startYear) {
      // Simplified calculation - would need actual weight data
      const averageWeight = 1500; // kg
      additional += fleet.ev * averageWeight * policyMechanisms.weightBased.ratePerKg;
    }
    
    // Distance-based mechanism
    if (policyMechanisms.distanceBased.enabled && year >= policyMechanisms.distanceBased.startYear) {
      additional += fleet.ev * policyMechanisms.distanceBased.averageMilesPerVehicle * 
                   policyMechanisms.distanceBased.ratePerMile;
    }
    
    return additional;
  }
}
