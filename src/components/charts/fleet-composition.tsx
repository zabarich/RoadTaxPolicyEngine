'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { FleetChartData } from '@/lib/types';
import { constants } from '@/lib/data/constants';

interface FleetCompositionProps {
  data: FleetChartData[];
  targetLine?: number;
  showPercentage?: boolean;
  className?: string;
}

export function FleetComposition({ 
  data, 
  targetLine,
  showPercentage = false,
  className 
}: FleetCompositionProps) {
  const formatNumber = (value: number) => {
    if (showPercentage) {
      return `${value.toFixed(1)}%`;
    }
    return new Intl.NumberFormat('en-GB', {
      notation: value >= 1000 ? 'compact' : 'standard',
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
              {`${entry.name}: ${formatNumber(entry.value)}`}
            </p>
          ))}
          {!showPercentage && payload.length >= 2 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Total: {formatNumber(payload.reduce((sum: number, p: { value: number }) => sum + p.value, 0))}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (showPercentage) {
    return (
      <div className={className}>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="year" 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value}%`}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            <Line
              type="monotone"
              dataKey="evPercentage"
              stroke={constants.chartColors.ev}
              strokeWidth={3}
              name="EV Market Share"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            
            {targetLine && (
              <Line
                type="monotone"
                dataKey="target"
                stroke={constants.chartColors.warning}
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Government Target"
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="year" 
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={formatNumber}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          <Area
            type="monotone"
            dataKey="iceCount"
            stackId="1"
            stroke={constants.chartColors.ice}
            fill={constants.chartColors.ice}
            fillOpacity={0.7}
            name="ICE Vehicles"
          />
          <Area
            type="monotone"
            dataKey="evCount"
            stackId="1"
            stroke={constants.chartColors.ev}
            fill={constants.chartColors.ev}
            fillOpacity={0.7}
            name="Electric Vehicles"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
