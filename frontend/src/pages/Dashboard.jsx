// 42Nexus - Dashboard Page
// This file is for: FATYZA (Frontend Developer)
// Description: Welcome page with stats overview

import { useAuthStore } from '../store/authStore';
import { useEffect, useState } from 'react';
import api from '../services/api';

function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    resources: 0,
    votes: 0,
    disputes: 0,
    tests: 0,
  });

  useEffect(() => {
    // Fetch stats
    const fetchStats = async () => {
      try {
        const [resources, votes, disputes, tests] = await Promise.all([
          api.get('/resources'),
          api.get('/votes'),
          api.get('/disputes'),
          api.get('/tests'),
        ]);
        setStats({
          resources: resources.data.length,
          votes: votes.data.length,
          disputes: disputes.data.length,
          tests: tests.data.length,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.display_name || user?.login}! 👋
        </h1>
        <p className="text-gray-400">
          Here's what's happening in the 42Nexus community
        </p>
      </div>

      {/* Staff Badge */}
      {user?.role === 'staff' && (
        <div className="mb-8 p-4 bg-purple-900/30 border border-purple-500 rounded-lg">
          <p className="text-purple-400 font-semibold">👑 Staff Access</p>
          <p className="text-sm text-gray-300">
            You have the power to make FINAL decisions on votes and disputes
          </p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon="📚"
          label="Resources"
          value={stats.resources}
          color="bg-blue-500"
        />
        <StatCard
          icon="🗳️"
          label="Active Votes"
          value={stats.votes}
          color="bg-green-500"
        />
        <StatCard
          icon="⚡"
          label="Disputes"
          value={stats.disputes}
          color="bg-yellow-500"
        />
        <StatCard
          icon="🧪"
          label="Test Cases"
          value={stats.tests}
          color="bg-purple-500"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-42-dark rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickAction href="/resources" icon="📚" label="Add Resource" />
          <QuickAction href="/votes" icon="🗳️" label="Create Vote" />
          <QuickAction href="/disputes" icon="⚡" label="Report Dispute" />
          <QuickAction href="/tests" icon="🧪" label="Share Test" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-42-dark rounded-xl p-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center text-2xl`}>
          {icon}
        </div>
        <div>
          <p className="text-3xl font-bold">{value}</p>
          <p className="text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ href, icon, label }) {
  return (
    <a
      href={href}
      className="flex flex-col items-center gap-2 p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-sm">{label}</span>
    </a>
  );
}

export default Dashboard;
