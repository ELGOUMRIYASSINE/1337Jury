
import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { testsApi, projectsApi } from '../services/api'

export default function Tests() {
  const { user } = useAuthStore()
  const [tests, setTests] = useState([])
  const [pendingTests, setPendingTests] = useState([])
  const [projects, setProjects] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', github_url: '', project_id: '' })
  const [filter, setFilter] = useState('all')
  const [showPending, setShowPending] = useState(false)

  useEffect(() => {
    loadTests()
    loadProjects()
    if (user?.is_staff) {
      loadPendingTests()
    }
  }, [user])

  const loadProjects = async () => {
    try {
      const { data } = await projectsApi.list()
      setProjects(data || [])
    } catch (e) { console.error(e) }
  }

  const loadTests = async () => {
    try {
      const { data } = await testsApi.list()
      setTests(data || [])
    } catch (e) { console.error(e) }
  }

  const loadPendingTests = async () => {
    try {
      const { data } = await testsApi.pending()
      setPendingTests(data || [])
    } catch (e) { console.error(e) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.project_id) return alert('Select a project')
    try {
      await testsApi.create({ ...form, project_id: parseInt(form.project_id) })
      setForm({ title: '', description: '', github_url: '', project_id: '' })
      setShowForm(false)
      loadTests()
      if (user?.is_staff) loadPendingTests()
      alert(user?.is_staff ? 'Test added and approved!' : 'Test submitted for staff approval!')
    } catch (e) { 
      console.error(e)
      alert('Failed to submit test')
    }
  }

  const handleApprove = async (id) => {
    try {
      await testsApi.approve(id)
      loadTests()
      loadPendingTests()
    } catch (e) { console.error(e) }
  }

  const handleReject = async (id) => {
    if (!confirm('Reject and delete this test?')) return
    try {
      await testsApi.reject(id)
      loadPendingTests()
    } catch (e) { console.error(e) }
  }

  const handleDownload = async (test) => {
    try {
      await testsApi.download(test.id)
      window.open(test.github_url, '_blank')
      loadTests()
    } catch (e) { console.error(e) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this test?')) return
    try {
      await testsApi.delete(id)
      loadTests()
    } catch (e) { console.error(e) }
  }

  const filteredTests = filter === 'all' 
    ? tests 
    : tests.filter(t => t.project_id === parseInt(filter))

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono flex items-center gap-2">🧪 Community Tests</h1>
          <p className="text-gray-500 text-sm">Share and discover testers for 42 projects</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {user?.is_staff && pendingTests.length > 0 && (
            <button 
              onClick={() => setShowPending(!showPending)} 
              className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-500/30 transition-colors flex-1 sm:flex-none"
            >
              🛡️ Pending ({pendingTests.length})
            </button>
          )}
          <button 
            onClick={() => setShowForm(!showForm)} 
            className="bg-[#00d4aa] text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#00b894] transition-colors flex-1 sm:flex-none"
          >
            + Submit Test
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
            filter === 'all' ? 'bg-[#00d4aa] text-black' : 'bg-[#161b22] text-gray-400 hover:text-white border border-gray-700'
          }`}
        >
          All Projects
        </button>
        {projects.map(p => (
          <button
            key={p.id}
            onClick={() => setFilter(p.id.toString())}
            className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
              filter === p.id.toString() ? 'bg-[#00d4aa] text-black' : 'bg-[#161b22] text-gray-400 hover:text-white border border-gray-700'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>
      {showPending && user?.is_staff && pendingTests.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-yellow-400 mb-4 flex items-center gap-2">
            🛡️ Pending Approval ({pendingTests.length})
          </h3>
          <div className="space-y-3">
            {pendingTests.map(t => (
              <div key={t.id} className="bg-[#0d1117] rounded-lg p-4 border border-gray-700 flex justify-between items-center">
                <div>
                  <h4 className="font-medium">{t.title}</h4>
                  {t.description && <p className="text-gray-500 text-sm">{t.description}</p>}
                  <a href={t.github_url} target="_blank" className="text-[#00d4aa] text-xs hover:underline">{t.github_url}</a>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(t.id)}
                    className="bg-green-500/20 border border-green-500/50 text-green-400 px-3 py-1.5 rounded text-xs hover:bg-green-500/30"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => handleReject(t.id)}
                    className="bg-red-500/20 border border-red-500/50 text-red-400 px-3 py-1.5 rounded text-xs hover:bg-red-500/30"
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#161b22] rounded-lg p-4 mb-6 border border-gray-800">
          <h3 className="font-semibold mb-4">Submit a Test</h3>
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
              placeholder="Test name (e.g., ft_printf tester)"
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              className="bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#00d4aa]"
              required
            />
            <input
              placeholder="GitHub URL"
              type="url"
              value={form.github_url}
              onChange={e => setForm({...form, github_url: e.target.value})}
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
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>ℹ️</span>
              {user?.is_staff 
                ? 'As staff, your test will be auto-approved.'
                : 'Your test will need staff approval before appearing publicly.'}
            </div>
            <button type="submit" className="bg-[#00d4aa] text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#00b894]">
              Submit Test
            </button>
          </div>
        </form>
      )}
      <div className="space-y-3">
        {filteredTests.map(t => (
          <div key={t.id} className="bg-[#161b22] rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-colors">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-[#0d1117] text-[#00d4aa] px-2 py-0.5 rounded border border-gray-700">
                    #{t.project_name || 'general'}
                  </span>
                  <span className="text-xs text-gray-500">🧪 Tester</span>
                </div>
                <h4 className="font-semibold text-white">{t.title}</h4>
                {t.description && <p className="text-gray-500 text-sm mt-1">{t.description}</p>}
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <span>📥 {t.downloads || 0} downloads</span>
                  <a href={t.github_url} target="_blank" className="text-[#00d4aa] hover:underline truncate max-w-xs">
                    {t.github_url}
                  </a>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleDownload(t)}
                  className="bg-[#00d4aa]/20 border border-[#00d4aa]/50 text-[#00d4aa] px-4 py-2 rounded text-sm hover:bg-[#00d4aa]/30 transition-colors"
                >
                  📥 Get Test
                </button>
                {(t.user_id === user?.id || user?.is_staff) && (
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="text-gray-500 hover:text-red-400 px-2"
                    title="Delete"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredTests.length === 0 && (
          <p className="text-gray-500 text-center py-10">No tests yet for this project. Be the first to share!</p>
        )}
      </div>
    </div>
  )
}