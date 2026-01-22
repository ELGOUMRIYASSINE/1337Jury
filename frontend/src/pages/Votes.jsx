
import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { votesApi, projectsApi } from '../services/api'

export default function Votes() {
  const { user } = useAuthStore()
  const [votes, setVotes] = useState([])
  const [projects, setProjects] = useState([])
  const [selectedVote, setSelectedVote] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', project_id: '', options: ['', ''] })
  const [filter, setFilter] = useState('all')
  const [editingVote, setEditingVote] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', description: '' })

  useEffect(() => {
    loadVotes()
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const { data } = await projectsApi.list()
      setProjects(data || [])
    } catch (e) { console.error(e) }
  }

  const loadVotes = async () => {
    try {
      const { data } = await votesApi.list()
      const votesWithDetails = await Promise.all(
        (data || []).map(async v => {
          try {
            const { data: detail } = await votesApi.get(v.id)
            return { ...v, options: detail.options || [], total_votes: detail.options?.reduce((sum, o) => sum + (o.vote_count || 0), 0) || 0 }
          } catch {
            return { ...v, options: [], total_votes: 0 }
          }
        })
      )
      setVotes(votesWithDetails)
    } catch (e) { console.error(e) }
  }

  const loadVoteDetail = async (id) => {
    try {
      const { data } = await votesApi.get(id)
      setSelectedVote(data)
    } catch (e) { console.error(e) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.project_id) return alert('Select a project')
    const validOptions = form.options.filter(o => o.trim())
    if (validOptions.length < 2) return alert('At least 2 options required')
    try {
      await votesApi.create({
        title: form.title,
        description: form.description,
        project_id: parseInt(form.project_id),
        options: validOptions
      })
      setForm({ title: '', description: '', project_id: '', options: ['', ''] })
      setShowForm(false)
      loadVotes()
    } catch (e) { console.error(e) }
  }

  const handleCastVote = async (optionId) => {
    try {
      await votesApi.cast(selectedVote.id, optionId)
      loadVoteDetail(selectedVote.id)
    } catch (e) { console.error(e) }
  }

  const handleStaffDecision = async (optionId) => {
    const reason = prompt('Reason for decision (optional):')
    try {
      await votesApi.staffDecision(selectedVote.id, optionId, reason)
      loadVoteDetail(selectedVote.id)
      loadVotes()
    } catch (e) { console.error(e) }
  }

  const handleEditVote = (vote) => {
    setEditingVote(vote.id)
    setEditForm({ title: vote.title, description: vote.description })
  }

  const handleSaveEdit = async (voteId) => {
    try {
      await votesApi.update(voteId, editForm)
      setEditingVote(null)
      setEditForm({ title: '', description: '' })
      loadVotes()
      if (selectedVote?.id === voteId) {
        loadVoteDetail(voteId)
      }
    } catch (e) {
      console.error(e)
      alert(e.response?.data?.detail || 'Failed to update')
    }
  }

  const handleDeleteVote = async (voteId) => {
    if (!confirm('Are you sure you want to delete this vote?')) return
    try {
      await votesApi.delete(voteId)
      if (selectedVote?.id === voteId) {
        setSelectedVote(null)
      }
      loadVotes()
    } catch (e) {
      console.error(e)
      alert(e.response?.data?.detail || 'Failed to delete')
    }
  }

  const filteredVotes = votes.filter(v => {
    if (filter === 'all') return true
    if (filter === 'open') return v.status === 'open'
    if (filter === 'decided') return v.status === 'staff_decided'
    return true
  })

  const statusBadge = (status) => {
    if (status === 'open') return <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">OPEN</span>
    if (status === 'staff_decided') return <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded flex items-center gap-1">🛡️ STAFF FINAL</span>
    return <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-0.5 rounded">CLOSED</span>
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono flex items-center gap-2">⚖️ Consensus Court</h1>
          <p className="text-gray-500 text-sm">Vote on subject ambiguities. Staff decisions are FINAL.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-[#00d4aa] text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#00b894] transition-colors w-full sm:w-auto">
          + New Proposal
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'open', 'decided'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
              filter === f ? 'bg-[#00d4aa] text-black' : 'bg-[#161b22] text-gray-400 hover:text-white border border-gray-700'
            }`}
          >
            {f === 'all' ? 'All' : f === 'open' ? '🟢 Open' : '🛡️ Staff Decided'}
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#161b22] rounded-lg p-4 mb-6 border border-gray-800">
          <h3 className="font-semibold mb-4">Create New Proposal</h3>
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
              placeholder="Question title"
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              className="bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#00d4aa]"
              required
            />
            <textarea
              placeholder="Describe the ambiguity..."
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              className="bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#00d4aa]"
              rows={3}
              required
            />
            <div>
              <label className="block text-sm mb-2 text-gray-400">Options</label>
              {form.options.map((opt, i) => (
                <input
                  key={i}
                  placeholder={`Option ${i + 1}`}
                  value={opt}
                  onChange={e => {
                    const newOpts = [...form.options]
                    newOpts[i] = e.target.value
                    setForm({...form, options: newOpts})
                  }}
                  className="bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#00d4aa] w-full mb-2"
                />
              ))}
              <button type="button" onClick={() => setForm({...form, options: [...form.options, '']})} className="text-[#00d4aa] text-sm hover:underline">
                + Add option
              </button>
            </div>
            <button type="submit" className="bg-[#00d4aa] text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#00b894]">Create Proposal</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    
        <div className="space-y-3 order-2 lg:order-1">
          {filteredVotes.map(v => (
            <div
              key={v.id}
              className={`bg-[#161b22] rounded-lg p-4 border transition-all hover:border-[#00d4aa]/50 ${
                selectedVote?.id === v.id ? 'border-[#00d4aa]' : 'border-gray-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => loadVoteDetail(v.id)}>
                  <span className="text-xs text-[#00d4aa]">#{v.project_name || 'general'}</span>
                  {statusBadge(v.status)}
                </div>
                <div className="flex items-center gap-1">
                  {v.user_id === user?.id && v.status === 'open' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEditVote(v); }}
                      className="text-gray-500 hover:text-[#00d4aa] text-xs px-2 py-1 rounded hover:bg-[#00d4aa]/10"
                      title="Edit"
                    >
                      ✏️
                    </button>
                  )}
                  {user?.is_staff && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteVote(v.id); }}
                      className="text-gray-500 hover:text-red-400 text-xs px-2 py-1 rounded hover:bg-red-400/10"
                      title="Delete (Staff)"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
              
              {editingVote === v.id ? (
                <div className="p-2 bg-[#0d1117] rounded border border-[#00d4aa]/50 mb-2">
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={e => setEditForm({...editForm, title: e.target.value})}
                    className="w-full bg-[#161b22] border border-gray-700 rounded px-2 py-1 mb-2 text-sm"
                    onClick={e => e.stopPropagation()}
                  />
                  <textarea
                    value={editForm.description}
                    onChange={e => setEditForm({...editForm, description: e.target.value})}
                    className="w-full bg-[#161b22] border border-gray-700 rounded px-2 py-1 mb-2 text-sm resize-none"
                    rows={2}
                    onClick={e => e.stopPropagation()}
                  />
                  <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); handleSaveEdit(v.id); }} className="bg-[#00d4aa] text-black px-2 py-1 rounded text-xs">Save</button>
                    <button onClick={(e) => { e.stopPropagation(); setEditingVote(null); }} className="bg-gray-700 text-white px-2 py-1 rounded text-xs">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="cursor-pointer" onClick={() => loadVoteDetail(v.id)}>
                  <h4 className="font-medium text-sm">{v.title}</h4>
                  <p className="text-gray-500 text-xs mt-1 truncate">{v.description}</p>
                </div>
              )}
              
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 cursor-pointer" onClick={() => loadVoteDetail(v.id)}>
                <span>📊 {v.total_votes || 0} votes</span>
              </div>
            </div>
          ))}
          {filteredVotes.length === 0 && (
            <p className="text-gray-500 text-center py-8">No proposals yet</p>
          )}
        </div>

        {selectedVote && (
          <div className="bg-[#161b22] rounded-lg p-4 sm:p-6 border border-gray-800 lg:sticky lg:top-6 order-1 lg:order-2">
            <div className="flex items-center gap-2 mb-4">
              {statusBadge(selectedVote.status)}
              {selectedVote.status === 'staff_decided' && (
                <span className="text-yellow-400 text-xs">Staff decision is FINAL</span>
              )}
            </div>

            <h3 className="text-xl font-semibold mb-2">{selectedVote.title}</h3>
            <p className="text-gray-400 text-sm mb-6">{selectedVote.description}</p>

            <div className="space-y-3">
              {selectedVote.options?.map(opt => {
                const isWinner = selectedVote.winning_option_id === opt.id
                const totalVotes = selectedVote.options.reduce((acc, o) => acc + (o.vote_count || 0), 0)
                const percentage = totalVotes > 0 ? Math.round((opt.vote_count / totalVotes) * 100) : 0
                
                return (
                  <div
                    key={opt.id}
                    className={`p-4 rounded-lg border relative overflow-hidden ${
                      isWinner ? 'border-green-500 bg-green-500/5' : 'border-gray-700 bg-[#0d1117]'
                    }`}
                  >
            
                    <div 
                      className="absolute inset-0 bg-[#00d4aa]/10 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                    
                    <div className="relative flex justify-between items-center">
                      <span className="font-medium text-sm">{opt.text}</span>
                      <span className="text-gray-400 text-sm">{opt.vote_count || 0} ({percentage}%)</span>
                    </div>

                    {selectedVote.status === 'open' && (
                      <div className="relative mt-3 flex gap-2">
                        <button
                          onClick={() => handleCastVote(opt.id)}
                          className="bg-[#00d4aa]/20 border border-[#00d4aa]/50 text-[#00d4aa] px-4 py-1.5 rounded text-xs hover:bg-[#00d4aa]/30 transition-colors"
                        >
                          Vote
                        </button>
                        {user?.is_staff && (
                          <button
                            onClick={() => handleStaffDecision(opt.id)}
                            className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 px-4 py-1.5 rounded text-xs hover:bg-yellow-500/30 transition-colors"
                          >
                            🛡️ Staff Override
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}