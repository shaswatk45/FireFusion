import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { MdPersonAdd } from "react-icons/md";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "public",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await axios.post("http://localhost:5000/api/auth/register", form);
      setSuccess("Registration successful! You can now log in.");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full" onSubmit={handleSubmit}>
        <div className="flex items-center mb-6 text-orange-600">
          <MdPersonAdd size={30} className="mr-2" />
          <h2 className="text-2xl font-bold">Register</h2>
        </div>
        {error && <div className="mb-4 text-red-600 font-semibold">{error}</div>}
        {success && <div className="mb-4 text-green-600 font-semibold">{success}</div>}
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Name"
          className="mb-3 p-2 w-full border rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
          required
        />
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
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="mb-3 p-2 w-full border rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="public">Public User</option>
          <option value="volunteer">Volunteer</option>
          <option value="admin">Admin</option>
        </select>
        <button
          type="submit"
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded font-semibold w-full transition-colors duration-200"
        >
          Register
        </button>
        <div className="mt-4 text-center">
          <a href="/login" className="text-orange-600 hover:underline text-sm">Already have an account? Log In</a>
        </div>
      </form>
    </div>
  );
}

