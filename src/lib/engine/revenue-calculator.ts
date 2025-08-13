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
    
    // Check if targets are met
    const finalYear = timeline.endYear;
    const finalFleet = results.fleet.compositionByYear[finalYear];
    const targetEVCount = this.baseline.fleet.projections.governmentTarget2030;
    results.impacts.meetsTargets = finalFleet.ev >= targetEVCount;
    
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
    const finalTarget = adoptionModel.targetEVCount[targetYear] || 
                       this.baseline.fleet.projections.governmentTarget2030;

    switch (adoptionModel.type) {
      case 'linear':
        return this.linearAdoption(baseEVCount, finalTarget, yearOffset, totalYears);
      
      case 'exponential':
        return this.exponentialAdoption(baseEVCount, finalTarget, yearOffset, totalYears);
      
      case 'sCurve':
        return this.sCurveAdoption(baseEVCount, finalTarget, yearOffset, totalYears);
      
      case 'custom':
        return this.customAdoption(yearOffset, adoptionModel.targetEVCount, config.parameters.timeline.startYear);
      
      default:
        return this.sCurveAdoption(baseEVCount, finalTarget, yearOffset, totalYears);
    }
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
    
    // S-curve parameters
    const k = 0.5; // Growth rate parameter
    const midpoint = totalYears / 2;
    
    // Logistic function
    const t = (yearOffset - midpoint) / (totalYears / 4);
    const logistic = 1 / (1 + Math.exp(-k * t));
    
    return base + (target - base) * logistic;
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
    // Baseline assumes current duty rates and natural EV growth without policy intervention
    const yearOffset = year - constants.modelingDefaults.startYear;
    const naturalGrowthRate = constants.adoptionParameters.baselineGrowthRate;
    
    const currentEVs = this.baseline.fleet.currentComposition.ev;
    const projectedEVs = currentEVs * Math.pow(1 + naturalGrowthRate, yearOffset);
    const projectedICEs = this.baseline.fleet.totalVehicles - projectedEVs;
    
    return (projectedEVs * this.baseline.revenueModel.revenuePerEV) + 
           (projectedICEs * this.baseline.revenueModel.revenuePerICE);
  }

  private getEVDutyForYear(year: number, config: ScenarioConfig): number {
    return config.parameters.dutyRates.ev[year] || this.baseline.revenueModel.revenuePerEV;
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
