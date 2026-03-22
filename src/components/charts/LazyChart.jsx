import React, { Suspense } from 'react';
import { BarChart as RechartsBarChart, AreaChart as RechartsAreaChart, LineChart as RechartsLineChart } from 'recharts';

const ChartFallback = () => (
  <div className="w-full h-48 bg-secondary/40 rounded-lg animate-pulse" />
);

export function LazyBarChart(props) {
  return (
    <Suspense fallback={<ChartFallback />}>
      <RechartsBarChart {...props} />
    </Suspense>
  );
}

export function LazyAreaChart(props) {
  return (
    <Suspense fallback={<ChartFallback />}>
      <RechartsAreaChart {...props} />
    </Suspense>
  );
}

export function LazyLineChart(props) {
  return (
    <Suspense fallback={<ChartFallback />}>
      <RechartsLineChart {...props} />
    </Suspense>
  );
}