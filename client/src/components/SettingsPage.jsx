
import { useState } from "react";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import api from "../lib/api";

export default function SettingsPage() {
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const changePassword = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (newPassword.length < 8) {
      setError("New password must contain at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    try {
      setSaving(true);

      const response = await api.put("/auth/change-password", {
        currentPassword,
        newPassword,
      });

      setMessage(response.data.message);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to change password. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">
          Account settings
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Manage your profile and account security.
        </p>
      </div>

      {/* Profile information */}
      <section className="rounded-2xl border border-slate-800 bg-[#111B2E] p-5 sm:p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-indigo-400/10 p-3 text-indigo-400">
            <User size={21} />
          </div>

          <div>
            <h3 className="font-bold text-white">
              Profile information
            </h3>
            <p className="text-sm text-slate-400">
              Your registered account details.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-[#0B1120] p-4">
            <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
              <User size={15} />
              Full name
            </div>

            <p className="font-medium text-white">
              {user?.name || "Not available"}
            </p>
          </div>

          <div className="rounded-xl bg-[#0B1120] p-4">
            <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
              <Mail size={15} />
              Email address
            </div>

            <p className="break-all font-medium text-white">
              {user?.email || "Not available"}
            </p>
          </div>
        </div>
      </section>

      {/* Password settings */}
      <section className="rounded-2xl border border-slate-800 bg-[#111B2E] p-5 sm:p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-emerald-400/10 p-3 text-emerald-400">
            <ShieldCheck size={21} />
          </div>

          <div>
            <h3 className="font-bold text-white">
              Account security
            </h3>
            <p className="text-sm text-slate-400">
              Update your account password.
            </p>
          </div>
        </div>

        {message && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-300">
            <CheckCircle size={18} />
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-300">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={changePassword} className="space-y-4">
          <PasswordInput
            label="Current password"
            value={currentPassword}
            onChange={setCurrentPassword}
            visible={showCurrent}
            onToggle={() => setShowCurrent(!showCurrent)}
          />

          <PasswordInput
            label="New password"
            value={newPassword}
            onChange={setNewPassword}
            visible={showNew}
            onToggle={() => setShowNew(!showNew)}
          />

          <PasswordInput
            label="Confirm new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            visible={showConfirm}
            onToggle={() => setShowConfirm(!showConfirm)}
          />

          <p className="text-xs text-slate-500">
            Your new password must contain at least 8 characters.
          </p>

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Updating password..." : "Update password"}
          </button>
        </form>
      </section>
    </div>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  visible,
  onToggle,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </label>

      <div className="flex items-center rounded-xl border border-slate-700 bg-[#0B1120] px-4 focus-within:border-indigo-400">
        <Lock size={17} className="shrink-0 text-slate-500" />

        <input
          required
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Enter password"
          className="w-full bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-slate-600"
        />

        <button
          type="button"
          onClick={onToggle}
          className="text-slate-500 hover:text-white"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}
