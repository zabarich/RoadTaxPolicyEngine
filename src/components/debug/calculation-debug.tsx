'use client';

import { usePolicyEngineStore } from '@/lib/store/policy-engine-store';
import { RevenueCalculator } from '@/lib/engine/revenue-calculator';
import { constants } from '@/lib/data/constants';

export function CalculationDebug() {
  const { currentScenario, baseline, results } = usePolicyEngineStore();
  
  // Manual calculation for debugging
  const debugCalculation = () => {
    const calculator = new RevenueCalculator(baseline);
    const testResults = calculator.calculate(currentScenario);
    
    console.log('=== DEBUG CALCULATION ===');
    console.log('Current EV Duty:', currentScenario.parameters.dutyRates.ev[2024]);
    console.log('Target 2030:', currentScenario.parameters.adoptionModel.targetEVCount[2030]);
    console.log('Adoption Type:', currentScenario.parameters.adoptionModel.type);
    
    // Check 2030 specifically
    const fleet2030 = testResults.fleet.compositionByYear[2030];
    const revenue2030 = testResults.revenue.byYear[2030];
    
    console.log('2030 Fleet:', fleet2030);
    console.log('2030 Revenue:', revenue2030);
    console.log('Peak Gap:', testResults.metrics.peakRevenueGap);
    console.log('Meets Targets:', testResults.impacts.meetsTargets);
    
    return testResults;
  };

  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="bg-yellow-50 p-4 rounded border">
        <h4 className="font-bold">Debug Info</h4>
        <div className="text-xs space-y-1">
          <div>EV Duty: £{currentScenario.parameters.dutyRates.ev[2024] || 65}</div>
          <div>ICE Duty: £230</div>
          <div>Target 2030: {currentScenario.parameters.adoptionModel.targetEVCount[2030] || 'Not set'} EVs</div>
          <div>Current EVs: {constants.fleetConstants.currentEVCount}</div>
          {results && (
            <>
              <div>Final Fleet 2035: {results.fleet.compositionByYear[2035]?.ev.toFixed(0)} EVs</div>
              <div>Peak Gap: £{results.metrics.peakRevenueGap.toFixed(0)}</div>
              <div>Target Met: {results.impacts.meetsTargets ? 'Yes' : 'No'}</div>
            </>
          )}
          <button 
            onClick={debugCalculation}
            className="bg-blue-500 text-white px-2 py-1 rounded text-xs mt-2"
          >
            Debug Calculate
          </button>
        </div>
      </div>
    );
  }
  
  return null;
}
