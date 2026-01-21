// 42Nexus - Disputes Page
// This file is for: FATYZA (Frontend Developer)
// Description: Correction disputes with STAFF OVERRIDE

import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useProjectsStore } from '../store/projectsStore';
import api from '../services/api';

function Disputes() {
  const { user } = useAuthStore();
  const { projects, fetchProjects } = useProjectsStore();
  const [disputes, setDisputes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState({ projectId: '', status: '', urgency: '' });

  useEffect(() => {
    fetchProjects();
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.projectId) params.append('project_id', filter.projectId);
      if (filter.status) params.append('status', filter.status);
      if (filter.urgency) params.append('urgency', filter.urgency);
      
      const { data } = await api.get(`/disputes?${params}`);
      setDisputes(data);
    } catch (error) {
      console.error('Failed to fetch disputes:', error);
    }
    setIsLoading(false);
  };

  const handleVote = async (disputeId, voteFor) => {
    try {
      await api.post(`/disputes/${disputeId}/vote?vote_for=${voteFor}`);
      fetchDisputes();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to vote');
    }
  };

  const handleStaffDecide = async (disputeId, winner) => {
    if (!confirm(`Are you sure "${winner}" wins? This is FINAL!`)) return;
    try {
      await api.post(`/disputes/${disputeId}/staff-decide?winner=${winner}`);
      fetchDisputes();
    } catch (error) {
      console.error('Failed to decide:', error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">⚡ Live Disputes</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-42-teal hover:bg-teal-600 rounded-lg"
        >
          + Report Dispute
        </button>
      </div>

      {/* Staff Notice */}
      {user?.role === 'staff' && (
        <div className="mb-6 p-4 bg-purple-900/30 border border-purple-500 rounded-lg">
          <p className="text-purple-400 font-semibold">👑 Staff Override Available</p>
          <p className="text-sm text-gray-300">
            You can make FINAL decisions on any dispute
          </p>
        </div>
      )}

      {/* Add Dispute Form */}
      {showForm && (
        <DisputeForm
          projects={projects}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            fetchDisputes();
          }}
        />
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={filter.projectId}
          onChange={(e) => setFilter({ ...filter, projectId: e.target.value })}
          className="px-4 py-2 bg-42-dark rounded-lg border border-gray-700"
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          className="px-4 py-2 bg-42-dark rounded-lg border border-gray-700"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="resolved">Resolved</option>
          <option value="staff_decided">Staff Decided</option>
        </select>
        <select
          value={filter.urgency}
          onChange={(e) => setFilter({ ...filter, urgency: e.target.value })}
          className="px-4 py-2 bg-42-dark rounded-lg border border-gray-700"
        >
          <option value="">All Urgency</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button
          onClick={fetchDisputes}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
        >
          Apply Filter
        </button>
      </div>

      {/* Disputes List */}
      {isLoading ? (
        <div className="text-center py-12">Loading...</div>
      ) : disputes.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No disputes found</div>
      ) : (
        <div className="space-y-6">
          {disputes.map((dispute) => (
            <DisputeCard
              key={dispute.id}
              dispute={dispute}
              onVote={handleVote}
              onStaffDecide={handleStaffDecide}
              isStaff={user?.role === 'staff'}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DisputeCard({ dispute, onVote, onStaffDecide, isStaff }) {
  const totalVotes = dispute.corrector_votes + dispute.corrected_votes;
  const isActive = dispute.status === 'active';
  const isStaffDecided = dispute.status === 'staff_decided';

  const urgencyColors = {
    low: 'bg-green-900 text-green-400',
    medium: 'bg-yellow-900 text-yellow-400',
    high: 'bg-red-900 text-red-400',
  };

  return (
    <div className="bg-42-dark rounded-xl p-6">
      {/* Staff Decided Banner */}
      {isStaffDecided && (
        <div className="mb-4 p-3 bg-purple-900/50 border border-purple-500 rounded-lg text-center">
          <span className="text-purple-400 font-bold">
            👑 STAFF DECIDED: {dispute.winner?.toUpperCase()} WINS
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`px-2 py-1 rounded text-xs ${urgencyColors[dispute.urgency]}`}>
          {dispute.urgency.toUpperCase()} URGENCY
        </span>
        <span className={`px-2 py-1 rounded text-xs ${
          isActive ? 'bg-green-900 text-green-400' :
          isStaffDecided ? 'bg-purple-900 text-purple-400' :
          'bg-gray-700 text-gray-400'
        }`}>
          {dispute.status.replace('_', ' ').toUpperCase()}
        </span>
        <span className="text-gray-400 text-sm">{dispute.project_name}</span>
      </div>

      {/* Description */}
      <h3 className="text-xl font-semibold mb-4">{dispute.description}</h3>

      {/* Corrector vs Corrected */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Corrector Side */}
        <div className={`p-4 rounded-lg border-2 ${
          dispute.winner === 'corrector' ? 'border-green-500 bg-green-900/20' : 'border-gray-700'
        }`}>
          <h4 className="font-semibold text-blue-400 mb-2">👨‍💻 Corrector Says:</h4>
          <p className="text-gray-300 mb-4">{dispute.corrector_opinion}</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">{dispute.corrector_votes} votes</span>
            {isActive && (
              <button
                onClick={() => onVote(dispute.id, 'corrector')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Vote Corrector
              </button>
            )}
          </div>
        </div>

        {/* Corrected Side */}
        <div className={`p-4 rounded-lg border-2 ${
          dispute.winner === 'corrected' ? 'border-green-500 bg-green-900/20' : 'border-gray-700'
        }`}>
          <h4 className="font-semibold text-orange-400 mb-2">🎓 Corrected Says:</h4>
          <p className="text-gray-300 mb-4">{dispute.corrected_opinion}</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">{dispute.corrected_votes} votes</span>
            {isActive && (
              <button
                onClick={() => onVote(dispute.id, 'corrected')}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg"
              >
                Vote Corrected
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Staff Override Buttons */}
      {isStaff && isActive && (
        <div className="flex gap-4 pt-4 border-t border-gray-700">
          <button
            onClick={() => onStaffDecide(dispute.id, 'corrector')}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
          >
            👑 CORRECTOR WINS
          </button>
          <button
            onClick={() => onStaffDecide(dispute.id, 'corrected')}
            className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg font-semibold"
          >
            👑 CORRECTED WINS
          </button>
        </div>
      )}

      {/* Meta */}
      <p className="text-sm text-gray-500 mt-4">
        Reported by {dispute.creator_login} • {totalVotes} total votes
      </p>
    </div>
  );
}

function DisputeForm({ projects, onClose, onSuccess }) {
  const [form, setForm] = useState({
    project_id: '',
    description: '',
    corrector_opinion: '',
    corrected_opinion: '',
    urgency: 'medium',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/disputes', null, { params: form });
      onSuccess();
    } catch (error) {
      console.error('Failed to create dispute:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-42-dark rounded-xl p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Report a Correction Dispute</h2>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <select
          required
          value={form.project_id}
          onChange={(e) => setForm({ ...form, project_id: e.target.value })}
          className="px-4 py-2 bg-gray-800 rounded-lg border border-gray-700"
        >
          <option value="">Select Project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={form.urgency}
          onChange={(e) => setForm({ ...form, urgency: e.target.value })}
          className="px-4 py-2 bg-gray-800 rounded-lg border border-gray-700"
        >
          <option value="low">Low Urgency</option>
          <option value="medium">Medium Urgency</option>
          <option value="high">High Urgency</option>
        </select>
      </div>
      <input
        required
        type="text"
        placeholder="What is the disagreement about?"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 mb-4"
      />
      <div className="grid grid-cols-2 gap-4 mb-4">
        <textarea
          required
          placeholder="Corrector's opinion..."
          value={form.corrector_opinion}
          onChange={(e) => setForm({ ...form, corrector_opinion: e.target.value })}
          className="px-4 py-2 bg-gray-800 rounded-lg border border-gray-700"
          rows="4"
        />
        <textarea
          required
          placeholder="Corrected's opinion..."
          value={form.corrected_opinion}
          onChange={(e) => setForm({ ...form, corrected_opinion: e.target.value })}
          className="px-4 py-2 bg-gray-800 rounded-lg border border-gray-700"
          rows="4"
        />
      </div>
      <div className="flex gap-4">
        <button type="submit" className="px-6 py-2 bg-42-teal hover:bg-teal-600 rounded-lg">
          Submit Dispute
        </button>
        <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default Disputes;
