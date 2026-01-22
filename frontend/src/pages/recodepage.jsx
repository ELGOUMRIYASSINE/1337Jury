
import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { recodesApi, projectsApi } from '../services/api'

export default function RecodePage() {
  const { user } = useAuthStore()
  const [recodes, setRecodes] = useState([])
  const [myRecodes, setMyRecodes] = useState([])
  const [projects, setProjects] = useState([])
  const [campuses, setCampuses] = useState([])
  const [platforms, setPlatforms] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [showMyRequests, setShowMyRequests] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ project: 'all', campus: 'all' })
  const [form, setForm] = useState({
    project_id: '',
    campus: '',
    meeting_platform: '',
    meeting_link: '',
    description: ''
  })

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 15000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {

      const [recodesRes, projectsRes, campusesRes, platformsRes] = await Promise.all([
        recodesApi.list().catch((e) => { console.error('Error loading recodes:', e); return { data: [] } }),
        projectsApi.list().catch((e) => { console.error('Error loading projects:', e); return { data: [] } }),
        recodesApi.getCampuses().catch((e) => { console.error('Error loading campuses:', e); return { data: [] } }),
        recodesApi.getPlatforms().catch((e) => { console.error('Error loading platforms:', e); return { data: [] } })
      ])
      
      const recodesData = recodesRes?.data || []
      const projectsData = projectsRes?.data || []
      const campusesData = campusesRes?.data || []
      const platformsData = platformsRes?.data || []
      
      console.log('Loaded recodes:', recodesData.length, recodesData)
      console.log('Loaded projects:', projectsData.length)
      console.log('Loaded campuses:', campusesData.length)
      console.log('Loaded platforms:', platformsData.length)
      
      setRecodes(recodesData)
      setProjects(projectsData)
      setCampuses(campusesData)
      setPlatforms(platformsData)
      
      try {
        const myRes = await recodesApi.myRequests()
        setMyRecodes(myRes?.data || [])
      } catch (e) { 
        console.error('Error loading my requests:', e)
        setMyRecodes([])
      }
    } catch (e) { 
      console.error('Error loading recode data:', e) 
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.project_id || !form.campus || !form.meeting_platform) {
      return alert('Please fill in all required fields')
    }
    try {
      await recodesApi.create({
        ...form,
        project_id: parseInt(form.project_id)
      })
      setForm({ project_id: '', campus: '', meeting_platform: '', meeting_link: '', description: '' })
      setShowForm(false)
      loadData()
      alert('Recode request posted! 🎉')
    } catch (e) {
      console.error(e)
      alert('Failed to post request')
    }
  }

  const handleAccept = async (id) => {
    if (!confirm('Accept this recode request? You will help evaluate this person!')) return
    try {
      await recodesApi.accept(id)
      loadData()
      alert('You accepted the request! Connect with them via the meeting platform.')
    } catch (e) {
      console.error(e)
      alert(e.response?.data?.detail || 'Failed to accept')
    }
  }

  const handleComplete = async (id) => {
    try {
      await recodesApi.complete(id)
      loadData()
    } catch (e) { console.error(e) }
  }

  const handleCancel = async (id) => {
    if (!confirm('Cancel this request?')) return
    try {
      await recodesApi.cancel(id)
      loadData()
    } catch (e) { console.error(e) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this request?')) return
    try {
      await recodesApi.delete(id)
      loadData()
    } catch (e) { console.error(e) }
  }

  const getPlatformInfo = (platformId) => {
    return platforms.find(p => p.id === platformId) || { name: platformId, icon: '🔗' }
  }

  const filteredRecodes = recodes.filter(r => {
    if (filter.project !== 'all' && r.project_id !== parseInt(filter.project)) return false
    if (filter.campus !== 'all' && r.campus !== filter.campus) return false
    return true
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-green-500/20 text-green-400 border-green-500/50'
      case 'matched': return 'bg-blue-500/20 text-blue-400 border-blue-500/50'
      case 'completed': return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/50'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  return (
    <div className="p-4 sm:p-6">
     
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono flex items-center gap-2">
            🔄 Recode Me
          </h1>
          <p className="text-gray-500 text-sm">Find a peer for mock evaluations & recoding sessions</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={loadData}
            disabled={loading}
            className="bg-gray-700 text-gray-300 px-3 py-2 rounded-lg text-sm hover:bg-gray-600 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            🔄
          </button>
          {myRecodes.length > 0 && (
            <button
              onClick={() => setShowMyRequests(!showMyRequests)}
              className="bg-purple-500/20 border border-purple-500/50 text-purple-400 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-500/30 transition-colors flex-1 sm:flex-none"
            >
              📋 My Requests ({myRecodes.length})
            </button>
          )}
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-[#00d4aa] text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#00b894] transition-colors flex-1 sm:flex-none"
          >
            + Post Recode Request
          </button>
        </div>
      </div>

      {showMyRequests && myRecodes.length > 0 && (
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-purple-400 mb-4 flex items-center gap-2">
            📋 My Recode Requests
          </h3>
          <div className="space-y-3">
            {myRecodes.map(r => (
              <div key={r.id} className="bg-[#0d1117] rounded-lg p-4 border border-gray-700">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{r.project_name}</span>
                      <span className={`px-2 py-0.5 rounded text-xs border ${getStatusColor(r.status)}`}>
                        {r.status}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm">
                      {getPlatformInfo(r.meeting_platform).icon} {getPlatformInfo(r.meeting_platform).name} • 📍 {campuses.find(c => c.id === r.campus)?.name || r.campus}
                    </p>
                    {r.matched_user_login && (
                      <p className="text-[#00d4aa] text-sm mt-1">
                        🤝 Matched with: @{r.matched_user_login}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {r.status === 'matched' && (
                      <button
                        onClick={() => handleComplete(r.id)}
                        className="bg-green-500/20 border border-green-500/50 text-green-400 px-3 py-1 rounded text-xs hover:bg-green-500/30"
                      >
                        ✓ Complete
                      </button>
                    )}
                    {r.status === 'open' && (
                      <button
                        onClick={() => handleCancel(r.id)}
                        className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 px-3 py-1 rounded text-xs hover:bg-yellow-500/30"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="bg-red-500/20 border border-red-500/50 text-red-400 px-3 py-1 rounded text-xs hover:bg-red-500/30"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#161b22] rounded-lg p-6 mb-6 border border-gray-800">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            🔄 Post a Recode Request
          </h3>
          <p className="text-gray-500 text-sm mb-4">
            Looking for someone to do a mock evaluation or help you practice? Post your request here!
          </p>
          <div className="grid gap-4 md:grid-cols-2">
          
            <div>
              <label className="block text-sm text-gray-400 mb-1">Project *</label>
              <select
                value={form.project_id}
                onChange={e => setForm({ ...form, project_id: e.target.value })}
                className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#00d4aa]"
                required
              >
                <option value="">Select project...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Preferred Campus *</label>
              <select
                value={form.campus}
                onChange={e => setForm({ ...form, campus: e.target.value })}
                className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#00d4aa]"
                required
              >
                <option value="">Select campus...</option>
                {campuses.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Meeting Platform *</label>
              <select
                value={form.meeting_platform}
                onChange={e => setForm({ ...form, meeting_platform: e.target.value })}
                className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#00d4aa]"
                required
              >
                <option value="">Select platform...</option>
                {platforms.map(p => (
                  <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Meeting Link (optional)</label>
              <input
                type="url"
                placeholder="https://discord.gg/... or meet.google.com/..."
                value={form.meeting_link}
                onChange={e => setForm({ ...form, meeting_link: e.target.value })}
                className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#00d4aa]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Additional Notes</label>
              <textarea
                placeholder="Any specific areas you want to focus on? Time preferences?"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#00d4aa] min-h-[80px]"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="bg-[#00d4aa] text-black px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#00b894] transition-colors"
            >
              Post Request
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm">Project:</span>
          <select
            value={filter.project}
            onChange={e => setFilter({ ...filter, project: e.target.value })}
            className="bg-[#161b22] border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#00d4aa]"
          >
            <option value="all">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm">Campus:</span>
          <select
            value={filter.campus}
            onChange={e => setFilter({ ...filter, campus: e.target.value })}
            className="bg-[#161b22] border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#00d4aa]"
          >
            <option value="all">All Campuses</option>
            {campuses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-2 animate-spin">⏳</div>
            <p>Loading recode requests...</p>
          </div>
        ) : filteredRecodes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-2">🔍</div>
            <p>No open recode requests found</p>
            <p className="text-sm">Be the first to post one!</p>
          </div>
        ) : (
          filteredRecodes.map(recode => (
            <div
              key={recode.id}
              className="bg-[#161b22] border border-gray-800 rounded-lg p-5 hover:border-gray-700 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                
                  <div className="flex items-center gap-3 mb-2">
                    {recode.user_image ? (
                      <img src={recode.user_image} alt="" className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#00d4aa]/20 flex items-center justify-center text-[#00d4aa]">
                        {recode.user_login?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-[#00d4aa]">@{recode.user_login}</span>
                      <span className="text-gray-500 text-sm ml-2">wants a mock eval</span>
                    </div>
                  </div>

                  <div className="ml-13 pl-0.5">
                    <h3 className="font-semibold text-lg mb-2">{recode.project_name}</h3>
                    
                    <div className="flex flex-wrap gap-3 text-sm text-gray-400 mb-2">
                      <span className="flex items-center gap-1">
                        {getPlatformInfo(recode.meeting_platform).icon} {getPlatformInfo(recode.meeting_platform).name}
                      </span>
                      <span className="flex items-center gap-1">
                        📍 {campuses.find(c => c.id === recode.campus)?.name || recode.campus}
                      </span>
                      <span className="flex items-center gap-1">
                        🕐 {new Date(recode.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {recode.description && (
                      <p className="text-gray-400 text-sm mt-2 bg-[#0d1117] p-3 rounded-lg border border-gray-800">
                        {recode.description}
                      </p>
                    )}

                    {recode.meeting_link && (
                      <a
                        href={recode.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#00d4aa] text-sm hover:underline mt-2 inline-block"
                      >
                        🔗 {recode.meeting_link}
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  {recode.user_id !== user?.id && recode.status === 'open' && (
                    <button
                      onClick={() => handleAccept(recode.id)}
                      className="bg-[#00d4aa] text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#00b894] transition-colors"
                    >
                      🤝 Accept
                    </button>
                  )}
                  {(recode.user_id === user?.id || user?.is_staff) && (
                    <button
                      onClick={() => handleDelete(recode.id)}
                      className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                    >
                      🗑️ Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}