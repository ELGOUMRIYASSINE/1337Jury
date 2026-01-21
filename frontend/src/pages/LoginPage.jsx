// 42Nexus - Login Page
// This file is for: FATYZA (Frontend Developer)
// Description: Landing page with 42 OAuth login

import { useAuthStore } from '../store/authStore';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const { login, user, isLoading } = useAuthStore();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (user && !isLoading) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-42-dark to-42-darker">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold text-42-teal mb-4">42Nexus</h1>
        <p className="text-xl text-gray-300 mb-2">
          Collaborative Platform for 42 Students
        </p>
        <p className="text-gray-400">
          Navigate the Python Common Core together
        </p>
      </div>
      
      {/* Features Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 max-w-4xl">
        <FeatureCard icon="📚" title="Resources" desc="Share learning materials" />
        <FeatureCard icon="🗳️" title="Votes" desc="Clarify subject questions" />
        <FeatureCard icon="⚡" title="Disputes" desc="Resolve corrections" />
        <FeatureCard icon="🧪" title="Tests" desc="Share test cases" />
      </div>
      
      {/* Login Button */}
      <button
        onClick={login}
        className="flex items-center gap-3 px-8 py-4 bg-42-teal hover:bg-teal-600 rounded-xl text-xl font-semibold transition-all transform hover:scale-105"
      >
        <svg className="w-8 h-8" viewBox="0 0 137.52 96.5" fill="currentColor">
          <polygon points="76.96 0 76.96 32.17 45.23 32.17 45.23 0 0 0 0 64.33 45.23 64.33 45.23 96.5 76.96 96.5 76.96 64.33 45.23 64.33 45.23 32.17 76.96 32.17 76.96 64.33 137.52 64.33 137.52 0 76.96 0" />
        </svg>
        Login with 42
      </button>
      
      {/* Staff Override Notice */}
      <div className="mt-12 p-4 bg-yellow-900/30 border border-yellow-600 rounded-lg max-w-md text-center">
        <p className="text-yellow-400 font-semibold">⚠️ Staff Override Feature</p>
        <p className="text-sm text-gray-300 mt-1">
          Staff decisions are FINAL on all votes and disputes
        </p>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="p-4 bg-42-dark rounded-xl text-center">
      <span className="text-3xl">{icon}</span>
      <h3 className="font-semibold mt-2">{title}</h3>
      <p className="text-sm text-gray-400">{desc}</p>
    </div>
  );
}

export default LoginPage;
