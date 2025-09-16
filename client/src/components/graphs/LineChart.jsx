import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const LineChart = ({
  data,
  title,
  height = 300,
  showLegend = true,
  showArea = false,
  colors = ["#2563EB", "#059669", "#D97706", "#DC2626", "#7C3AED"],
  className = "",
}) => {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: "top",
        labels: {
          usePointStyle: true,
          padding: 25,
          font: {
            size: 14,
            weight: "600",
            family: "'Inter', 'Segoe UI', sans-serif",
          },
          color: "#374151",
        },
      },
      title: {
        display: !!title,
        text: title,
        font: {
          size: 20,
          weight: "700",
          family: "'Inter', 'Segoe UI', sans-serif",
        },
        color: "#111827",
      },
      tooltip: {
        backgroundColor: "rgba(17, 24, 39, 0.95)",
        titleColor: "#F9FAFB",
        bodyColor: "#F9FAFB",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 2,
        cornerRadius: 12,
        displayColors: true,
        mode: "index",
        intersect: false,
        titleFont: {
          size: 14,
          weight: "600",
        },
        bodyFont: {
          size: 13,
          weight: "500",
        },
        padding: 12,
        callbacks: {
          label: function (context) {
            const label = context.dataset.label || "";
            const value = context.parsed.y;
            return `${label}: ${value.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
          lineWidth: 1,
        },
        ticks: {
          callback: function (value) {
            return value.toLocaleString();
          },
          font: {
            size: 12,
            weight: "500",
            family: "'Inter', 'Segoe UI', sans-serif",
          },
          color: "#6B7280",
        },
        title: {
          display: true,
          text: "Amount (₦)",
          font: {
            size: 13,
            weight: "600",
            family: "'Inter', 'Segoe UI', sans-serif",
          },
          color: "#374151",
        },
      },
      x: {
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
          lineWidth: 1,
        },
        ticks: {
          font: {
            size: 12,
            weight: "500",
            family: "'Inter', 'Segoe UI', sans-serif",
          },
          color: "#6B7280",
        },
      },
    },
    elements: {
      point: {
        radius: 5,
        hoverRadius: 8,
        borderWidth: 3,
        hoverBorderWidth: 4,
      },
      line: {
        tension: 0.4,
        borderWidth: 4,
      },
    },
    interaction: {
      mode: "index",
      intersect: false,
    },
  };

  // Process data to ensure it has the right colors and area fill
  const processedData = {
    ...data,
    datasets: data.datasets?.map((dataset, index) => ({
      ...dataset,
      borderColor: dataset.borderColor || colors[index % colors.length],
      backgroundColor: showArea
        ? dataset.backgroundColor || `${colors[index % colors.length]}20`
        : dataset.backgroundColor || colors[index % colors.length],
      fill: showArea ? "origin" : false,
      pointBackgroundColor:
        dataset.pointBackgroundColor || colors[index % colors.length],
      pointBorderColor: dataset.pointBorderColor || "#ffffff",
    })),
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}
    >
      <div style={{ height: `${height}px` }}>
        <Line data={processedData} options={defaultOptions} />
      </div>
    </div>
  );
};

export default LineChart;
