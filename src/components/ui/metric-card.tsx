import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard as MetricCardType } from "@/lib/types";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps extends MetricCardType {
  className?: string;
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  format, 
  trend, 
  severity,
  className 
}: MetricCardProps) {
  const formatValue = (val: number | string, fmt: string) => {
    if (typeof val === 'string') return val;
    
    switch (fmt) {
      case 'currency':
        return new Intl.NumberFormat('en-GB', {
          style: 'currency',
          currency: 'GBP',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'number':
        return new Intl.NumberFormat('en-GB').format(val);
      default:
        return val.toString();
    }
  };

  const getSeverityColor = () => {
    switch (severity) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {trend && getTrendIcon()}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${getSeverityColor()}`}>
          {formatValue(value, format)}
        </div>
        {change !== undefined && (
          <p className="text-xs text-muted-foreground">
            {change > 0 ? '+' : ''}{formatValue(change, format)} from baseline
          </p>
        )}
      </CardContent>
    </Card>
  );
}
