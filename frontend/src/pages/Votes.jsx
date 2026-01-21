// 42Nexus - Subject Votes Page
// This file is for: FATYZA (Frontend Developer)
// Description: Subject clarification voting with STAFF OVERRIDE

import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useProjectsStore } from '../store/projectsStore';
import api from '../services/api';

function Votes() {
  const { user } = useAuthStore();
  const { projects, fetchProjects } = useProjectsStore();
  const [votes, setVotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState({ projectId: '', status: '' });

  useEffect(() => {
    fetchProjects();
    fetchVotes();
  }, []);

  const fetchVotes = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.projectId) params.append('project_id', filter.projectId);
      if (filter.status) params.append('status', filter.status);
      
      const { data } = await api.get(`/votes?${params}`);
      setVotes(data);
    } catch (error) {
      console.error('Failed to fetch votes:', error);
    }
    setIsLoading(false);
  };

  const handleVote = async (voteId, optionId) => {
    try {
      await api.post(`/votes/${voteId}/vote?option_id=${optionId}`);
      fetchVotes();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to vote');
    }
  };

  const handleStaffDecide = async (voteId, decision) => {
    if (!confirm(`Are you sure you want to decide "${decision}"? This is FINAL!`)) return;
    try {
      await api.post(`/votes/${voteId}/staff-decide?decision=${decision}`);
      fetchVotes();
    } catch (error) {
      console.error('Failed to decide:', error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">🗳️ Subject Votes</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-42-teal hover:bg-teal-600 rounded-lg"
        >
          + New Question
        </button>
      </div>

      {/* Staff Notice */}
      {user?.role === 'staff' && (
        <div className="mb-6 p-4 bg-purple-900/30 border border-purple-500 rounded-lg">
          <p className="text-purple-400 font-semibold">👑 Staff Override Available</p>
          <p className="text-sm text-gray-300">
            You can make FINAL decisions on any vote
          </p>
        </div>
      )}

      {/* Add Vote Form */}
      {showForm && (
        <VoteForm
          projects={projects}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            fetchVotes();
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
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
          <option value="staff_decided">Staff Decided</option>
        </select>
        <button
          onClick={fetchVotes}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
        >
          Apply Filter
        </button>
      </div>

      {/* Votes List */}
      {isLoading ? (
        <div className="text-center py-12">Loading...</div>
      ) : votes.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No votes found</div>
      ) : (
        <div className="space-y-6">
          {votes.map((vote) => (
            <VoteCard
              key={vote.id}
              vote={vote}
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

function VoteCard({ vote, onVote, onStaffDecide, isStaff }) {
  const totalVotes = vote.options.reduce((sum, o) => sum + o.vote_count, 0);
  const isOpen = vote.status === 'open';
  const isStaffDecided = vote.status === 'staff_decided';

  return (
    <div className="bg-42-dark rounded-xl p-6">
      {/* Staff Decided Banner */}
      {isStaffDecided && (
        <div className="mb-4 p-3 bg-purple-900/50 border border-purple-500 rounded-lg text-center">
          <span className="text-purple-400 font-bold">👑 STAFF DECIDED: {vote.staff_decision?.toUpperCase()}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`px-2 py-1 rounded text-xs ${
          isOpen ? 'bg-green-900 text-green-400' :
          isStaffDecided ? 'bg-purple-900 text-purple-400' :
          'bg-gray-700 text-gray-400'
        }`}>
          {vote.status.replace('_', ' ').toUpperCase()}
        </span>
        <span className="text-gray-400 text-sm">{vote.project_name}</span>
      </div>

      {/* Question */}
      <h3 className="text-xl font-semibold mb-2">{vote.question}</h3>
      {vote.context && (
        <p className="text-gray-400 mb-4">{vote.context}</p>
      )}

      {/* Options */}
      <div className="space-y-3 mb-4">
        {vote.options.map((option) => {
          const percentage = totalVotes > 0 ? (option.vote_count / totalVotes) * 100 : 0;
          return (
            <div key={option.id} className="relative">
              <button
                onClick={() => isOpen && onVote(vote.id, option.id)}
                disabled={!isOpen}
                className={`w-full p-3 rounded-lg text-left transition-colors ${
                  isOpen ? 'hover:bg-gray-700' : ''
                } bg-gray-800`}
              >
                <div
                  className="absolute inset-0 bg-42-teal/20 rounded-lg"
                  style={{ width: `${percentage}%` }}
                />
                <div className="relative flex justify-between">
                  <span>{option.text}</span>
                  <span className="text-gray-400">{option.vote_count} votes ({percentage.toFixed(0)}%)</span>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Staff Override Buttons */}
      {isStaff && isOpen && (
        <div className="flex gap-4 pt-4 border-t border-gray-700">
          <button
            onClick={() => onStaffDecide(vote.id, 'allowed')}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold"
          >
            ✓ ALLOWED
          </button>
          <button
            onClick={() => onStaffDecide(vote.id, 'not_allowed')}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold"
          >
            ✗ NOT ALLOWED
          </button>
        </div>
      )}

      {/* Meta */}
      <p className="text-sm text-gray-500 mt-4">
        Asked by {vote.user_login} • {totalVotes} total votes
      </p>
    </div>
  );
}

function VoteForm({ projects, onClose, onSuccess }) {
  const [form, setForm] = useState({
    project_id: '',
    question: '',
    context: '',
    options: ['', ''],
  });

  const addOption = () => {
    setForm({ ...form, options: [...form.options, ''] });
  };

  const updateOption = (index, value) => {
    const newOptions = [...form.options];
    newOptions[index] = value;
    setForm({ ...form, options: newOptions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validOptions = form.options.filter(o => o.trim());
    if (validOptions.length < 2) {
      alert('At least 2 options required');
      return;
    }
    try {
      await api.post('/votes', null, {
        params: {
          project_id: form.project_id,
          question: form.question,
          context: form.context || undefined,
          options: validOptions,
        },
        paramsSerializer: {
          indexes: null,
        },
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to create vote:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-42-dark rounded-xl p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Ask a Clarification Question</h2>
      <select
        required
        value={form.project_id}
        onChange={(e) => setForm({ ...form, project_id: e.target.value })}
        className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 mb-4"
      >
        <option value="">Select Project</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <input
        required
        type="text"
        placeholder="Your question about the subject..."
        value={form.question}
        onChange={(e) => setForm({ ...form, question: e.target.value })}
        className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 mb-4"
      />
      <textarea
        placeholder="Additional context (optional)"
        value={form.context}
        onChange={(e) => setForm({ ...form, context: e.target.value })}
        className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 mb-4"
        rows="2"
      />
      <p className="text-sm text-gray-400 mb-2">Answer Options:</p>
      {form.options.map((opt, i) => (
        <input
          key={i}
          type="text"
          placeholder={`Option ${i + 1}`}
          value={opt}
          onChange={(e) => updateOption(i, e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 mb-2"
        />
      ))}
      <button
        type="button"
        onClick={addOption}
        className="text-42-teal hover:underline mb-4"
      >
        + Add Option
      </button>
      <div className="flex gap-4">
        <button type="submit" className="px-6 py-2 bg-42-teal hover:bg-teal-600 rounded-lg">
          Submit
        </button>
        <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default Votes;
