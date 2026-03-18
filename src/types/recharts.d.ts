// Fix recharts JSX component type errors with React 18 types
// See: https://github.com/recharts/recharts/issues/3615
import type { ComponentType } from 'react';

declare module 'recharts' {
  export const XAxis: ComponentType<any>;
  export const YAxis: ComponentType<any>;
  export const Tooltip: ComponentType<any>;
  export const Area: ComponentType<any>;
  export const Bar: ComponentType<any>;
  export const Pie: ComponentType<any>;
  export const Cell: ComponentType<any>;
  export const Legend: ComponentType<any>;
  export const CartesianGrid: ComponentType<any>;
  export const Line: ComponentType<any>;
  export const ResponsiveContainer: ComponentType<any>;
  export const AreaChart: ComponentType<any>;
  export const BarChart: ComponentType<any>;
  export const PieChart: ComponentType<any>;
  export const LineChart: ComponentType<any>;
  export const RadarChart: ComponentType<any>;
  export const Radar: ComponentType<any>;
  export const PolarGrid: ComponentType<any>;
  export const PolarAngleAxis: ComponentType<any>;
  export const PolarRadiusAxis: ComponentType<any>;
  export const ReferenceLine: ComponentType<any>;
}
