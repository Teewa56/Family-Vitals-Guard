import { useAuth } from "@workspace/replit-auth-web";
import { useGetProfileStats, useGetUserProfile, useUpdateUserProfile } from "@workspace/api-client-react";
import { Activity, Flame, ShieldAlert, Link2, Bell, Globe, Mail, Save, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function ProfilePage() {
  const { user } = useAuth();
  const { data: profile, isLoading: loadingProfile } = useGetUserProfile();
  const { data: stats, isLoading: loadingStats } = useGetProfileStats();
  const updateProfile = useUpdateUserProfile();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    notificationsEnabled: true,
    guardianAlertEmail: "",
    timezone: "America/New_York",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        notificationsEnabled: profile.notificationsEnabled ?? true,
        guardianAlertEmail: profile.guardianAlertEmail ?? "",
        timezone: profile.timezone ?? "America/New_York",
      });
    }
  }, [profile]);

  const handleSave = () => {
    updateProfile.mutate({
      data: {
        guardianAlertEmail: formData.guardianAlertEmail,
        notificationsEnabled: formData.notificationsEnabled,
        timezone: formData.timezone,
      }
    }, {
      onSuccess: () => {
        toast({
          title: "Settings saved",
          description: "Your profile preferences have been updated.",
        });
      },
      onError: () => {
        toast({
          title: "Error saving settings",
          description: "There was a problem updating your profile.",
          variant: "destructive"
        });
      }
    });
  };

  if (loadingProfile || loadingStats) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center gap-6 glass-panel p-8 rounded-3xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
        
        <Avatar className="w-24 h-24 border-2 border-white/10 shadow-xl shadow-black/50 relative z-10">
          <AvatarImage src={user?.profileImageUrl ?? undefined} />
          <AvatarFallback className="bg-gradient-to-br from-secondary to-muted text-3xl font-display font-bold">
            {user?.firstName ? user.firstName.charAt(0).toUpperCase() : "U"}
          </AvatarFallback>
        </Avatar>
        
        <div className="relative z-10 flex-1">
          <h1 className="text-3xl font-display font-bold text-foreground">{[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "User Profile"}</h1>
          <p className="text-muted-foreground text-lg">{profile?.email || user?.email || "user@example.com"}</p>
          <div className="mt-2 text-sm text-muted-foreground/70 bg-white/5 inline-block px-3 py-1 rounded-full border border-white/10">
            Member since {profile?.timezone ? profile.timezone : "recently"}
          </div>
        </div>

        <div className="hidden md:flex flex-col items-center justify-center bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 p-4 rounded-2xl relative z-10 shadow-[0_0_30px_rgba(249,115,22,0.15)]">
          <Flame className="w-8 h-8 text-orange-500 mb-1" />
          <span className="text-3xl font-display font-bold text-foreground">{stats?.currentStreak ?? 0}</span>
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Day Streak</span>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col gap-2">
          <Activity className="w-6 h-6 text-primary" />
          <span className="text-3xl font-display font-bold">{stats?.totalReadings ?? 0}</span>
          <span className="text-sm text-muted-foreground">Total Readings</span>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col gap-2">
          <Flame className="w-6 h-6 text-orange-500" />
          <span className="text-3xl font-display font-bold">{stats?.daysTracked ?? 0}</span>
          <span className="text-sm text-muted-foreground">Days Tracked</span>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col gap-2">
          <ShieldAlert className="w-6 h-6 text-warning" />
          <span className="text-3xl font-display font-bold">{stats?.alertsGenerated ?? 0}</span>
          <span className="text-sm text-muted-foreground">Alerts Generated</span>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col gap-2">
          <Link2 className="w-6 h-6 text-accent" />
          <span className="text-3xl font-display font-bold">{stats?.connectedProviders ?? 0}</span>
          <span className="text-sm text-muted-foreground">Connected Devices</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> Family Progress
            </h2>
          </div>
          
          <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
            {stats?.memberProgress && stats.memberProgress.length > 0 ? (
              <div className="divide-y divide-white/5">
                {stats.memberProgress.map((member) => (
                  <div key={member.memberId} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold">
                        {member.memberName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-medium">{member.memberName}</h4>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span>{member.readingCount} readings</span>
                          <span className="w-1 h-1 rounded-full bg-white/20" />
                          <span className={`flex items-center gap-1 ${member.hrvTrend === 'up' ? 'text-success' : member.hrvTrend === 'down' ? 'text-destructive' : ''}`}>
                            HRV {member.hrvTrend === 'up' ? '↑' : member.hrvTrend === 'down' ? '↓' : '→'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${member.status === 'good' ? 'bg-success/10 text-success border-success/30' : member.status === 'warning' ? 'bg-warning/10 text-warning border-warning/30' : 'bg-muted text-muted-foreground border-white/10'}`}>
                        {member.status}
                      </span>
                      {member.alertCount > 0 && (
                        <span className="text-xs text-warning flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" /> {member.alertCount}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                No family members tracked yet.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-display font-bold flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" /> Preferences
          </h2>
          
          <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-foreground">Push Notifications</h4>
                <p className="text-sm text-muted-foreground">Receive alerts for critical health events.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={formData.notificationsEnabled}
                  onChange={(e) => setFormData({...formData, notificationsEnabled: e.target.checked})}
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-foreground flex items-center gap-2 mb-1">
                  <Mail className="w-4 h-4 text-muted-foreground" /> Guardian Alert Email
                </h4>
                <p className="text-sm text-muted-foreground mb-2">Secondary email to notify during critical events.</p>
              </div>
              <input 
                type="email" 
                value={formData.guardianAlertEmail}
                onChange={(e) => setFormData({...formData, guardianAlertEmail: e.target.value})}
                placeholder="doctor or spouse email..."
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-foreground flex items-center gap-2 mb-1">
                  <Globe className="w-4 h-4 text-muted-foreground" /> Timezone
                </h4>
              </div>
              <select 
                value={formData.timezone}
                onChange={(e) => setFormData({...formData, timezone: e.target.value})}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary transition-colors appearance-none"
              >
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
              </select>
            </div>

            <div className="pt-4 border-t border-white/5 flex justify-between items-center">
              <Link href="/providers" className="text-primary hover:text-primary/80 font-medium text-sm transition-colors">
                Manage Data Providers →
              </Link>
              <button 
                onClick={handleSave}
                disabled={updateProfile.isPending}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
