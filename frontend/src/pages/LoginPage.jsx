
import { authApi } from '../services/api'

export default function LoginPage() {
  const handleLogin = () => {
    window.location.href = authApi.getLoginUrl()
  }

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
      <div className="text-center max-w-md mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#00d4aa] font-mono mb-2 flex items-center justify-center gap-3">
            <span className="text-4xl sm:text-5xl">🛡️</span> LeetJury
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm uppercase tracking-widest">The Peer Consensus Engine</p>
        </div>
        
        <div className="bg-[#161b22] rounded-xl p-6 sm:p-8 border border-gray-800">
          <h2 className="text-lg sm:text-xl font-semibold mb-2">Welcome, Peer</h2>
          <p className="text-gray-400 text-sm mb-6">
            Join the hive mind. Resolve ambiguities. Settle disputes.
          </p>
          
          <button 
            onClick={handleLogin} 
            className="w-full bg-[#00d4aa] text-black py-3 rounded-lg font-medium hover:bg-[#00b894] transition-colors flex items-center justify-center gap-2"
          >
            <span>🔐</span>
            Login with 42 Intra
          </button>
          
          <p className="text-gray-600 text-xs mt-4">
            Only 42 students can access this platform
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-2 sm:gap-3 text-left">
          <div className="bg-[#161b22] rounded-lg p-3 sm:p-4 border border-gray-800">
            <span className="text-xl">⚖️</span>
            <p className="text-xs sm:text-sm font-medium mt-2">Consensus Court</p>
            <p className="text-gray-500 text-[10px] sm:text-xs">Vote on subject ambiguities</p>
          </div>
          <div className="bg-[#161b22] rounded-lg p-3 sm:p-4 border border-gray-800">
            <span className="text-xl">⚔️</span>
            <p className="text-xs sm:text-sm font-medium mt-2">Live War Room</p>
            <p className="text-gray-500 text-[10px] sm:text-xs">Settle correction disputes</p>
          </div>
          <div className="bg-[#161b22] rounded-lg p-3 sm:p-4 border border-gray-800">
            <span className="text-xl">📁</span>
            <p className="text-xs sm:text-sm font-medium mt-2">Resource Vault</p>
            <p className="text-gray-500 text-[10px] sm:text-xs">Share knowledge</p>
          </div>
          <div className="bg-[#161b22] rounded-lg p-3 sm:p-4 border border-gray-800">
            <span className="text-xl">🛡️</span>
            <p className="text-xs sm:text-sm font-medium mt-2">Staff Override</p>
            <p className="text-gray-500 text-[10px] sm:text-xs">Final decisions</p>
          </div>
        </div>

        <p className="mt-6 text-yellow-500/80 text-xs">
          ⚠️ Staff decisions are <strong>FINAL</strong> and override all votes
        </p>
      </div>
    </div>
  )
}