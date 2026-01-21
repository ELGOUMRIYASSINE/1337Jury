// 42Nexus - OAuth Callback Page
// This file is for: FATYZA (Frontend Developer)
// Description: Handle OAuth callback and store token

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

function CallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setToken, fetchUser } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      setToken(token);
      fetchUser().then(() => {
        navigate('/');
      });
    } else {
      navigate('/login');
    }
  }, [searchParams, setToken, fetchUser, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-42-teal mx-auto mb-4"></div>
        <p className="text-xl">Authenticating...</p>
      </div>
    </div>
  );
}

export default CallbackPage;
