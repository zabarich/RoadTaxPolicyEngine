import { Constants } from '@/lib/types';

export const constants: Constants = {
  "metadata": {
    "description": "Key constants and configuration values for the policy engine",
    "lastUpdated": "2024-01-01"
  },
  "financialConstants": {
    "revenuePerConversion": -165,
    "revenuePerPercentFleetConversion": 107250,
    "averageICEDuty": 230,
    "currentEVDuty": 65,
    "evDutyAsPercentOfICE": 28.3,
    "sixMonthAdminCharge": 6,
    "minimumDuty": 28,
    "maximumDuty": 2197
  },
  "fleetConstants": {
    "totalVehicles": 65000,
    "vehiclesPerPercentage": 650,
    "currentEVCount": 1500,
    "currentEVPercentage": 2.3,
    "motorcyclePercentage": 10,
    "goodsVehiclePercentage": 8
  },
  "modelingDefaults": {
    "startYear": 2024,
    "endYear": 2035,
    "defaultProjectionYears": 10,
    "defaultPriceElasticity": -0.05,
    "defaultAdoptionCurve": "sCurve",
    "inflectionPointYear": 2027
  },
  "adoptionParameters": {
    "baselineGrowthRate": 0.638,
    "conservativeGrowthRate": 0.25,
    "aggressiveGrowthRate": 0.85,
    "maxAdoptionRate": 0.95,
    "earlyAdopterThreshold": 0.025,
    "majorityThreshold": 0.5,
    "laggardThreshold": 0.84
  },
  "scenarioPresets": {
    "statusQuo": {
      "name": "Status Quo",
      "description": "No changes to current duty rates",
      "evDutyGrowth": 0,
      "iceDutyGrowth": 0
    },
    "gradualTransition": {
      "name": "Gradual Transition",
      "description": "Phased increase in EV duty over 6 years",
      "evDutyGrowth": 0.15,
      "iceDutyGrowth": 0.02
    },
    "revenueNeutral": {
      "name": "Revenue Neutral",
      "description": "Maintain current revenue levels",
      "dynamicAdjustment": true,
      "targetRevenue": 14700000
    },
    "aggressiveIncentive": {
      "name": "Aggressive Incentive",
      "description": "Keep low EV duty, increase ICE duty",
      "evDutyGrowth": 0,
      "iceDutyGrowth": 0.08
    },
    "equityFocused": {
      "name": "Equity Focused",
      "description": "Move toward equal contribution by vehicle type",
      "targetRatio": 0.75,
      "transitionYears": 5
    }
  },
  "chartColors": {
    "ev": "#10b981",
    "ice": "#ef4444",
    "hybrid": "#f59e0b",
    "revenue": "#3b82f6",
    "baseline": "#6b7280",
    "projection": "#8b5cf6",
    "warning": "#f97316",
    "success": "#22c55e",
    "error": "#dc2626"
  }
};
