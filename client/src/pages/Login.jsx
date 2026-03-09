import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MdLock } from "react-icons/md";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", form);
      login(res.data.user, res.data.token);

      // Role-based redirect to prevent "mixing" of portals
      if (res.data.user.role === 'admin' || res.data.user.role === 'coordinator') {
        navigate("/admin");
      } else if (res.data.user.role === 'volunteer') {
        navigate("/volunteer");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full" onSubmit={handleSubmit}>
        <div className="flex items-center mb-6 text-orange-600">
          <MdLock size={30} className="mr-2" />
          <h2 className="text-2xl font-bold">Log In</h2>
        </div>
        {error && <div className="mb-4 text-red-600 font-semibold">{error}</div>}
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email"
          className="mb-3 p-2 w-full border rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
          required
        />
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Password"
          className="mb-3 p-2 w-full border rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
          required
        />
        <button
          type="submit"
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded font-semibold w-full transition-colors duration-200"
        >
          Log In
        </button>
        <div className="mt-4 text-center">
          <a href="/register" className="text-orange-600 hover:underline text-sm">Don't have an account? Register</a>
        </div>
      </form>
    </div>
  );
}
