import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const PieChart = ({
  data,
  title,
  height = 300,
  showLegend = true,
  colors = [
    "#2563EB",
    "#059669",
    "#D97706",
    "#DC2626",
    "#7C3AED",
    "#0891B2",
    "#65A30D",
    "#EA580C",
  ],
  className = "",
}) => {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: "right",
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
            const label = context.label || "";
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: NGN ${value.toLocaleString(
              "en-NG"
            )} (${percentage}%)`;
          },
        },
      },
    },
    elements: {
      arc: {
        borderWidth: 3,
        borderColor: "#ffffff",
        hoverBorderWidth: 4,
        hoverBorderColor: "#ffffff",
      },
    },
  };

  // Process data to ensure it has the right colors
  const processedData = {
    ...data,
    datasets: data.datasets?.map((dataset) => ({
      ...dataset,
      backgroundColor:
        dataset.backgroundColor || colors.slice(0, data.labels?.length),
      borderColor: dataset.borderColor || "#ffffff",
      borderWidth: dataset.borderWidth || 3,
      hoverBorderWidth: 4,
    })),
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}
    >
      <div style={{ height: `${height}px` }}>
        <Pie data={processedData} options={defaultOptions} />
      </div>
    </div>
  );
};

export default PieChart;
