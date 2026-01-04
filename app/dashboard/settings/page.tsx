"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import {
  User,
  Lock,
  Bell,
  Shield,
  Trash2,
  Save,
  ChevronRight,
  Globe,
  Loader2,
  Plus,
  X,
  Wallet,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface UserProfile {
  name: string;
  username: string;
  email: string;
  bio: string;
  location: string;
  techStack: string[];
  skills: string[];
  links: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
    twitter?: string;
  };
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("profile");
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    username: "",
    email: "",
    bio: "",
    location: "",
    techStack: [],
    skills: [],
    links: {},
  });
  const [newSkill, setNewSkill] = useState("");
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    projectUpdates: true,
    applicationAlerts: true,
    communityActivity: false,
  });
  const [walletInfo, setWalletInfo] = useState<{
    configured: boolean;
    publicKey?: string;
    balance?: number;
    network?: string;
    explorerUrl?: string;
    message?: string;
  } | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [requestingAirdrop, setRequestingAirdrop] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchWalletInfo();
  }, []);

  const fetchWalletInfo = async () => {
    setLoadingWallet(true);
    try {
      const res = await fetch("/api/certificates/wallet");
      if (res.ok) {
        const data = await res.json();
        setWalletInfo(data);
      }
    } catch (error) {
      console.error("Error fetching wallet info:", error);
    } finally {
      setLoadingWallet(false);
    }
  };

  const handleRequestAirdrop = async () => {
    setRequestingAirdrop(true);
    try {
      const res = await fetch("/api/certificates/wallet", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Airdrop successful!");
        fetchWalletInfo();
      } else {
        alert(data.error || "Airdrop failed");
      }
    } catch (error) {
      console.error("Error requesting airdrop:", error);
      alert("Failed to request airdrop");
    } finally {
      setRequestingAirdrop(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile({
          name: data.name || "",
          username: data.username || "",
          email: data.email || "",
          bio: data.bio || "",
          location: data.location || "",
          techStack: data.techStack || data.skills || [],
          skills: data.skills || data.techStack || [],
          links: data.links || {},
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          username: profile.username,
          bio: profile.bio,
          location: profile.location,
          techStack: profile.techStack,
          skills: profile.skills,
          links: profile.links,
        }),
      });

      if (res.ok) {
        alert("Profile updated successfully!");
      } else {
        alert("Failed to update profile");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Error saving profile");
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !profile.techStack.includes(newSkill.trim())) {
      setProfile({
        ...profile,
        techStack: [...profile.techStack, newSkill.trim()],
        skills: [...profile.skills, newSkill.trim()],
      });
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setProfile({
      ...profile,
      techStack: profile.techStack.filter((s) => s !== skill),
      skills: profile.skills.filter((s) => s !== skill),
    });
  };

  const handleChangePassword = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      alert("All password fields are required");
      return;
    }
    if (passwords.new !== passwords.confirm) {
      alert("New passwords do not match");
      return;
    }
    if (passwords.new.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.new,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Password changed successfully!");
        setPasswords({ current: "", new: "", confirm: "" });
      } else {
        alert(data.message || "Failed to change password");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      alert("Error changing password");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      try {
        const res = await fetch("/api/user/delete", {
          method: "DELETE",
        });
        if (res.ok) {
          await signOut({ callbackUrl: "/login" });
        } else {
          alert("Failed to delete account");
        }
      } catch (error) {
        console.error("Error deleting account:", error);
        alert("Error deleting account");
      }
    }
  };

  if (loading) {
    return (
      <div className="ml-80 mr-8 mt-2 mb-8 h-[calc(100vh-120px)] bg-[var(--theme-card)] rounded-[3.5rem] flex items-center justify-center">
        <Loader2 className="animate-spin h-12 w-12 text-[var(--theme-accent)]" />
      </div>
    );
  }

  return (
    <div className="ml-80 mr-8 mt-2 mb-8 h-[calc(100vh-120px)] bg-[var(--theme-card)] rounded-[3.5rem] flex overflow-hidden border border-white/5 shadow-2xl">
      {/* SETTINGS SIDEBAR */}
      <aside className="w-80 bg-[var(--theme-card-alt)] border-r border-white/5 flex flex-col">
        <div className="p-10 border-b border-white/5">
          <h1 className="text-2xl font-black   uppercase text-[#F0F4F2] tracking-tighter leading-none">
            Settings
          </h1>
          <p className="text-[9px] font-black text-[var(--theme-accent)] uppercase tracking-[0.3em] mt-3 opacity-60">
            System Configuration
          </p>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          {[
            { id: "profile", label: "Profile Identity", icon: User },
            { id: "security", label: "Security Protocol", icon: Shield },
            { id: "notifications", label: "Signal Alerts", icon: Bell },
            { id: "blockchain", label: "Blockchain Wallet", icon: Wallet },
            { id: "network", label: "Network Uplinks", icon: Globe },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center justify-between p-5 rounded-[1.8rem] transition-all duration-300 group ${
                activeSection === item.id
                  ? "bg-[var(--theme-accent)] text-[var(--theme-background)] shadow-lg"
                  : "text-[#F0F4F2]/40 hover:bg-white/5 hover:text-[#F0F4F2]"
              }`}
            >
              <div className="flex items-center gap-4">
                <item.icon size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {item.label}
                </span>
              </div>
              <ChevronRight
                size={14}
                className={
                  activeSection === item.id ? "opacity-100" : "opacity-0"
                }
              />
            </button>
          ))}
        </nav>

        <div className="p-8 mt-auto border-t border-white/5">
          <button className="w-full py-4 bg-red-500/10 text-red-500/40 hover:text-red-500 border border-red-500/10 rounded-2xl font-black uppercase text-[9px] tracking-[0.2em] transition-all">
            Terminate Session
          </button>
        </div>
      </aside>

      {/* SETTINGS CONTENT AREA */}
      <main className="flex-1 flex flex-col bg-[var(--theme-card)] overflow-y-auto no-scrollbar">
        <header className="p-10 flex justify-between items-center border-b border-white/5 bg-[var(--theme-card-alt)]/10">
          <div>
            <h2 className="text-4xl font-black   uppercase text-[#F0F4F2] tracking-tighter leading-tight">
              {activeSection.replace("-", " ")}
            </h2>
            <p className="text-[9px] font-black text-[var(--theme-accent)] uppercase tracking-[0.2em] opacity-60 mt-1">
              Authorized Personnel: {session?.user?.name || "Specialist"}
            </p>
          </div>
          <button
            onClick={handleSave}
            className="px-10 py-4 bg-[var(--theme-accent)] text-[var(--theme-background)] rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] flex items-center gap-3 hover:scale-105 transition-all shadow-xl"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Commit Updates
          </button>
        </header>

        <div className="p-12 space-y-12">
          {/* Section: Profile */}
          {activeSection === "profile" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-10"
            >
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-[var(--theme-accent)] uppercase tracking-widest opacity-50 ml-2">
                    Public Alias
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) =>
                      setProfile({ ...profile, name: e.target.value })
                    }
                    className="w-full bg-[var(--theme-card-alt)] border border-white/5 p-5 rounded-[1.8rem] text-[#F0F4F2] font-bold outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/50 transition-all"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-[var(--theme-accent)] uppercase tracking-widest opacity-50 ml-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={profile.username}
                    onChange={(e) =>
                      setProfile({ ...profile, username: e.target.value })
                    }
                    className="w-full bg-[var(--theme-card-alt)] border border-white/5 p-5 rounded-[1.8rem] text-[#F0F4F2] font-bold outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/50 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-[var(--theme-accent)] uppercase tracking-widest opacity-50 ml-2">
                    Identification Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full bg-[var(--theme-card-alt)]/50 border border-white/5 p-5 rounded-[1.8rem] text-[#F0F4F2]/30 font-bold outline-none cursor-not-allowed"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-[var(--theme-accent)] uppercase tracking-widest opacity-50 ml-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={profile.location}
                    onChange={(e) =>
                      setProfile({ ...profile, location: e.target.value })
                    }
                    placeholder="City, Country"
                    className="w-full bg-[var(--theme-card-alt)] border border-white/5 p-5 rounded-[1.8rem] text-[#F0F4F2] font-bold outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-[var(--theme-accent)] uppercase tracking-widest opacity-50 ml-2">
                  Operational Bio
                </label>
                <textarea
                  value={profile.bio}
                  onChange={(e) =>
                    setProfile({ ...profile, bio: e.target.value })
                  }
                  className="w-full bg-[var(--theme-card-alt)] border border-white/5 p-6 rounded-[2.5rem] text-[#F0F4F2] font-medium min-h-[150px] outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/50 transition-all"
                  placeholder="Update your specialist brief..."
                />
              </div>

              {/* Skills Section */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-[var(--theme-accent)] uppercase tracking-widest opacity-50 ml-2">
                  Tech Stack / Skills
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addSkill()}
                    placeholder="Add a skill (e.g., React, Node.js)"
                    className="flex-1 bg-[var(--theme-card-alt)] border border-white/5 p-5 rounded-[1.8rem] text-[#F0F4F2] font-bold outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/50 transition-all"
                  />
                  <button
                    onClick={addSkill}
                    className="px-8 py-5 bg-[var(--theme-accent)] text-[var(--theme-background)] rounded-[1.8rem] font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-3 mt-4">
                  {profile.techStack.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-5 py-3 bg-[var(--theme-card-alt)] border border-white/5 text-[var(--theme-accent)] rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 group hover:border-red-500/30 transition-all"
                    >
                      {skill}
                      <button
                        onClick={() => removeSkill(skill)}
                        className="text-[#F0F4F2]/30 hover:text-red-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Links Section */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-[var(--theme-accent)] uppercase tracking-widest opacity-50 ml-2">
                  Social Links
                </label>
                <div className="grid grid-cols-2 gap-6">
                  <input
                    type="url"
                    value={profile.links.github || ""}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        links: { ...profile.links, github: e.target.value },
                      })
                    }
                    placeholder="GitHub URL"
                    className="w-full bg-[var(--theme-card-alt)] border border-white/5 p-5 rounded-[1.8rem] text-[#F0F4F2] font-medium outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/50 transition-all"
                  />
                  <input
                    type="url"
                    value={profile.links.linkedin || ""}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        links: { ...profile.links, linkedin: e.target.value },
                      })
                    }
                    placeholder="LinkedIn URL"
                    className="w-full bg-[var(--theme-card-alt)] border border-white/5 p-5 rounded-[1.8rem] text-[#F0F4F2] font-medium outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/50 transition-all"
                  />
                  <input
                    type="url"
                    value={profile.links.portfolio || ""}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        links: { ...profile.links, portfolio: e.target.value },
                      })
                    }
                    placeholder="Portfolio URL"
                    className="w-full bg-[var(--theme-card-alt)] border border-white/5 p-5 rounded-[1.8rem] text-[#F0F4F2] font-medium outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/50 transition-all"
                  />
                  <input
                    type="url"
                    value={profile.links.twitter || ""}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        links: { ...profile.links, twitter: e.target.value },
                      })
                    }
                    placeholder="Twitter URL"
                    className="w-full bg-[var(--theme-card-alt)] border border-white/5 p-5 rounded-[1.8rem] text-[#F0F4F2] font-medium outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/50 transition-all"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Section: Security */}
          {activeSection === "security" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="bg-[var(--theme-card-alt)] p-10 rounded-[3.5rem] border border-white/5">
                <div className="flex items-center gap-5 mb-8">
                  <div className="p-4 bg-[var(--theme-card)] rounded-2xl text-[var(--theme-accent)] border border-white/5">
                    <Lock size={24} />
                  </div>
                  <h3 className="text-2xl font-black   uppercase text-[#F0F4F2] tracking-tighter">
                    Access Encryption
                  </h3>
                </div>
                <div className="space-y-6">
                  <input
                    type="password"
                    placeholder="Current Password"
                    value={passwords.current}
                    onChange={(e) =>
                      setPasswords({ ...passwords, current: e.target.value })
                    }
                    className="w-full bg-[var(--theme-card)] border border-white/5 p-5 rounded-[1.8rem] text-[#F0F4F2] outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/50 transition-all"
                  />
                  <input
                    type="password"
                    placeholder="New Password"
                    value={passwords.new}
                    onChange={(e) =>
                      setPasswords({ ...passwords, new: e.target.value })
                    }
                    className="w-full bg-[var(--theme-card)] border border-white/5 p-5 rounded-[1.8rem] text-[#F0F4F2] outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/50 transition-all"
                  />
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={passwords.confirm}
                    onChange={(e) =>
                      setPasswords({ ...passwords, confirm: e.target.value })
                    }
                    className="w-full bg-[var(--theme-card)] border border-white/5 p-5 rounded-[1.8rem] text-[#F0F4F2] outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/50 transition-all"
                  />
                  <button
                    onClick={handleChangePassword}
                    disabled={saving}
                    className="w-full py-5 bg-[var(--theme-accent)] text-[var(--theme-background)] rounded-[1.8rem] font-black uppercase text-[10px] tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Section: Notifications */}
          {activeSection === "notifications" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {[
                {
                  key: "emailNotifications",
                  label: "Email Notifications",
                  desc: "Receive updates via email",
                },
                {
                  key: "projectUpdates",
                  label: "Project Updates",
                  desc: "Get notified about project changes",
                },
                {
                  key: "applicationAlerts",
                  label: "Application Alerts",
                  desc: "Alerts for new applications",
                },
                {
                  key: "communityActivity",
                  label: "Community Activity",
                  desc: "Updates from community discussions",
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="bg-[var(--theme-card-alt)] p-8 rounded-[2.5rem] border border-white/5 flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-lg font-black   uppercase text-[#F0F4F2] tracking-tighter">
                      {item.label}
                    </h4>
                    <p className="text-[10px] font-medium text-[#F0F4F2]/40 uppercase tracking-widest mt-1">
                      {item.desc}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setNotificationSettings({
                        ...notificationSettings,
                        [item.key]:
                          !notificationSettings[
                            item.key as keyof typeof notificationSettings
                          ],
                      })
                    }
                    className={`w-16 h-8 rounded-full transition-all ${
                      notificationSettings[
                        item.key as keyof typeof notificationSettings
                      ]
                        ? "bg-[var(--theme-accent)]"
                        : "bg-[var(--theme-card)]"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 bg-white rounded-full transition-all ${
                        notificationSettings[
                          item.key as keyof typeof notificationSettings
                        ]
                          ? "ml-9"
                          : "ml-1"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </motion.div>
          )}

          {/* Section: Blockchain */}
          {activeSection === "blockchain" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="bg-[var(--theme-card-alt)] p-10 rounded-[3.5rem] border border-white/5">
                <div className="flex items-center gap-5 mb-8">
                  <div className="p-4 bg-[var(--theme-card)] rounded-2xl text-[var(--theme-accent)] border border-white/5">
                    <Wallet size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase text-[#F0F4F2] tracking-tighter">
                      Solana Wallet
                    </h3>
                    <p className="text-[10px] font-medium text-[#F0F4F2]/40 uppercase tracking-widest mt-1">
                      For minting certificates on blockchain
                    </p>
                  </div>
                </div>

                {loadingWallet ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin h-8 w-8 text-[var(--theme-accent)]" />
                  </div>
                ) : walletInfo?.configured ? (
                  <div className="space-y-6">
                    <div className="p-6 bg-[var(--theme-card)] rounded-[2rem] border border-white/5">
                      <p className="text-[10px] font-black text-[var(--theme-accent)] uppercase tracking-widest opacity-50 mb-2">
                        Wallet Address
                      </p>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-mono text-[#F0F4F2] flex-1 truncate">
                          {walletInfo.publicKey}
                        </p>
                        <a
                          href={walletInfo.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-[var(--theme-card-alt)] rounded-lg hover:bg-white/10 transition-all"
                        >
                          <ExternalLink size={14} className="text-[var(--theme-accent)]" />
                        </a>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="p-6 bg-[var(--theme-card)] rounded-[2rem] border border-white/5">
                        <p className="text-[10px] font-black text-[var(--theme-accent)] uppercase tracking-widest opacity-50 mb-2">
                          Balance
                        </p>
                        <p className="text-3xl font-black text-[#F0F4F2]">
                          {walletInfo.balance?.toFixed(4)} <span className="text-lg text-[var(--theme-accent)]">SOL</span>
                        </p>
                      </div>
                      <div className="p-6 bg-[var(--theme-card)] rounded-[2rem] border border-white/5">
                        <p className="text-[10px] font-black text-[var(--theme-accent)] uppercase tracking-widest opacity-50 mb-2">
                          Network
                        </p>
                        <p className="text-xl font-black text-[#F0F4F2] uppercase">
                          {walletInfo.network}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={handleRequestAirdrop}
                        disabled={requestingAirdrop}
                        className="flex-1 py-5 bg-[var(--theme-accent)] text-[var(--theme-background)] rounded-[1.8rem] font-black uppercase text-[10px] tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {requestingAirdrop ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <RefreshCw size={16} />
                        )}
                        Request Airdrop (1 SOL)
                      </button>
                      <button
                        onClick={fetchWalletInfo}
                        className="px-8 py-5 bg-[var(--theme-card)] text-[var(--theme-accent)] rounded-[1.8rem] font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all border border-white/5"
                      >
                        <RefreshCw size={16} />
                      </button>
                    </div>

                    <p className="text-[10px] text-[#F0F4F2]/40 text-center">
                      Airdrop is only available on Devnet. Each certificate mint costs ~0.001 SOL.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Wallet className="mx-auto mb-4 text-[var(--theme-accent)]/30" size={48} />
                    <h4 className="text-lg font-bold text-[#F0F4F2] mb-2">
                      Wallet Not Configured
                    </h4>
                    <p className="text-sm text-[var(--theme-accent)]/60 max-w-md mx-auto mb-6">
                      {walletInfo?.message || "Add SOLANA_WALLET_SECRET_KEY to your .env.local file to enable blockchain certificate minting."}
                    </p>
                    <div className="bg-[var(--theme-card)] p-6 rounded-2xl text-left max-w-lg mx-auto">
                      <p className="text-[10px] font-black text-[var(--theme-accent)] uppercase tracking-widest mb-3">
                        Setup Instructions:
                      </p>
                      <ol className="text-xs text-[#F0F4F2]/60 space-y-2 list-decimal list-inside">
                        <li>Run: <code className="bg-[var(--theme-card-alt)] px-2 py-1 rounded">node scripts/generate-solana-wallet.js</code></li>
                        <li>Copy the secret key to .env.local as SOLANA_WALLET_SECRET_KEY</li>
                        <li>Fund the wallet at <a href="https://faucet.solana.com" target="_blank" rel="noopener noreferrer" className="text-[var(--theme-accent)] hover:underline">faucet.solana.com</a></li>
                        <li>Restart the development server</li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Section: Network */}
          {activeSection === "network" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="bg-[var(--theme-card-alt)] p-10 rounded-[3.5rem] border border-white/5">
                <div className="flex items-center gap-5 mb-8">
                  <div className="p-4 bg-[var(--theme-card)] rounded-2xl text-[var(--theme-accent)] border border-white/5">
                    <Globe size={24} />
                  </div>
                  <h3 className="text-2xl font-black   uppercase text-[#F0F4F2] tracking-tighter">
                    Network Uplinks
                  </h3>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-6 bg-[var(--theme-card)] rounded-[2rem] border border-white/5">
                    <div>
                      <p className="text-sm font-black uppercase text-[#F0F4F2] tracking-wider">
                        Profile Visibility
                      </p>
                      <p className="text-[9px] font-medium text-[#F0F4F2]/40 uppercase tracking-widest mt-1">
                        Make your profile visible to other users
                      </p>
                    </div>
                    <span className="px-6 py-2 bg-[var(--theme-accent)] text-[var(--theme-background)] rounded-xl font-black uppercase text-[9px] tracking-widest">
                      Public
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-6 bg-[var(--theme-card)] rounded-[2rem] border border-white/5">
                    <div>
                      <p className="text-sm font-black uppercase text-[#F0F4F2] tracking-wider">
                        Project Discovery
                      </p>
                      <p className="text-[9px] font-medium text-[#F0F4F2]/40 uppercase tracking-widest mt-1">
                        Allow others to discover your projects
                      </p>
                    </div>
                    <span className="px-6 py-2 bg-[var(--theme-accent)] text-[var(--theme-background)] rounded-xl font-black uppercase text-[9px] tracking-widest">
                      Enabled
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-6 bg-[var(--theme-card)] rounded-[2rem] border border-white/5">
                    <div>
                      <p className="text-sm font-black uppercase text-[#F0F4F2] tracking-wider">
                        Connection Status
                      </p>
                      <p className="text-[9px] font-medium text-[#F0F4F2]/40 uppercase tracking-widest mt-1">
                        Current network connection status
                      </p>
                    </div>
                    <span className="px-6 py-2 bg-green-500/20 text-green-500 rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Online
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Critical Actions */}
          <div className="pt-12 border-t border-white/5">
            <h4 className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em] mb-6 opacity-60">
              Critical Protocols
            </h4>
            <div className="bg-red-500/5 border border-red-500/10 p-10 rounded-[3.5rem] flex items-center justify-between">
              <div>
                <p className="text-xl font-black   text-[#F0F4F2] uppercase tracking-tighter mb-2">
                  Delete Identity
                </p>
                <p className="text-[10px] font-bold text-red-500/60 uppercase tracking-widest">
                  Warning: This action permanently wipes all operational data.
                </p>
              </div>
              <button
                onClick={handleDeleteAccount}
                className="px-10 py-4 bg-red-500/10 text-red-500 font-black uppercase text-[10px] tracking-widest rounded-[1.5rem] hover:bg-red-500 hover:text-white transition-all"
              >
                <Trash2 size={16} className="inline mr-2" /> WIPE DATA
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
