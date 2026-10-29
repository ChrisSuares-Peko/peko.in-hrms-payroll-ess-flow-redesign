import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import Chart from '../../components/homepage/Chart';

vi.mock('recharts', async (importOriginal) => {
  const actual = (await importOriginal()) as any;
  return {
    ...actual,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
    Bar: ({ dataKey }: any) => <div data-testid={`bar-${dataKey}`} />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="grid" />,
    Cell: ({ fill }: any) => <div data-testid={`cell-${fill}`} />,
  };
});


describe('Chart Component', () => {
  const mockData = [
    { label: '0-1 years', value: 5 },
    { label: '1-3 years', value: 10 },
    { label: '3-5 years', value: 3 },
  ];

  it('renders chart title', () => {
    render(<Chart chartData={mockData} />);
    expect(screen.getByText('Fleet Age Distribution')).toBeInTheDocument();
  });

  it('renders BarChart with Bar', () => {
    render(<Chart chartData={mockData} />);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('bar-value')).toBeInTheDocument();
  });

  it('renders XAxis', () => {
    render(<Chart chartData={mockData} />);
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
  });
});
