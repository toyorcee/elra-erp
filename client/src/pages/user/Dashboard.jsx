import React, { useEffect, useState, useContext } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import SkeletonLoader from "../../components/SkeletonLoader";
import EmptyState from "../../components/EmptyState";
import { StatCard, StatCardGrid } from "../../components/common";
import { getDashboard } from "../../services/dashboard";
import NotificationTester from "../../components/NotificationTester";
import RecentActivities from "../../components/RecentActivities";

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getDashboard()
      .then((res) => {
        setData(res.data.data);
        setLoading(false);
      })
      .catch((err) => {
        toast.error("Failed to load dashboard data");
        setLoading(false);
      });
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6 text-text-primary font-[Poppins]">
        Dashboard
      </h1>

      {/* Notification Tester - Remove this after testing */}
      <NotificationTester />

      {/* Stats Grid */}
      <StatCardGrid cols={3} gap={6} className="mb-8 stat-grid">
        {loading ? (
          <>
            <StatCard loading={true} />
            <StatCard loading={true} />
            <StatCard loading={true} />
          </>
        ) : data ? (
          <>
            <StatCard
              title="Total Documents"
              value={data.totalDocuments}
              icon="HiOutlineDocumentText"
              variant="primary"
            />
            <StatCard
              title="My Documents"
              value={data.myDocuments}
              icon="HiOutlineFolder"
              variant="info"
            />
            <StatCard
              title="Pending Approvals"
              value={data.pendingApprovals}
              icon="HiOutlineClock"
              variant="warning"
            />
          </>
        ) : (
          <EmptyState
            title="No dashboard data"
            message="No dashboard data available."
          />
        )}
      </StatCardGrid>
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2 text-blue-900">
          Recent Documents
        </h2>
        {loading ? (
          <SkeletonLoader className="h-16 mb-2" />
        ) : data && data.recentDocuments.length ? (
          <ul className="divide-y divide-blue-100 bg-white/70 rounded-xl shadow">
            {data.recentDocuments.map((doc) => (
              <li
                key={doc._id}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between"
              >
                <span className="font-medium text-blue-800">{doc.title}</span>
                <span className="text-xs text-blue-500">
                  {doc.uploadedBy?.name}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No recent documents"
            message="No recent documents found."
          />
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/80 rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-2 text-blue-900">
            Documents by Status
          </h3>
          {loading ? (
            <SkeletonLoader className="h-20" />
          ) : data && data.documentsByStatus.length ? (
            <ul>
              {data.documentsByStatus.map((s) => (
                <li key={s._id} className="flex justify-between py-1">
                  <span className="capitalize">{s._id.toLowerCase()}</span>
                  <span className="font-bold text-blue-700">{s.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No status data"
              message="No document status data found."
            />
          )}
        </div>
        <div className="bg-white/80 rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-2 text-blue-900">
            Documents by Category
          </h3>
          {loading ? (
            <SkeletonLoader className="h-20" />
          ) : data && data.documentsByCategory.length ? (
            <ul>
              {data.documentsByCategory.map((c) => (
                <li key={c._id} className="flex justify-between py-1">
                  <span>{c._id}</span>
                  <span className="font-bold text-cyan-700">{c.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No category data"
              message="No document category data found."
            />
          )}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="mt-8">
        <div className="bg-white/80 rounded-xl shadow p-6">
          <RecentActivities
            userRole="user"
            maxItems={8}
            showFilters={false}
            compact={true}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
