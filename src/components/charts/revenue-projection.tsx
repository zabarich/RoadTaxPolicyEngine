'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RevenueChartData } from '@/lib/types';
import { constants } from '@/lib/data/constants';

interface RevenueProjectionProps {
  data: RevenueChartData[];
  showBreakdown?: boolean;
  className?: string;
}

export function RevenueProjection({ 
  data, 
  showBreakdown = false, 
  className 
}: RevenueProjectionProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: value >= 1000000 ? 'compact' : 'standard',
      compactDisplay: 'short'
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{`Year: ${label}`}</p>
          {payload.map((entry: { name: string; value: number; color: string }, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${formatCurrency(entry.value)}`}
            </p>
          ))}
          {payload.length >= 2 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Gap: {formatCurrency(payload[0].value - payload[1].value)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="year" 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => value.toString()}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={formatCurrency}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {/* Baseline revenue line */}
          <Line
            type="monotone"
            dataKey="baseline"
            stroke={constants.chartColors.baseline}
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Baseline"
            dot={false}
          />
          
          {/* Scenario revenue line */}
          <Line
            type="monotone"
            dataKey="scenario"
            stroke={constants.chartColors.revenue}
            strokeWidth={3}
            name="Scenario Total"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          
          {/* Breakdown lines if enabled */}
          {showBreakdown && (
            <>
              <Line
                type="monotone"
                dataKey="ev"
                stroke={constants.chartColors.ev}
                strokeWidth={2}
                name="EV Revenue"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="ice"
                stroke={constants.chartColors.ice}
                strokeWidth={2}
                name="ICE Revenue"
                dot={false}
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
