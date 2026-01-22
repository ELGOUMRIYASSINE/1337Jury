
import { useAuthStore } from '../store/authStore'
import { useEffect, useState } from 'react'
import { votesApi, disputesApi, resourcesApi } from '../services/api'

export default function Profile() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState({ votes: 0, disputes: 0, resources: 0 })

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const [votesRes, disputesRes, resourcesRes] = await Promise.all([
        votesApi.list().catch(() => ({ data: [] })),
        disputesApi.list().catch(() => ({ data: [] })),
        resourcesApi.list().catch(() => ({ data: [] }))
      ])
      setStats({
        votes: (votesRes.data || []).length,
        disputes: (disputesRes.data || []).length,
        resources: (resourcesRes.data || []).filter(r => r.user_id === user?.id).length
      })
    } catch (e) { console.error(e) }
  }

  if (!user) return <div className="p-6 text-gray-500">Loading...</div>

  return (
    <div className="p-4 sm:p-6 max-w-2xl">
      <h1 className="text-xl sm:text-2xl font-bold font-mono mb-6 flex items-center gap-2">👤 Profile</h1>

      <div className="bg-[#161b22] rounded-xl p-4 sm:p-6 border border-gray-800 mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="" className="w-20 h-20 rounded-full border-2 border-[#00d4aa]" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#0d1117] border-2 border-[#00d4aa] flex items-center justify-center text-3xl text-[#00d4aa]">
              {user.login?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">{user.display_name || user.login}</h2>
            <p className="text-[#00d4aa]">@{user.login}</p>
            {user.email && <p className="text-gray-500 text-sm">{user.email}</p>}
            {user.is_staff && (
              <span className="inline-block mt-2 text-xs bg-yellow-500 text-black px-3 py-1 rounded-full font-medium">
                🛡️ STAFF MEMBER
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#161b22] rounded-lg p-4 border border-gray-800 text-center">
          <p className="text-3xl font-bold text-[#00d4aa]">{stats.resources}</p>
          <p className="text-gray-500 text-sm">Resources Shared</p>
        </div>
        <div className="bg-[#161b22] rounded-lg p-4 border border-gray-800 text-center">
          <p className="text-3xl font-bold text-blue-400">{stats.votes}</p>
          <p className="text-gray-500 text-sm">Proposals Active</p>
        </div>
        <div className="bg-[#161b22] rounded-lg p-4 border border-gray-800 text-center">
          <p className="text-3xl font-bold text-red-400">{stats.disputes}</p>
          <p className="text-gray-500 text-sm">Disputes</p>
        </div>
      </div>

      {user.is_staff && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-400 mb-2 flex items-center gap-2">
            🛡️ Staff Powers
          </h3>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Override any vote decision (FINAL)</li>
            <li>• Override any dispute decision (FINAL)</li>
            <li>• Approve/reject submitted tests</li>
            <li>• Create new projects</li>
            <li>• Delete any resource</li>
          </ul>
        </div>
      )}

      <div className="mt-6 text-gray-600 text-sm">
        <p>Member since joining 42 · Authenticated via 42 OAuth</p>
      </div>
    </div>
  )
}