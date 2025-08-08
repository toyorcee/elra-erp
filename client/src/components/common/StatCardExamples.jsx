import React from "react";
import { StatCard, StatCardGrid, AnimatedStatCard } from "./StatCard";

// Example usage of StatCard components
export const StatCardExamples = () => {
  return (
    <div className="space-y-8">
      {/* Basic Stat Cards */}
      <div>
        <h3 className="text-xl font-bold mb-4">Basic Stat Cards</h3>
        <StatCardGrid cols={4} gap={6} className="stat-grid">
          <StatCard
            title="Total Users"
            value={1234}
            icon="HiOutlineUsers"
            variant="primary"
          />
          <StatCard
            title="Active Sessions"
            value={89}
            icon="HiOutlineUserGroup"
            variant="success"
          />
          <StatCard
            title="Pending Tasks"
            value={23}
            icon="HiOutlineClock"
            variant="warning"
          />
          <StatCard
            title="System Errors"
            value={5}
            icon="HiOutlineExclamationTriangle"
            variant="danger"
          />
        </StatCardGrid>
      </div>

      {/* Stat Cards with Trends */}
      <div>
        <h3 className="text-xl font-bold mb-4">Stat Cards with Trends</h3>
        <StatCardGrid cols={3} gap={6} className="stat-grid">
          <StatCard
            title="Revenue"
            value={45678}
            icon="HiOutlineCurrencyDollar"
            variant="success"
            trend="up"
            trendValue="+12.5%"
          />
          <StatCard
            title="Orders"
            value={1234}
            icon="HiOutlineShoppingCart"
            variant="primary"
            trend="up"
            trendValue="+8.2%"
          />
          <StatCard
            title="Returns"
            value={45}
            icon="HiOutlineArrowPath"
            variant="danger"
            trend="down"
            trendValue="-3.1%"
          />
        </StatCardGrid>
      </div>

      {/* Animated Stat Cards */}
      <div>
        <h3 className="text-xl font-bold mb-4">Animated Stat Cards</h3>
        <StatCardGrid cols={3} gap={6} className="stat-grid">
          <AnimatedStatCard
            title="Fade Animation"
            value={100}
            icon="HiOutlineStar"
            variant="purple"
            animation="fade"
          />
          <AnimatedStatCard
            title="Slide Animation"
            value={200}
            icon="HiOutlineHeart"
            variant="info"
            animation="slide"
          />
          <AnimatedStatCard
            title="Bounce Animation"
            value={300}
            icon="HiOutlineSparkles"
            variant="secondary"
            animation="bounce"
          />
        </StatCardGrid>
      </div>

      {/* Different Sizes */}
      <div>
        <h3 className="text-xl font-bold mb-4">Different Sizes</h3>
        <StatCardGrid cols={3} gap={6} className="stat-grid">
          <AnimatedStatCard
            title="Small Card"
            value={50}
            icon="HiOutlineCube"
            variant="primary"
            size="small"
          />
          <AnimatedStatCard
            title="Default Size"
            value={100}
            icon="HiOutlineCube"
            variant="primary"
            size="default"
          />
          <AnimatedStatCard
            title="Large Card"
            value={150}
            icon="HiOutlineCube"
            variant="primary"
            size="large"
          />
        </StatCardGrid>
      </div>

      {/* Loading States */}
      <div>
        <h3 className="text-xl font-bold mb-4">Loading States</h3>
        <StatCardGrid cols={4} gap={6} className="stat-grid">
          <StatCard loading={true} />
          <StatCard loading={true} />
          <StatCard loading={true} />
          <StatCard loading={true} />
        </StatCardGrid>
      </div>

      {/* All Variants */}
      <div>
        <h3 className="text-xl font-bold mb-4">All Color Variants</h3>
        <StatCardGrid cols={4} gap={6} className="stat-grid">
          <StatCard
            title="Primary"
            value={100}
            icon="HiOutlineHome"
            variant="primary"
          />
          <StatCard
            title="Secondary"
            value={200}
            icon="HiOutlineHome"
            variant="secondary"
          />
          <StatCard
            title="Success"
            value={300}
            icon="HiOutlineHome"
            variant="success"
          />
          <StatCard
            title="Warning"
            value={400}
            icon="HiOutlineHome"
            variant="warning"
          />
          <StatCard
            title="Danger"
            value={500}
            icon="HiOutlineHome"
            variant="danger"
          />
          <StatCard
            title="Info"
            value={600}
            icon="HiOutlineHome"
            variant="info"
          />
          <StatCard
            title="Purple"
            value={700}
            icon="HiOutlineHome"
            variant="purple"
          />
        </StatCardGrid>
      </div>
    </div>
  );
};

// Usage examples for different dashboards
export const DashboardExamples = {
  // Super Admin Dashboard Stats
  superAdmin: [
    {
      title: "Total Users",
      value: 1234,
      icon: "HiOutlineUsers",
      variant: "info",
      trend: "up",
      trendValue: "+12%",
    },
    {
      title: "Total Documents",
      value: 5678,
      icon: "HiOutlineDocumentText",
      variant: "success",
      trend: "up",
      trendValue: "+8%",
    },
    {
      title: "Departments",
      value: 12,
      icon: "HiOutlineBuildingOffice2",
      variant: "purple",
    },
    {
      title: "Pending Approvals",
      value: 45,
      icon: "HiOutlineClock",
      variant: "warning",
      trend: "down",
      trendValue: "-5%",
    },
  ],

  // User Dashboard Stats
  user: [
    {
      title: "My Documents",
      value: 23,
      icon: "HiOutlineDocumentText",
      variant: "primary",
    },
    {
      title: "Shared With Me",
      value: 15,
      icon: "HiOutlineUserGroup",
      variant: "info",
    },
    {
      title: "Pending Approvals",
      value: 7,
      icon: "HiOutlineClock",
      variant: "warning",
    },
  ],

  // Admin Dashboard Stats
  admin: [
    {
      title: "Department Users",
      value: 89,
      icon: "HiOutlineUsers",
      variant: "primary",
      trend: "up",
      trendValue: "+5%",
    },
    {
      title: "Department Documents",
      value: 234,
      icon: "HiOutlineDocumentText",
      variant: "success",
      trend: "up",
      trendValue: "+12%",
    },
    {
      title: "Approval Queue",
      value: 12,
      icon: "HiOutlineCheckCircle",
      variant: "warning",
    },
    {
      title: "System Health",
      value: "98%",
      icon: "HiOutlineHeart",
      variant: "success",
    },
  ],
};

export default StatCardExamples;
