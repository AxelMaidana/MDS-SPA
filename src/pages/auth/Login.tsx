import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogIn, Loader2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validations
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    if (!email || !password) {
      setError('Please fill all fields');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      navigate('/');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      // Error is handled by the auth context
      setError('Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 flex items-center">
      <div className="w-full max-w-md mx-auto p-8 bg-white rounded-xl shadow-md">
        <div className="text-center mb-8">
          <h1 className="font-script text-4xl text-primary-700 mb-2">Welcome Back</h1>
          <p className="text-secondary-600">Log in to your account</p>
        </div>

        {error && (
          <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="Enter your email"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="form-label">Password</label>
              <Link to="#" className="text-xs text-primary-600 hover:text-primary-800">
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="Enter your password"
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary w-full mt-6 flex justify-center items-center"
            disabled={loading}
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin mr-2" />
            ) : (
              <LogIn size={20} className="mr-2" />
            )}
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-secondary-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 font-medium hover:text-primary-800">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;