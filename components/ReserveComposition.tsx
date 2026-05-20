'use client';

import { useEffect, useRef } from 'react';
import { Chart, ArcElement, Tooltip, Legend, DoughnutController } from 'chart.js';
import { ReserveComposition as ReserveCompositionType } from '@/lib/types';

Chart.register(ArcElement, Tooltip, Legend, DoughnutController);

interface ReserveCompositionProps {
  composition: ReserveCompositionType;
}

const LABELS: Record<keyof ReserveCompositionType, string> = {
  cashAndCashEquivalents: 'Cash',
  treasuryBills: 'T-Bills',
  commercialPaper: 'Commercial Paper',
  corporateBonds: 'Bonds',
  securedLoans: 'Loans',
  other: 'Other',
};

// Apple-style colors
const COLORS = [
  '#0071E3', // Blue
  '#34C759', // Green
  '#FF9500', // Orange
  '#AF52DE', // Purple
  '#FF2D55', // Pink
  '#86868B', // Gray
];

export default function ReserveComposition({ composition }: ReserveCompositionProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    const entries = Object.entries(composition).filter(([_, value]) => value > 0);
    const labels = entries.map(([key]) => LABELS[key as keyof ReserveCompositionType]);
    const data = entries.map(([_, value]) => value);
    const colors = entries.map((_, index) => COLORS[index % COLORS.length]);

    chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors,
            borderColor: '#FFFFFF',
            borderWidth: 4,
            hoverOffset: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#1D1D1F',
              padding: 16,
              usePointStyle: true,
              pointStyle: 'circle',
              font: { size: 11 },
            },
          },
          tooltip: {
            backgroundColor: '#1D1D1F',
            titleColor: '#fff',
            bodyColor: '#fff',
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (context) => ` ${context.label}: ${context.parsed}%`,
            },
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [composition]);

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Reserves</h3>
      <div className="w-full max-w-[240px] mx-auto">
        <canvas ref={chartRef} />
      </div>
    </div>
  );
}
