import { DutyRates } from '@/lib/types';

export const dutyRates: DutyRates = {
  "metadata": {
    "source": "Vehicle Duty Order 2023",
    "effectiveDate": "2023-04-01",
    "lastIncrease": "10% in April 2023",
    "currency": "GBP"
  },
  "electricVehicles": {
    "flatRate": {
      "annual": 65,
      "sixMonth": 39,
      "band": "ZEV",
      "description": "All zero emission vehicles regardless of size or weight"
    }
  },
  "emissionBands": {
    "description": "For vehicles first registered after 1 April 2010",
    "bands": {
      "ZEV": {
        "co2Range": "0",
        "annual": 65,
        "sixMonth": 39,
        "description": "Zero emissions"
      },
      "A": {
        "co2Range": "0-50",
        "annual": 65,
        "sixMonth": 39
      },
      "B": {
        "co2Range": "51-75",
        "annual": 65,
        "sixMonth": 39
      },
      "C": {
        "co2Range": "76-100",
        "annual": 65,
        "sixMonth": 39
      },
      "D": {
        "co2Range": "101-110",
        "annual": 65,
        "sixMonth": 39
      },
      "E": {
        "co2Range": "111-120",
        "annual": 79,
        "sixMonth": 46
      },
      "F": {
        "co2Range": "121-130",
        "annual": 169,
        "sixMonth": 91
      },
      "G": {
        "co2Range": "131-140",
        "annual": 203,
        "sixMonth": 108
      },
      "H": {
        "co2Range": "141-150",
        "annual": 235,
        "sixMonth": 124
      },
      "I": {
        "co2Range": "151-165",
        "annual": 268,
        "sixMonth": 140
      },
      "J": {
        "co2Range": "166-175",
        "annual": 302,
        "sixMonth": 157
      },
      "K": {
        "co2Range": "176-185",
        "annual": 336,
        "sixMonth": 174
      },
      "L": {
        "co2Range": "186-200",
        "annual": 394,
        "sixMonth": 203
      },
      "M": {
        "co2Range": "201-225",
        "annual": 410,
        "sixMonth": 211
      },
      "N": {
        "co2Range": "226-255",
        "annual": 700,
        "sixMonth": 356
      },
      "O": {
        "co2Range": "256+",
        "annual": 724,
        "sixMonth": 368
      }
    }
  },
  "statistics": {
    "averageICEDuty": 230,
    "averageEVDuty": 65,
    "evAsPercentOfICE": 28.3,
    "sixMonthAdminCharge": 6,
    "note": "Six-month payment = half annual fee plus £6"
  }
};

// Helper functions for duty calculations
export const getDutyForEmissionBand = (band: string): number => {
  return dutyRates.emissionBands.bands[band]?.annual || dutyRates.statistics.averageICEDuty;
};

export const getEVDuty = (): number => {
  return dutyRates.electricVehicles.flatRate.annual;
};

export const getAverageICEDuty = (): number => {
  return dutyRates.statistics.averageICEDuty;
};
