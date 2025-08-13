import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RevenueCalculator } from '@/lib/engine/revenue-calculator';
import { baselineData } from '@/lib/data/baseline-data';
import { ScenarioConfig } from '@/lib/types';

// Validation schema for the request
const CalculateRequestSchema = z.object({
  scenario: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    createdAt: z.string().transform(str => new Date(str)),
    parameters: z.object({
      timeline: z.object({
        startYear: z.number(),
        endYear: z.number()
      }),
      dutyRates: z.object({
        ev: z.record(z.string(), z.number()),
        iceBands: z.record(z.string(), z.record(z.string(), z.number()))
      }),
      adoptionModel: z.object({
        type: z.enum(['linear', 'exponential', 'sCurve', 'custom']),
        targetEVCount: z.record(z.string(), z.number()),
        priceElasticity: z.number()
      }),
      policyMechanisms: z.object({
        weightBased: z.object({
          enabled: z.boolean(),
          ratePerKg: z.number(),
          startYear: z.number()
        }),
        distanceBased: z.object({
          enabled: z.boolean(),
          ratePerMile: z.number(),
          startYear: z.number(),
          averageMilesPerVehicle: z.number()
        })
      })
    })
  })
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request
    const validation = CalculateRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request format',
          details: validation.error.issues
        },
        { status: 400 }
      );
    }

    const { scenario } = validation.data;
    
    // Convert string keys back to numbers for the calculator
    const processedScenario: ScenarioConfig = {
      ...scenario,
      parameters: {
        ...scenario.parameters,
        dutyRates: {
          ev: Object.fromEntries(
            Object.entries(scenario.parameters.dutyRates.ev).map(([year, rate]) => [parseInt(year), rate])
          ),
          iceBands: Object.fromEntries(
            Object.entries(scenario.parameters.dutyRates.iceBands).map(([band, rates]) => [
              band,
              Object.fromEntries(
                Object.entries(rates).map(([year, rate]) => [parseInt(year), rate])
              )
            ])
          )
        },
        adoptionModel: {
          ...scenario.parameters.adoptionModel,
          targetEVCount: Object.fromEntries(
            Object.entries(scenario.parameters.adoptionModel.targetEVCount).map(([year, count]) => [parseInt(year), count])
          )
        }
      }
    };

    // Perform calculation
    const calculator = new RevenueCalculator(baselineData);
    const results = calculator.calculate(processedScenario);

    // Generate warnings based on results
    const warnings: string[] = [];
    
    if (results.metrics.peakRevenueGap > 2000000) {
      warnings.push('Revenue loss exceeds £2M annually - consider policy adjustments');
    }
    
    if (!results.impacts.meetsTargets) {
      warnings.push('Scenario does not meet 2030 EV adoption targets');
    }
    
    if (results.revenue.breakEvenYear && results.revenue.breakEvenYear > 2040) {
      warnings.push('Revenue stabilization takes longer than expected');
    }

    // Add calculation insights
    const insights: string[] = [];
    
    if (results.revenue.breakEvenYear) {
      insights.push(`Revenue stabilizes by ${results.revenue.breakEvenYear}`);
    }
    
    if (results.metrics.peakRevenueGap < 0) {
      insights.push('Policy generates net revenue gain');
    }
    
    if (results.impacts.meetsTargets && results.metrics.targetAchievementYear) {
      insights.push(`EV targets achieved by ${results.metrics.targetAchievementYear}`);
    }

    return NextResponse.json({
      results,
      warnings,
      insights,
      calculatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Calculation error:', error);
    return NextResponse.json(
      { 
        error: 'Internal calculation error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Policy Engine Calculation API',
    version: '1.0.0',
    endpoints: {
      'POST /api/calculate': 'Calculate scenario results',
      'GET /api/scenarios': 'List all scenarios',
      'POST /api/scenarios': 'Create new scenario',
      'GET /api/scenarios/[id]': 'Get specific scenario',
      'DELETE /api/scenarios/[id]': 'Delete scenario',
      'POST /api/export-pdf': 'Generate PDF report'
    }
  });
}
