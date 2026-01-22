
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function CallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setToken, fetchUser } = useAuthStore()
  const [error, setError] = useState(null)

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token')
      if (token) {
        try {
          localStorage.setItem('token', token)
          setToken(token)
          await fetchUser()
          navigate('/', { replace: true })
        } catch (err) {
          console.error('Auth error:', err)
          setError('Authentication failed')
          setTimeout(() => navigate('/login', { replace: true }), 2000)
        }
      } else {
        navigate('/login', { replace: true })
      }
    }
    handleCallback()
  }, [])

  if (error) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
          <p className="text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-12 h-12 border-4 border-[#00d4aa] border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-400">Authenticating with the hive...</p>
      </div>
    </div>
  )
}