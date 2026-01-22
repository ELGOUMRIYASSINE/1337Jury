
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function CallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setToken, fetchUser } = useAuthStore()

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      localStorage.setItem('token', token)
      setToken(token)
      fetchUser().then(() => navigate('/'))
    } else {
      navigate('/login')
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-12 h-12 border-4 border-[#00d4aa] border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-400">Authenticating with the hive...</p>
      </div>
    </div>
  )
}