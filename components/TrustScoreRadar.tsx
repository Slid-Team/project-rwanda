'use client';

import { useEffect, useRef } from 'react';
import { Chart, RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip } from 'chart.js';
import { Dimensions, DIMENSION_LABELS } from '@/lib/types';

Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

interface TrustScoreRadarProps {
  dimensions: Dimensions;
}

export default function TrustScoreRadar({ dimensions }: TrustScoreRadarProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    const labels = Object.keys(dimensions).map(
      (key) => DIMENSION_LABELS[key as keyof Dimensions]
    );
    const data = Object.values(dimensions).map((d) => d.score);

    chartInstance.current = new Chart(ctx, {
      type: 'radar',
      data: {
        labels,
        datasets: [
          {
            label: 'Trust Score',
            data,
            backgroundColor: 'rgba(0, 113, 227, 0.08)',
            borderColor: '#0071E3',
            borderWidth: 2,
            pointBackgroundColor: '#0071E3',
            pointBorderColor: '#fff',
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            min: 0,
            ticks: {
              stepSize: 25,
              color: '#86868B',
              backdropColor: 'transparent',
              font: { size: 10 },
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.04)',
            },
            angleLines: {
              color: 'rgba(0, 0, 0, 0.04)',
            },
            pointLabels: {
              color: '#1D1D1F',
              font: { size: 11, weight: 500 },
            },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1D1D1F',
            titleColor: '#fff',
            bodyColor: '#fff',
            padding: 12,
            cornerRadius: 8,
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [dimensions]);

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Trust Breakdown</h3>
      <div className="w-full max-w-[280px] mx-auto">
        <canvas ref={chartRef} />
      </div>
    </div>
  );
}
