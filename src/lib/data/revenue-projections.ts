export const revenueProjectionsData = {
  "metadata": {
    "description": "Pre-calculated revenue projections for various EV adoption scenarios",
    "baseYear": 2024,
    "currency": "GBP",
    "assumptions": {
      "totalVehicles": 65000,
      "currentEVDuty": 65,
      "averageICEDuty": 230,
      "revenuePerConversion": -165
    }
  },
  "baselineScenario": {
    "description": "Current state maintained",
    "evPercentage": 2.3,
    "evCount": 1500,
    "iceCount": 63500,
    "annualRevenue": 14702500,
    "revenueBreakdown": {
      "fromEVs": 97500,
      "fromICEs": 14605000
    }
  },
  "projectionScenarios": [
    {
      "name": "5% EV Adoption",
      "evPercentage": 5,
      "evCount": 3250,
      "iceCount": 61750,
      "annualRevenue": 14413750,
      "revenueLoss": 288750,
      "percentageLoss": 2.0,
      "revenueBreakdown": {
        "fromEVs": 211250,
        "fromICEs": 14202500
      }
    },
    {
      "name": "10% EV Adoption",
      "evPercentage": 10,
      "evCount": 6500,
      "iceCount": 58500,
      "annualRevenue": 13877500,
      "revenueLoss": 825000,
      "percentageLoss": 5.6,
      "revenueBreakdown": {
        "fromEVs": 422500,
        "fromICEs": 13455000
      }
    },
    {
      "name": "15% EV Adoption",
      "evPercentage": 15,
      "evCount": 9750,
      "iceCount": 55250,
      "annualRevenue": 13341250,
      "revenueLoss": 1361250,
      "percentageLoss": 9.3,
      "revenueBreakdown": {
        "fromEVs": 633750,
        "fromICEs": 12707500
      }
    },
    {
      "name": "20% EV Adoption (2030 Target)",
      "evPercentage": 20,
      "evCount": 13000,
      "iceCount": 52000,
      "annualRevenue": 12805000,
      "revenueLoss": 1897500,
      "percentageLoss": 12.9,
      "revenueBreakdown": {
        "fromEVs": 845000,
        "fromICEs": 11960000
      },
      "notes": "Government target for 2030"
    },
    {
      "name": "25% EV Adoption",
      "evPercentage": 25,
      "evCount": 16250,
      "iceCount": 48750,
      "annualRevenue": 12268750,
      "revenueLoss": 2433750,
      "percentageLoss": 16.6,
      "revenueBreakdown": {
        "fromEVs": 1056250,
        "fromICEs": 11212500
      }
    },
    {
      "name": "30% EV Adoption",
      "evPercentage": 30,
      "evCount": 19500,
      "iceCount": 45500,
      "annualRevenue": 11732500,
      "revenueLoss": 2970000,
      "percentageLoss": 20.2,
      "revenueBreakdown": {
        "fromEVs": 1267500,
        "fromICEs": 10465000
      }
    },
    {
      "name": "50% EV Adoption",
      "evPercentage": 50,
      "evCount": 32500,
      "iceCount": 32500,
      "annualRevenue": 9587500,
      "revenueLoss": 5115000,
      "percentageLoss": 34.8,
      "revenueBreakdown": {
        "fromEVs": 2112500,
        "fromICEs": 7475000
      }
    },
    {
      "name": "75% EV Adoption",
      "evPercentage": 75,
      "evCount": 48750,
      "iceCount": 16250,
      "annualRevenue": 6906250,
      "revenueLoss": 7796250,
      "percentageLoss": 53.0,
      "revenueBreakdown": {
        "fromEVs": 3168750,
        "fromICEs": 3737500
      }
    },
    {
      "name": "100% EV Adoption",
      "evPercentage": 100,
      "evCount": 65000,
      "iceCount": 0,
      "annualRevenue": 4225000,
      "revenueLoss": 10477500,
      "percentageLoss": 71.3,
      "revenueBreakdown": {
        "fromEVs": 4225000,
        "fromICEs": 0
      },
      "notes": "Complete electrification scenario"
    }
  ],
  "yearByYearProjection": {
    "description": "Linear progression to 2030 target",
    "projections": [
      {
        "year": 2024,
        "evCount": 1500,
        "evPercentage": 2.3,
        "revenue": 14702500
      },
      {
        "year": 2025,
        "evCount": 3583,
        "evPercentage": 5.5,
        "revenue": 14358295
      },
      {
        "year": 2026,
        "evCount": 5667,
        "evPercentage": 8.7,
        "revenue": 14014090
      },
      {
        "year": 2027,
        "evCount": 7750,
        "evPercentage": 11.9,
        "revenue": 13669750
      },
      {
        "year": 2028,
        "evCount": 9833,
        "evPercentage": 15.1,
        "revenue": 13325545
      },
      {
        "year": 2029,
        "evCount": 11917,
        "evPercentage": 18.3,
        "revenue": 12981340
      },
      {
        "year": 2030,
        "evCount": 13000,
        "evPercentage": 20.0,
        "revenue": 12805000
      }
    ]
  },
  "revenueNeutralScenarios": {
    "description": "EV duty rates needed to maintain £14.7m revenue",
    "scenarios": [
      {
        "evPercentage": 10,
        "requiredEVDuty": 192,
        "increase": 127
      },
      {
        "evPercentage": 20,
        "requiredEVDuty": 211,
        "increase": 146
      },
      {
        "evPercentage": 30,
        "requiredEVDuty": 217,
        "increase": 152
      },
      {
        "evPercentage": 50,
        "requiredEVDuty": 222,
        "increase": 157
      }
    ]
  },
  "criticalMetrics": {
    "revenuePerPercentEVIncrease": 107250,
    "breakEvenEVDuty": 226,
    "roadsbudgetCoveredUntilEVPercentage": 54,
    "note": "Roads budget remains covered until EVs reach 54% of fleet"
  }
};
