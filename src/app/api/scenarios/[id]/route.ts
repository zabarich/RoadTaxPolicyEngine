import { NextRequest, NextResponse } from 'next/server';
import { ScenarioConfig } from '@/lib/types';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const SCENARIOS_FILE = join(process.cwd(), 'data', 'scenarios.json');

async function getScenarios(): Promise<ScenarioConfig[]> {
  // Always return empty - scenarios handled client-side
  return [];
}

async function saveScenarios(scenarios: ScenarioConfig[]): Promise<void> {
  // No-op - scenarios saved client-side only
  throw new Error('Server-side storage disabled - using localStorage');
}

// GET /api/scenarios/[id] - Get specific scenario
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const scenarios = await getScenarios();
    const scenario = scenarios.find(s => s.id === id);

    if (!scenario) {
      return NextResponse.json(
        { error: 'Scenario not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      scenario
    });

  } catch (error) {
    console.error('Error fetching scenario:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scenario' },
      { status: 500 }
    );
  }
}

// PUT /api/scenarios/[id] - Update specific scenario
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const scenarios = await getScenarios();
    const scenarioIndex = scenarios.findIndex(s => s.id === id);

    if (scenarioIndex === -1) {
      return NextResponse.json(
        { error: 'Scenario not found' },
        { status: 404 }
      );
    }

    // Update the scenario
    scenarios[scenarioIndex] = {
      ...scenarios[scenarioIndex],
      ...body,
      id: id, // Ensure ID doesn't change
      lastModified: new Date()
    };

    await saveScenarios(scenarios);

    return NextResponse.json({
      scenario: scenarios[scenarioIndex],
      message: 'Scenario updated successfully'
    });

  } catch (error) {
    console.error('Error updating scenario:', error);
    return NextResponse.json(
      { error: 'Failed to update scenario' },
      { status: 500 }
    );
  }
}

// DELETE /api/scenarios/[id] - Delete specific scenario
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const scenarios = await getScenarios();
    const scenarioIndex = scenarios.findIndex(s => s.id === id);

    if (scenarioIndex === -1) {
      return NextResponse.json(
        { error: 'Scenario not found' },
        { status: 404 }
      );
    }

    // Remove the scenario
    const deletedScenario = scenarios.splice(scenarioIndex, 1)[0];
    await saveScenarios(scenarios);

    return NextResponse.json({
      message: 'Scenario deleted successfully',
      deletedScenario: {
        id: deletedScenario.id,
        name: deletedScenario.name
      }
    });

  } catch (error) {
    console.error('Error deleting scenario:', error);
    return NextResponse.json(
      { error: 'Failed to delete scenario' },
      { status: 500 }
    );
  }
}
