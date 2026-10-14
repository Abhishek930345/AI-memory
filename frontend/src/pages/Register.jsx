import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(name, email, password);
      navigate("/chat");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="flex-1 flex items-center justify-center px-6 py-16 lg:px-16">
        <div className="w-full max-w-sm">
          <p className="text-sm text-muted mb-2">Memory OS</p>
          <h1 className="font-serif text-3xl text-text mb-8">Create your account</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-muted mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-text placeholder:text-muted/50 outline-none focus:border-accent transition-colors"
                placeholder="Abhishek"
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-text placeholder:text-muted/50 outline-none focus:border-accent transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-text placeholder:text-muted/50 outline-none focus:border-accent transition-colors"
                placeholder="At least 8 characters"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-ink font-medium rounded-lg py-2.5 mt-2 hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-sm text-muted mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-accent hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-surface border-l border-border items-center justify-center px-16">
        <div className="max-w-md">
          <h2 className="font-serif text-4xl leading-tight text-text mb-4">
            Your second brain,<br />built for you.
          </h2>
          <p className="text-muted leading-relaxed">
            Upload documents, chat naturally, and let the system organize what
            you've told it — so you never have to repeat yourself.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;