import { useListProviders, useConnectProvider, useDisconnectProvider, useSyncProvider, useListFamilyMembers } from "@workspace/api-client-react";
import { Link2, Link2Off, RefreshCw, Server, Plus, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { formatRelative } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function ProvidersPage() {
  const { data: providers, isLoading: loadingProviders, refetch } = useListProviders();
  const { data: familyMembers } = useListFamilyMembers();
  
  const connectMutation = useConnectProvider();
  const disconnectMutation = useDisconnectProvider();
  const syncMutation = useSyncProvider();
  const { toast } = useToast();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<number | "">("");

  const handleConnectClick = (provider: any) => {
    setSelectedProvider(provider);
    setAuthModalOpen(true);
    if (familyMembers && familyMembers.length > 0) {
      setSelectedMemberId(familyMembers[0].id);
    }
  };

  const handleAuthorize = () => {
    if (!selectedProvider || !selectedMemberId) return;

    connectMutation.mutate({
      provider: selectedProvider.id,
      data: {
        memberId: Number(selectedMemberId)
      }
    }, {
      onSuccess: () => {
        toast({ title: "Provider connected", description: `Successfully connected to ${selectedProvider.name}` });
        setAuthModalOpen(false);
        refetch();
      },
      onError: () => {
        toast({ title: "Connection failed", description: "Could not establish connection.", variant: "destructive" });
      }
    });
  };

  const handleDisconnect = (providerId: string) => {
    disconnectMutation.mutate({ provider: providerId }, {
      onSuccess: () => {
        toast({ title: "Provider disconnected" });
        refetch();
      }
    });
  };

  const handleSync = (providerId: string) => {
    const defaultMemberId = familyMembers?.[0]?.id ?? 1;
    syncMutation.mutate({
      provider: providerId,
      data: { memberId: defaultMemberId }
    }, {
      onSuccess: (data) => {
        toast({ 
          title: "Sync complete", 
          description: `Imported ${data.readingsImported} new readings.` 
        });
        refetch();
      }
    });
  };

  if (loadingProviders) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground tracking-tight flex items-center gap-3">
          <Server className="w-8 h-8 text-primary" /> Data Providers
        </h1>
        <p className="text-muted-foreground text-lg max-w-3xl">
          Connect wearables and health platforms to automatically sync biometrics for your family members. Our AI engine works best with high-frequency data from continuous monitors.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {providers?.map((provider) => {
          const isConnected = provider.status === "connected";
          
          return (
            <div key={provider.id} className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col h-full relative overflow-hidden group">
              {isConnected && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-success/5 rounded-full blur-[50px] pointer-events-none" />
              )}
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl border border-white/10">
                    {provider.id === 'apple-health' ? '🍎' : 
                     provider.id === 'oura' ? '💍' : 
                     provider.id === 'whoop' ? '⚡' : 
                     provider.id === 'garmin' ? '⌚' : '📡'}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg">{provider.name}</h3>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`flex items-center gap-1 ${isConnected ? 'text-success' : 'text-muted-foreground'}`}>
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-white/20'}`} />
                        {isConnected ? 'Connected' : 'Not Connected'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4 flex-1 relative z-10">
                {provider.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-6 relative z-10">
                <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] uppercase font-medium text-foreground/80">
                  {provider.category}
                </span>
                {provider.features.map(metric => (
                  <span key={metric} className="px-2 py-1 rounded bg-primary/10 border border-primary/20 text-[10px] uppercase font-medium text-primary">
                    {metric}
                  </span>
                ))}
              </div>

              {isConnected && (
                <div className="mb-4 text-xs text-muted-foreground bg-black/20 p-2 rounded-lg border border-white/5 relative z-10">
                  <div className="flex justify-between mb-1">
                    <span>Last Sync:</span>
                    <span className="text-foreground">{formatRelative(provider.lastSyncAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Readings:</span>
                    <span className="text-foreground font-medium">{provider.syncedReadings || 0}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-auto relative z-10">
                {isConnected ? (
                  <>
                    <button 
                      onClick={() => handleSync(provider.id)}
                      disabled={syncMutation.isPending}
                      className="flex-1 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg font-medium text-sm transition-colors border border-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} /> Sync
                    </button>
                    <button 
                      onClick={() => handleDisconnect(provider.id)}
                      disabled={disconnectMutation.isPending}
                      className="p-2 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-lg transition-colors border border-destructive/20 disabled:opacity-50"
                      title="Disconnect"
                    >
                      <Link2Off className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => handleConnectClick(provider)}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 text-foreground rounded-lg font-medium text-sm transition-colors border border-white/10 flex items-center justify-center gap-2"
                  >
                    <Link2 className="w-4 h-4" /> Connect
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Auth Modal */}
      <AnimatePresence>
        {authModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setAuthModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="glass-panel w-full max-w-md rounded-3xl border border-white/10 shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 bg-black/20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mx-auto mb-4">
                  {selectedProvider?.id === 'apple-health' ? '🍎' : 
                   selectedProvider?.id === 'oura' ? '💍' : 
                   selectedProvider?.id === 'whoop' ? '⚡' : 
                   selectedProvider?.id === 'garmin' ? '⌚' : '📡'}
                </div>
                <h2 className="text-xl font-display font-bold text-foreground">Connect {selectedProvider?.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">Authorize Vitals Overwatch to access health data</p>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Assign to Family Member</label>
                  <select 
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors appearance-none"
                  >
                    <option value="" disabled>Select member...</option>
                    {familyMembers?.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.relationship})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-primary" /> Requested Permissions
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                      Read Heart Rate and HRV data
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                      Read SpO2 and Respiratory Rate
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                      Read Sleep Stages and Activity
                    </li>
                  </ul>
                </div>
              </div>

              <div className="p-6 border-t border-white/5 flex gap-3">
                <button 
                  onClick={() => setAuthModalOpen(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-foreground rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAuthorize}
                  disabled={!selectedMemberId || connectMutation.isPending}
                  className="flex-1 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center"
                >
                  {connectMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Authorize"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
