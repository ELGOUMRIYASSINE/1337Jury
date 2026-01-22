
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useEffect, useState } from 'react'
import { disputesApi, resourcesApi, votesApi, testsApi } from '../services/api'

export default function Layout() {
  const { user, fetchUser, logout } = useAuthStore()
  const navigate = useNavigate()
  const [sidebarData, setSidebarData] = useState({ 
    disputes: [], 
    resources: [], 
    recentVotes: [],
    tests: [],
    stats: { totalUsers: 0, openDisputes: 0, totalVotes: 0 }
  })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileRightOpen, setMobileRightOpen] = useState(false)

  useEffect(() => {
    fetchUser()
    loadSidebarData()
    const interval = setInterval(loadSidebarData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadSidebarData = async () => {
    try {
      const [disputesRes, resourcesRes, votesRes, testsRes] = await Promise.all([
        disputesApi.list().catch(() => ({ data: [] })),
        resourcesApi.list().catch(() => ({ data: [] })),
        votesApi.list().catch(() => ({ data: [] })),
        testsApi.list().catch(() => ({ data: [] }))
      ])
      
      const openDisputes = (disputesRes.data || []).filter(d => d.status === 'open')
      const openVotes = (votesRes.data || []).filter(v => v.status === 'open')
      
      setSidebarData({
        disputes: openDisputes.slice(0, 3),
        resources: (resourcesRes.data || []).slice(0, 3),
        recentVotes: openVotes.slice(0, 3),
        tests: (testsRes.data || []).slice(0, 3),
        stats: {
          openDisputes: openDisputes.length,
          totalVotes: (votesRes.data || []).length,
          activeProposals: openVotes.length
        }
      })
    } catch (e) { console.error(e) }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { path: '/', label: 'Feed', icon: '🏠' },
    { path: '/votes', label: 'Consensus Court', icon: '⚖️' },
    { path: '/disputes', label: 'Live War Room', icon: '⚔️' },
    { path: '/tests', label: 'Community Tests', icon: '🧪' },
    { path: '/recode', label: 'Recode Me', icon: '🔄' },
    { path: '/resources', label: 'Resource Vault', icon: '📁' },
    { path: '/profile', label: 'Profile', icon: '👤' },
  ]

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200 flex">
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-[#0d1117] border-b border-gray-800 z-50 px-4 py-3 flex items-center justify-between">
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-2xl">
          ☰
        </button>
        <h1 className="text-lg font-bold text-[#00d4aa] flex items-center gap-2 font-mono">
          <span>🛡️</span> LeetJury
        </h1>
        <button onClick={() => setMobileRightOpen(!mobileRightOpen)} className="text-xl">
          📊
        </button>
      </div>

    
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileMenuOpen(false)} />
      )}
      {mobileRightOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileRightOpen(false)} />
      )}

      <aside className={`w-56 bg-[#0d1117] border-r border-gray-800 p-4 flex flex-col fixed h-full z-50 transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[#00d4aa] flex items-center gap-2 font-mono">
            <span className="text-2xl">🛡️</span> LeetJury
          </h1>
          <p className="text-gray-500 text-[10px] uppercase tracking-wider mt-1">The Peer Consensus Engine</p>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm ${
                  isActive 
                    ? 'bg-[#00d4aa] text-black font-medium' 
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {user && (
          <div className="border-t border-gray-800 pt-4 mt-4">
            <div className="flex items-center gap-3 mb-3 px-2">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm">
                  {user.login?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{user.login}</p>
                {user.is_staff && (
                  <span className="text-xs bg-yellow-500 text-black px-1.5 py-0.5 rounded text-[10px]">STAFF</span>
                )}
              </div>
            </div>
            <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-gray-500 hover:text-red-400 text-sm transition-colors">
              ← Logout
            </button>
          </div>
        )}
      </aside>

      <main className="flex-1 lg:ml-56 lg:mr-72 pt-16 lg:pt-0">
        <Outlet />
      </main>

      <aside className={`w-72 bg-[#0d1117] border-l border-gray-800 p-4 fixed right-0 h-full overflow-y-auto z-50 transition-transform duration-300 ${mobileRightOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0`}>
       
        <div className="mb-4 grid grid-cols-3 gap-2">
          <div className="bg-[#161b22] rounded-lg p-2 text-center border border-gray-800">
            <div className="text-lg font-bold text-[#00d4aa]">{sidebarData.stats.activeProposals}</div>
            <div className="text-[10px] text-gray-500">Active Votes</div>
          </div>
          <div className="bg-[#161b22] rounded-lg p-2 text-center border border-gray-800">
            <div className="text-lg font-bold text-red-400">{sidebarData.stats.openDisputes}</div>
            <div className="text-[10px] text-gray-500">Open Disputes</div>
          </div>
          <div className="bg-[#161b22] rounded-lg p-2 text-center border border-gray-800">
            <div className="text-lg font-bold text-yellow-400">{sidebarData.stats.totalVotes}</div>
            <div className="text-[10px] text-gray-500">Total Proposals</div>
          </div>
        </div>

        {sidebarData.recentVotes.length > 0 && (
          <div className="bg-[#161b22] rounded-lg p-4 mb-4 border border-gray-800">
            <h3 className="font-semibold text-sm flex items-center gap-2 mb-3 text-[#00d4aa]">
              <span>⚖️</span> Active Proposals
            </h3>
            <div className="space-y-2 mb-3">
              {sidebarData.recentVotes.map(v => (
                <div 
                  key={v.id} 
                  onClick={() => navigate('/votes')}
                  className="text-xs text-gray-400 flex items-center gap-2 cursor-pointer hover:text-white transition-colors"
                >
                  <span className="text-[#00d4aa]">📊</span>
                  <span className="truncate">{v.title}</span>
                </div>
              ))}
            </div>
            <button 
              onClick={() => navigate('/votes')}
              className="w-full border border-[#00d4aa]/50 text-[#00d4aa] py-2 rounded text-xs font-medium hover:bg-[#00d4aa]/10 transition-colors"
            >
              View All Proposals
            </button>
          </div>
        )}

        <div className="bg-[#161b22] rounded-lg p-4 mb-4 border border-gray-800">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-2 text-red-400">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            Live War Room ({sidebarData.disputes.length})
          </h3>
          <p className="text-gray-500 text-xs mb-3">Need a live review before booking your intra correction?</p>
          
          {sidebarData.disputes.length > 0 ? (
            <div className="space-y-2 mb-3">
              {sidebarData.disputes.map(d => (
                <div 
                  key={d.id} 
                  onClick={() => navigate('/disputes')}
                  className="text-xs text-gray-400 flex items-center gap-2 cursor-pointer hover:text-white transition-colors"
                >
                  <span className="text-yellow-400">⚡</span>
                  <span className="truncate">{d.title}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-600 mb-3">No active disputes right now</p>
          )}
          
          <button 
            onClick={() => navigate('/disputes')}
            className="w-full bg-red-500/10 border border-red-500/50 text-red-400 py-2 rounded text-xs font-medium hover:bg-red-500/20 transition-colors"
          >
            GO LIVE & ASK FOR HELP
          </button>
        </div>

        {sidebarData.tests.length > 0 && (
          <div className="bg-[#161b22] rounded-lg p-4 mb-4 border border-gray-800">
            <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
              <span>🧪</span> Popular Tests
            </h3>
            <div className="space-y-2 mb-3">
              {sidebarData.tests.map(t => (
                <div 
                  key={t.id} 
                  onClick={() => navigate('/tests')}
                  className="text-xs text-gray-400 flex items-center gap-2 cursor-pointer hover:text-white transition-colors"
                >
                  <span className="text-purple-400">📥</span>
                  <span className="truncate">{t.title}</span>
                  <span className="text-gray-600 ml-auto">{t.downloads || 0}</span>
                </div>
              ))}
            </div>
            <button 
              onClick={() => navigate('/tests')}
              className="w-full border border-purple-500/50 text-purple-400 py-2 rounded text-xs font-medium hover:bg-purple-500/10 transition-colors"
            >
              Browse All Tests
            </button>
          </div>
        )}

        <div className="bg-[#161b22] rounded-lg p-4 mb-4 border border-gray-800">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
            <span>📁</span> Resource Vault
          </h3>
          
          {sidebarData.resources.length > 0 ? (
            <div className="space-y-2 mb-3">
              {sidebarData.resources.map(r => (
                <div 
                  key={r.id} 
                  onClick={() => navigate('/resources')}
                  className="text-xs text-gray-400 flex items-center gap-2 cursor-pointer hover:text-white transition-colors"
                >
                  <span>{r.resource_type === 'video' ? '🎬' : r.resource_type === 'documentation' ? '📄' : r.resource_type === 'tool' ? '🔧' : '🔗'}</span>
                  <span className="truncate">{r.title}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-600 mb-3">No resources shared yet</p>
          )}
          
          <button 
            onClick={() => navigate('/resources')}
            className="w-full border border-[#00d4aa]/50 text-[#00d4aa] py-2 rounded text-xs font-medium hover:bg-[#00d4aa]/10 transition-colors"
          >
            View All Resources
          </button>
        </div>

        <div className="bg-[#161b22] rounded-lg p-4 border border-gray-800">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-2">
            <span className="text-yellow-500">🛡️</span> Staff Presence
          </h3>
          <p className="text-gray-500 text-xs">
            Staff <span className="text-[#00d4aa]">@bocal_official</span> just validated a tool in <span className="text-[#00d4aa]">#cub3d</span>.
          </p>
        </div>
      </aside>
    </div>
  )
}