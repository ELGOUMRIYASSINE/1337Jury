// 42Nexus - Tests Repository Page
// This file is for: FATYZA (Frontend Developer)
// Description: Test cases with staff approval

import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useProjectsStore } from '../store/projectsStore';
import api from '../services/api';

function Tests() {
  const { user } = useAuthStore();
  const { projects, fetchProjects } = useProjectsStore();
  const [tests, setTests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState({ projectId: '', approvedOnly: false });

  useEffect(() => {
    fetchProjects();
    fetchTests();
  }, []);

  const fetchTests = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.projectId) params.append('project_id', filter.projectId);
      if (filter.approvedOnly) params.append('approved_only', 'true');
      
      const { data } = await api.get(`/tests?${params}`);
      setTests(data);
    } catch (error) {
      console.error('Failed to fetch tests:', error);
    }
    setIsLoading(false);
  };

  const handleDownload = async (testId) => {
    try {
      window.open(`http://localhost:8000/api/tests/${testId}/download`, '_blank');
      fetchTests(); // Refresh to update download count
    } catch (error) {
      console.error('Failed to download:', error);
    }
  };

  const handleApprove = async (testId, approve = true) => {
    try {
      await api.post(`/tests/${testId}/${approve ? 'approve' : 'unapprove'}`);
      fetchTests();
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">🧪 Tests Repository</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-42-teal hover:bg-teal-600 rounded-lg"
        >
          + Share Test
        </button>
      </div>

      {/* Staff Notice */}
      {user?.role === 'staff' && (
        <div className="mb-6 p-4 bg-purple-900/30 border border-purple-500 rounded-lg">
          <p className="text-purple-400 font-semibold">👑 Staff Controls Available</p>
          <p className="text-sm text-gray-300">
            You can approve or reject test submissions
          </p>
        </div>
      )}

      {/* Add Test Form */}
      {showForm && (
        <TestForm
          projects={projects}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            fetchTests();
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
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={filter.approvedOnly}
            onChange={(e) => setFilter({ ...filter, approvedOnly: e.target.checked })}
            className="w-4 h-4"
          />
          <span>Approved Only</span>
        </label>
        <button
          onClick={fetchTests}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
        >
          Apply Filter
        </button>
      </div>

      {/* Tests Grid */}
      {isLoading ? (
        <div className="text-center py-12">Loading...</div>
      ) : tests.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No tests found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => (
            <TestCard
              key={test.id}
              test={test}
              onDownload={handleDownload}
              onApprove={handleApprove}
              isStaff={user?.role === 'staff'}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TestCard({ test, onDownload, onApprove, isStaff }) {
  return (
    <div className="bg-42-dark rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-400">{test.project_name}</span>
        {test.is_approved ? (
          <span className="px-2 py-1 bg-green-900 text-green-400 rounded text-xs">✓ Approved</span>
        ) : (
          <span className="px-2 py-1 bg-yellow-900 text-yellow-400 rounded text-xs">Pending</span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold mb-2">{test.title}</h3>
      
      {/* Description */}
      {test.description && (
        <p className="text-gray-400 text-sm mb-4">{test.description}</p>
      )}

      {/* Code Preview */}
      <div className="bg-gray-900 rounded-lg p-3 mb-4 overflow-x-auto">
        <pre className="text-xs text-gray-300">
          <code>{test.code_preview}</code>
        </pre>
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <span>by {test.user_login}</span>
        <span>{test.language}</span>
        <span>📥 {test.downloads}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onDownload(test.id)}
          className="flex-1 px-4 py-2 bg-42-teal hover:bg-teal-600 rounded-lg"
        >
          Download
        </button>
        {isStaff && (
          <button
            onClick={() => onApprove(test.id, !test.is_approved)}
            className={`px-4 py-2 rounded-lg ${
              test.is_approved
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {test.is_approved ? 'Reject' : 'Approve'}
          </button>
        )}
      </div>
    </div>
  );
}

function TestForm({ projects, onClose, onSuccess }) {
  const [form, setForm] = useState({
    project_id: '',
    title: '',
    description: '',
    code: '',
    language: 'python',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tests', null, { params: form });
      onSuccess();
    } catch (error) {
      console.error('Failed to create test:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-42-dark rounded-xl p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Share a Test Case</h2>
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
          value={form.language}
          onChange={(e) => setForm({ ...form, language: e.target.value })}
          className="px-4 py-2 bg-gray-800 rounded-lg border border-gray-700"
        >
          <option value="python">Python</option>
          <option value="bash">Bash</option>
          <option value="javascript">JavaScript</option>
          <option value="other">Other</option>
        </select>
      </div>
      <input
        required
        type="text"
        placeholder="Test Title"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 mb-4"
      />
      <textarea
        placeholder="Description (optional)"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 mb-4"
        rows="2"
      />
      <textarea
        required
        placeholder="Paste your test code here..."
        value={form.code}
        onChange={(e) => setForm({ ...form, code: e.target.value })}
        className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 mb-4 font-mono text-sm"
        rows="10"
      />
      <div className="flex gap-4">
        <button type="submit" className="px-6 py-2 bg-42-teal hover:bg-teal-600 rounded-lg">
          Submit Test
        </button>
        <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default Tests;
