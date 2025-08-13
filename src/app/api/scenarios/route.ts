import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ScenarioConfig, ScenarioSummary } from '@/lib/types';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

// In a real application, this would use a proper database
// For now, we'll use a JSON file for persistence
const SCENARIOS_FILE = join(process.cwd(), 'data', 'scenarios.json');

// Validation schema for creating scenarios
const CreateScenarioSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().default(''),
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
});

async function getScenarios(): Promise<ScenarioConfig[]> {
  try {
    const data = await readFile(SCENARIOS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist or is invalid, return empty array
    return [];
  }
}

async function saveScenarios(scenarios: ScenarioConfig[]): Promise<void> {
  try {
    await writeFile(SCENARIOS_FILE, JSON.stringify(scenarios, null, 2));
  } catch (error) {
    console.error('Failed to save scenarios:', error);
    throw new Error('Failed to save scenarios');
  }
}

// GET /api/scenarios - List all scenarios
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const summary = searchParams.get('summary') === 'true';

    const scenarios = await getScenarios();

    if (summary) {
      // Return summaries only
      const summaries: ScenarioSummary[] = scenarios.map(scenario => ({
        id: scenario.id,
        name: scenario.name,
        description: scenario.description,
        createdAt: scenario.createdAt,
        lastModified: scenario.createdAt, // TODO: Add proper lastModified tracking
        keyMetrics: {
          totalRevenueChange: 0, // Would need calculation
          peakGap: 0,
          targetYear: null
        }
      }));

      return NextResponse.json({
        scenarios: summaries,
        count: summaries.length
      });
    }

    return NextResponse.json({
      scenarios,
      count: scenarios.length
    });

  } catch (error) {
    console.error('Error fetching scenarios:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scenarios' },
      { status: 500 }
    );
  }
}

// POST /api/scenarios - Create new scenario
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request
    const validation = CreateScenarioSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid scenario format',
          details: validation.error.issues
        },
        { status: 400 }
      );
    }

    const { name, description, parameters } = validation.data;

    // Create new scenario
    const newScenario: ScenarioConfig = {
      id: `scenario_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      createdAt: new Date(),
      parameters: {
        ...parameters,
        dutyRates: {
          ev: Object.fromEntries(
            Object.entries(parameters.dutyRates.ev).map(([year, rate]) => [parseInt(year), rate])
          ),
          iceBands: Object.fromEntries(
            Object.entries(parameters.dutyRates.iceBands).map(([band, rates]) => [
              band,
              Object.fromEntries(
                Object.entries(rates).map(([year, rate]) => [parseInt(year), rate])
              )
            ])
          )
        },
        adoptionModel: {
          ...parameters.adoptionModel,
          targetEVCount: Object.fromEntries(
            Object.entries(parameters.adoptionModel.targetEVCount).map(([year, count]) => [parseInt(year), count])
          )
        }
      }
    };

    // Load existing scenarios and add new one
    const scenarios = await getScenarios();
    scenarios.push(newScenario);
    await saveScenarios(scenarios);

    return NextResponse.json({
      scenario: newScenario,
      message: 'Scenario created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating scenario:', error);
    return NextResponse.json(
      { error: 'Failed to create scenario' },
      { status: 500 }
    );
  }
}
