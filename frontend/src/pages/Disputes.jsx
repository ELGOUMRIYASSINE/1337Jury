
import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { disputesApi, projectsApi } from '../services/api'

export default function Disputes() {
  const { user } = useAuthStore()
  const [disputes, setDisputes] = useState([])
  const [projects, setProjects] = useState([])
  const [selectedDispute, setSelectedDispute] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', project_id: '', corrector_username: '', corrected_username: '' })
  const [filter, setFilter] = useState('all')
  const [editingDispute, setEditingDispute] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', description: '' })

  useEffect(() => {
    loadDisputes()
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const { data } = await projectsApi.list()
      setProjects(data || [])
    } catch (e) { console.error(e) }
  }

  const loadDisputes = async () => {
    try {
      const { data } = await disputesApi.list()
      setDisputes(data || [])
    } catch (e) { console.error(e) }
  }

  const loadDisputeDetail = async (id) => {
    try {
      const { data } = await disputesApi.get(id)
      setSelectedDispute(data)
    } catch (e) { console.error(e) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.project_id) return alert('Select a project')
    try {
      await disputesApi.create({
        ...form,
        project_id: parseInt(form.project_id),
        corrector_username: form.corrector_username.trim(),
        corrected_username: form.corrected_username.trim()
      })
      setForm({ title: '', description: '', project_id: '', corrector_username: '', corrected_username: '' })
      setShowForm(false)
      loadDisputes()
    } catch (e) { 
      alert(e.response?.data?.detail || 'Error creating dispute')
      console.error(e) 
    }
  }

  const handleVote = async (voteFor) => {
    try {
      await disputesApi.vote(selectedDispute.id, voteFor)
      loadDisputeDetail(selectedDispute.id)
    } catch (e) { alert(e.response?.data?.detail || 'Error voting') }
  }

  const handleStaffDecision = async (winner) => {
    const reason = prompt('Reason for decision (optional):')
    try {
      await disputesApi.staffDecision(selectedDispute.id, winner, reason)
      loadDisputeDetail(selectedDispute.id)
      loadDisputes()
    } catch (e) { console.error(e) }
  }

  const handleEditDispute = (dispute) => {
    setEditingDispute(dispute.id)
    setEditForm({ title: dispute.title, description: dispute.description })
  }

  const handleSaveEdit = async (disputeId) => {
    try {
      await disputesApi.update(disputeId, editForm)
      setEditingDispute(null)
      setEditForm({ title: '', description: '' })
      loadDisputes()
      if (selectedDispute?.id === disputeId) {
        loadDisputeDetail(disputeId)
      }
    } catch (e) {
      console.error(e)
      alert(e.response?.data?.detail || 'Failed to update')
    }
  }

  const handleDeleteDispute = async (disputeId) => {
    if (!confirm('Are you sure you want to delete this dispute?')) return
    try {
      await disputesApi.delete(disputeId)
      if (selectedDispute?.id === disputeId) {
        setSelectedDispute(null)
      }
      loadDisputes()
    } catch (e) {
      console.error(e)
      alert(e.response?.data?.detail || 'Failed to delete')
    }
  }

  const filteredDisputes = disputes.filter(d => {
    if (filter === 'all') return true
    if (filter === 'open') return d.status === 'open'
    if (filter === 'decided') return d.status === 'staff_decided'
    return true
  })

  const statusBadge = (status, winner) => {
    if (status === 'open') return <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded flex items-center gap-1"><span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span> LIVE</span>
    if (status === 'staff_decided') return <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">🛡️ STAFF FINAL</span>
    return <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Winner: {winner}</span>
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            Live War Room
          </h1>
          <p className="text-gray-500 text-sm">Settle correction disputes. Staff decisions are FINAL.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors w-full sm:w-auto">
          🚨 Report Dispute
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {['all', 'open', 'decided'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
              filter === f ? 'bg-red-500 text-white' : 'bg-[#161b22] text-gray-400 hover:text-white border border-gray-700'
            }`}
          >
            {f === 'all' ? 'All' : f === 'open' ? '🔴 Live' : '🛡️ Decided'}
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#161b22] rounded-lg p-4 mb-6 border border-red-500/30">
          <h3 className="font-semibold mb-4 text-red-400">🚨 Report New Dispute</h3>
          <div className="grid gap-4">
            <select
              value={form.project_id}
              onChange={e => setForm({...form, project_id: e.target.value})}
              className="bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-red-500"
              required
            >
              <option value="">Select project...</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <input
              placeholder="Dispute title"
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              className="bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-red-500"
              required
            />
            <textarea
              placeholder="Describe what happened during correction..."
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              className="bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-red-500"
              rows={3}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                placeholder="Corrector username"
                type="text"
                value={form.corrector_username}
                onChange={e => setForm({...form, corrector_username: e.target.value})}
                className="bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-red-500"
                required
              />
              <input
                placeholder="Corrected username"
                type="text"
                value={form.corrected_username}
                onChange={e => setForm({...form, corrected_username: e.target.value})}
                className="bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-red-500"
                required
              />
            </div>
            <button type="submit" className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600">Submit Dispute</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3 order-2 lg:order-1">
          {filteredDisputes.map(d => (
            <div
              key={d.id}
              className={`bg-[#161b22] rounded-lg p-4 border transition-all hover:border-red-500/50 ${
                selectedDispute?.id === d.id ? 'border-red-500' : 'border-gray-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => loadDisputeDetail(d.id)}>
                  <span className="text-xs text-[#00d4aa]">#{d.project_name || 'general'}</span>
                  {statusBadge(d.status, d.winner)}
                </div>
                <div className="flex items-center gap-1">
                  {d.created_by === user?.id && d.status === 'open' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEditDispute(d); }}
                      className="text-gray-500 hover:text-[#00d4aa] text-xs px-2 py-1 rounded hover:bg-[#00d4aa]/10"
                      title="Edit"
                    >
                      ✏️
                    </button>
                  )}
                  {user?.is_staff && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteDispute(d.id); }}
                      className="text-gray-500 hover:text-red-400 text-xs px-2 py-1 rounded hover:bg-red-400/10"
                      title="Delete (Staff)"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
              
              {editingDispute === d.id ? (
                <div className="p-2 bg-[#0d1117] rounded border border-red-500/50 mb-2">
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
                    <button onClick={(e) => { e.stopPropagation(); handleSaveEdit(d.id); }} className="bg-red-500 text-white px-2 py-1 rounded text-xs">Save</button>
                    <button onClick={(e) => { e.stopPropagation(); setEditingDispute(null); }} className="bg-gray-700 text-white px-2 py-1 rounded text-xs">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="cursor-pointer" onClick={() => loadDisputeDetail(d.id)}>
                  <h4 className="font-medium text-sm">{d.title}</h4>
                </div>
              )}
              
              <div className="flex items-center gap-4 mt-2 text-xs cursor-pointer" onClick={() => loadDisputeDetail(d.id)}>
                <span className="text-blue-400">👨‍💻 Corrector: {d.corrector_votes}</span>
                <span className="text-purple-400">🧑‍🎓 Corrected: {d.corrected_votes}</span>
              </div>
            </div>
          ))}
          {filteredDisputes.length === 0 && (
            <p className="text-gray-500 text-center py-8">No disputes. Peace in the cluster! ✌️</p>
          )}
        </div>

        {selectedDispute && (
          <div className="bg-[#161b22] rounded-lg p-4 sm:p-6 border border-gray-800 lg:sticky lg:top-6 order-1 lg:order-2">
            <div className="flex items-center gap-2 mb-4">
              {statusBadge(selectedDispute.status, selectedDispute.winner)}
              {selectedDispute.status === 'staff_decided' && (
                <span className="text-yellow-400 text-xs">Staff decision is FINAL</span>
              )}
            </div>

            <h3 className="text-xl font-semibold mb-2">{selectedDispute.title}</h3>
            <p className="text-gray-400 text-sm mb-6">{selectedDispute.description}</p>

            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg border text-center transition-all ${
                selectedDispute.winner === 'corrector' ? 'border-green-500 bg-green-500/10' : 'border-gray-700 bg-[#0d1117]'
              }`}>
                <p className="text-3xl mb-2">👨‍💻</p>
                <p className="font-semibold text-blue-400">Corrector</p>
                {selectedDispute.corrector_username && (
                  <p className="text-xs text-gray-400">@{selectedDispute.corrector_username} (you)</p>
                )}
                <p className="text-4xl font-bold text-white my-3">{selectedDispute.corrector_votes}</p>
                {selectedDispute.status === 'open' && (
                  <div className="space-y-2">
                    <button onClick={() => handleVote('corrector')} className="w-full bg-blue-500/20 border border-blue-500/50 text-blue-400 py-2 rounded text-sm hover:bg-blue-500/30 transition-colors">
                      Vote Corrector
                    </button>
                    {user?.is_staff && (
                      <button onClick={() => handleStaffDecision('corrector')} className="w-full bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 py-2 rounded text-xs hover:bg-yellow-500/30 transition-colors">
                        🛡️ Staff Override
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className={`p-4 rounded-lg border text-center transition-all ${
                selectedDispute.winner === 'corrected' ? 'border-green-500 bg-green-500/10' : 'border-gray-700 bg-[#0d1117]'
              }`}>
                <p className="text-3xl mb-2">🧑‍🎓</p>
                <p className="font-semibold text-purple-400">Corrected</p>
                {selectedDispute.corrected_username && (
                  <p className="text-xs text-gray-400">@{selectedDispute.corrected_username} (you)</p>
                )}
                <p className="text-4xl font-bold text-white my-3">{selectedDispute.corrected_votes}</p>
                {selectedDispute.status === 'open' && (
                  <div className="space-y-2">
                    <button onClick={() => handleVote('corrected')} className="w-full bg-purple-500/20 border border-purple-500/50 text-purple-400 py-2 rounded text-sm hover:bg-purple-500/30 transition-colors">
                      Vote Corrected
                    </button>
                    {user?.is_staff && (
                      <button onClick={() => handleStaffDecision('corrected')} className="w-full bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 py-2 rounded text-xs hover:bg-yellow-500/30 transition-colors">
                        🛡️ Staff Override
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {selectedDispute.staff_decision_reason && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-400">🛡️ Staff reason: {selectedDispute.staff_decision_reason}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}