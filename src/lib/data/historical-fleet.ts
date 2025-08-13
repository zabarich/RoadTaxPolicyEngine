export const historicalFleetData = {
  "metadata": {
    "description": "Historical fleet composition and EV adoption data for Isle of Man",
    "sources": [
      "iomtoday.co.im - April 24, 2025",
      "RAC Drive - December 2019",
      "FrankDrives - November 28, 2021",
      "Manx Radio - Various dates"
    ]
  },
  "historicalData": [
    {
      "year": 2018,
      "evCount": 79,
      "hybridCount": null,
      "totalVehicles": null,
      "evPercentage": null,
      "notes": "Baseline year for growth calculations"
    },
    {
      "year": 2019,
      "evCount": 280,
      "hybridCount": 706,
      "totalVehicles": null,
      "evPercentage": null,
      "notes": "First significant uptake"
    },
    {
      "year": 2020,
      "evCount": null,
      "hybridCount": null,
      "totalVehicles": null,
      "evPercentage": null,
      "notes": "Last vehicle duty increase before 2023"
    },
    {
      "year": 2021,
      "evCount": 600,
      "hybridCount": null,
      "totalVehicles": null,
      "evPercentage": null,
      "notes": "Battery electric vehicles only"
    },
    {
      "year": 2022,
      "evCount": null,
      "hybridCount": null,
      "totalVehicles": null,
      "evPercentage": null,
      "notes": "Data not available"
    },
    {
      "year": 2023,
      "evCount": null,
      "hybridCount": null,
      "totalVehicles": null,
      "evPercentage": null,
      "notes": "EVs began paying £65 duty for first time"
    },
    {
      "year": 2024,
      "evCount": 1500,
      "hybridCount": null,
      "totalVehicles": 65000,
      "evPercentage": 2.3,
      "notes": "Current state, nearly 1500 EVs reported"
    }
  ],
  "growthMetrics": {
    "totalGrowth2018to2024": {
      "percentage": 1176,
      "absoluteIncrease": 1421,
      "averageYearlyIncrease": 237
    },
    "growthRate": {
      "2018to2019": 254.4,
      "2019to2021": 114.3,
      "2021to2024": 150.0,
      "compoundAnnualGrowthRate": 63.8
    }
  },
  "milestones": [
    {
      "year": 2023,
      "event": "EVs start paying vehicle duty",
      "amount": 65
    },
    {
      "year": 2024,
      "event": "EVs exceed 5% of fleet (including hybrids)",
      "percentage": 5
    },
    {
      "year": 2030,
      "event": "Government target",
      "targetEVs": 13000
    }
  ],
  "projectionScenarios": {
    "linear": {
      "description": "Constant addition of vehicles per year",
      "rate": 1875,
      "projection2030": 12750
    },
    "exponential": {
      "description": "Maintaining current growth rate",
      "rate": 0.64,
      "projection2030": 38000
    },
    "sCurve": {
      "description": "Adoption follows typical S-curve",
      "inflectionPoint": 2027,
      "projection2030": 15000
    },
    "conservative": {
      "description": "Government low ambition scenario",
      "projection2030": 10000
    }
  }
};
