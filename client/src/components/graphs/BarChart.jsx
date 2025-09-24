import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const BarChart = ({
  data,
  title,
  height = 300,
  showLegend = true,
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
            return `${label}: NGN ${value.toLocaleString("en-NG")}`;
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
            return `NGN ${value.toLocaleString("en-NG")}`;
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
          display: false,
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
      bar: {
        borderRadius: 6,
        borderSkipped: false,
        borderWidth: 0,
      },
    },
  };

  // Process data to ensure it has the right colors
  const processedData = {
    ...data,
    datasets: data.datasets?.map((dataset, index) => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || colors[index % colors.length],
      borderColor: dataset.borderColor || colors[index % colors.length],
      borderWidth: dataset.borderWidth || 1,
    })),
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}
    >
      <div style={{ height: `${height}px` }}>
        <Bar data={processedData} options={defaultOptions} />
      </div>
    </div>
  );
};

export default BarChart;
