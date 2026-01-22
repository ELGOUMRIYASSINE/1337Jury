
import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { resourcesApi, projectsApi } from '../services/api'

export default function Resources() {
  const { user } = useAuthStore()
  const [resources, setResources] = useState([])
  const [projects, setProjects] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', url: '', description: '', resource_type: 'article', project_id: '' })
  const [filter, setFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    loadResources()
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const { data } = await projectsApi.list()
      setProjects(data || [])
    } catch (e) { console.error(e) }
  }

  const loadResources = async () => {
    try {
      const { data } = await resourcesApi.list()
      setResources(data || [])
    } catch (e) { console.error(e) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.project_id) return alert('Select a project')
    try {
      await resourcesApi.create({ ...form, project_id: parseInt(form.project_id) })
      setForm({ title: '', url: '', description: '', resource_type: 'article', project_id: '' })
      setShowForm(false)
      loadResources()
    } catch (e) { console.error(e) }
  }

  const handleVote = async (id, isUpvote) => {
    try {
      await resourcesApi.vote(id, isUpvote)
      loadResources()
    } catch (e) { console.error(e) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this resource?')) return
    try {
      await resourcesApi.delete(id)
      loadResources()
    } catch (e) { console.error(e) }
  }

  const filteredResources = resources.filter(r => {
    if (typeFilter !== 'all' && r.resource_type !== typeFilter) return false
    return true
  }).sort((a, b) => b.score - a.score)

  const typeIcon = (type) => {
    switch (type) {
      case 'video': return '🎬'
      case 'documentation': return '📄'
      case 'tutorial': return '📚'
      case 'tool': return '🔧'
      default: return '🔗'
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono flex items-center gap-2">📁 Resource Vault</h1>
          <p className="text-gray-500 text-sm">Share and discover learning materials</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-[#00d4aa] text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#00b894] transition-colors w-full sm:w-auto">
          + Add Resource
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'article', 'video', 'documentation', 'tutorial', 'tool'].map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
              typeFilter === t ? 'bg-[#00d4aa] text-black' : 'bg-[#161b22] text-gray-400 hover:text-white border border-gray-700'
            }`}
          >
            {t === 'all' ? 'All' : `${typeIcon(t)} ${t.charAt(0).toUpperCase() + t.slice(1)}`}
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#161b22] rounded-lg p-4 mb-6 border border-gray-800">
          <h3 className="font-semibold mb-4">Add New Resource</h3>
          <div className="grid gap-4">
            <select
              value={form.project_id}
              onChange={e => setForm({...form, project_id: e.target.value})}
              className="bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#00d4aa]"
              required
            >
              <option value="">Select project...</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <input
              placeholder="Title"
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              className="bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#00d4aa]"
              required
            />
            <input
              placeholder="URL"
              type="url"
              value={form.url}
              onChange={e => setForm({...form, url: e.target.value})}
              className="bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#00d4aa]"
              required
            />
            <textarea
              placeholder="Description (optional)"
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              className="bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#00d4aa]"
              rows={2}
            />
            <select
              value={form.resource_type}
              onChange={e => setForm({...form, resource_type: e.target.value})}
              className="bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#00d4aa]"
            >
              <option value="article">📝 Article</option>
              <option value="video">🎬 Video</option>
              <option value="documentation">📄 Documentation</option>
              <option value="tutorial">📚 Tutorial</option>
              <option value="tool">🔧 Tool/Tester</option>
            </select>
            <button type="submit" className="bg-[#00d4aa] text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#00b894]">Submit</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {filteredResources.map(r => (
          <div key={r.id} className="bg-[#161b22] rounded-lg p-4 border border-gray-800 flex gap-4 hover:border-gray-700 transition-colors">
            <div className="flex flex-col items-center gap-1 min-w-[60px]">
              <button 
                onClick={() => handleVote(r.id, true)} 
                className="text-gray-400 hover:text-[#00d4aa] transition-colors p-1 hover:bg-[#00d4aa]/10 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <span className={`font-bold text-lg ${r.score > 0 ? 'text-[#00d4aa]' : r.score < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                {r.score}
              </span>
              <button 
                onClick={() => handleVote(r.id, false)} 
                className="text-gray-400 hover:text-red-400 transition-colors p-1 hover:bg-red-400/10 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs bg-[#0d1117] text-gray-400 px-2 py-0.5 rounded border border-gray-700">
                  {typeIcon(r.resource_type)} {r.resource_type}
                </span>
                <span className="text-xs text-[#00d4aa]">#{r.project_name || 'general'}</span>
              </div>
              <a 
                href={r.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-semibold text-white hover:text-[#00d4aa] transition-colors"
              >
                {r.title}
              </a>
              {r.description && <p className="text-gray-500 text-sm mt-1 line-clamp-2">{r.description}</p>}
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                <span>{new Date(r.created_at).toLocaleDateString()}</span>
                <a href={r.url} target="_blank" className="text-gray-500 hover:text-[#00d4aa] truncate max-w-xs">
                  {r.url}
                </a>
              </div>
            </div>

            {(r.user_id === user?.id || user?.is_staff) && (
              <button 
                onClick={() => handleDelete(r.id)} 
                className="text-gray-600 hover:text-red-400 transition-colors p-2"
                title="Delete"
              >
                🗑️
              </button>
            )}
          </div>
        ))}

        {filteredResources.length === 0 && (
          <p className="text-gray-500 text-center py-10">No resources yet. Be the first to share!</p>
        )}
      </div>
    </div>
  )
}