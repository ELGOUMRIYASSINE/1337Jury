// 42Nexus - Resources Page
// This file is for: FATYZA (Frontend Developer)
// Description: Learning resources hub with upvote/downvote

import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useProjectsStore } from '../store/projectsStore';
import api from '../services/api';

function Resources() {
  const { user } = useAuthStore();
  const { projects, fetchProjects } = useProjectsStore();
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState({ projectId: '', type: '' });

  useEffect(() => {
    fetchProjects();
    fetchResources();
  }, []);

  const fetchResources = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.projectId) params.append('project_id', filter.projectId);
      if (filter.type) params.append('resource_type', filter.type);
      
      const { data } = await api.get(`/resources?${params}`);
      setResources(data);
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    }
    setIsLoading(false);
  };

  const handleVote = async (resourceId, isUpvote) => {
    try {
      await api.post(`/resources/${resourceId}/vote?is_upvote=${isUpvote}`);
      fetchResources();
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">📚 Resources Hub</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-42-teal hover:bg-teal-600 rounded-lg"
        >
          + Add Resource
        </button>
      </div>

      {/* Add Resource Form */}
      {showForm && (
        <ResourceForm
          projects={projects}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            fetchResources();
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
          value={filter.type}
          onChange={(e) => setFilter({ ...filter, type: e.target.value })}
          className="px-4 py-2 bg-42-dark rounded-lg border border-gray-700"
        >
          <option value="">All Types</option>
          <option value="documentation">Documentation</option>
          <option value="tutorial">Tutorial</option>
          <option value="video">Video</option>
          <option value="article">Article</option>
          <option value="other">Other</option>
        </select>
        <button
          onClick={fetchResources}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
        >
          Apply Filter
        </button>
      </div>

      {/* Resources List */}
      {isLoading ? (
        <div className="text-center py-12">Loading...</div>
      ) : resources.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No resources found</div>
      ) : (
        <div className="space-y-4">
          {resources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onVote={handleVote}
              currentUser={user}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ResourceCard({ resource, onVote, currentUser }) {
  const score = resource.upvotes - resource.downvotes;
  
  return (
    <div className="bg-42-dark rounded-xl p-6">
      <div className="flex gap-4">
        {/* Vote Buttons */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => onVote(resource.id, true)}
            className="p-2 hover:bg-green-900/30 rounded"
          >
            ▲
          </button>
          <span className={`font-bold ${score > 0 ? 'text-green-400' : score < 0 ? 'text-red-400' : ''}`}>
            {score}
          </span>
          <button
            onClick={() => onVote(resource.id, false)}
            className="p-2 hover:bg-red-900/30 rounded"
          >
            ▼
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 bg-gray-700 rounded text-xs capitalize">
              {resource.resource_type}
            </span>
            <span className="text-gray-400 text-sm">{resource.project_name}</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">
            <a href={resource.url} target="_blank" rel="noopener noreferrer" className="hover:text-42-teal">
              {resource.title} ↗
            </a>
          </h3>
          {resource.description && (
            <p className="text-gray-400 mb-2">{resource.description}</p>
          )}
          <p className="text-sm text-gray-500">
            Shared by {resource.user_login}
          </p>
        </div>
      </div>
    </div>
  );
}

function ResourceForm({ projects, onClose, onSuccess }) {
  const [form, setForm] = useState({
    project_id: '',
    title: '',
    url: '',
    description: '',
    resource_type: 'other',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/resources', null, { params: form });
      onSuccess();
    } catch (error) {
      console.error('Failed to create resource:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-42-dark rounded-xl p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Add New Resource</h2>
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
          value={form.resource_type}
          onChange={(e) => setForm({ ...form, resource_type: e.target.value })}
          className="px-4 py-2 bg-gray-800 rounded-lg border border-gray-700"
        >
          <option value="documentation">Documentation</option>
          <option value="tutorial">Tutorial</option>
          <option value="video">Video</option>
          <option value="article">Article</option>
          <option value="other">Other</option>
        </select>
      </div>
      <input
        required
        type="text"
        placeholder="Title"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 mb-4"
      />
      <input
        required
        type="url"
        placeholder="URL"
        value={form.url}
        onChange={(e) => setForm({ ...form, url: e.target.value })}
        className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 mb-4"
      />
      <textarea
        placeholder="Description (optional)"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 mb-4"
        rows="3"
      />
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

export default Resources;
