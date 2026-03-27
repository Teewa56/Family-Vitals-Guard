import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot } from "recharts";
import { useAuth } from "@workspace/replit-auth-web";
import { Shield, Clock, FileText, Activity, Watch, BrainCircuit, ArrowRight, HeartPulse } from "lucide-react";

const demoData = [
  { time: "-72h", hrv: 68 },
  { time: "-48h", hrv: 65 },
  { time: "-24h", hrv: 58 },
  { time: "-12h", hrv: 51 },
  { time: "Now", hrv: 45 },
  { time: "+12h", hrv: 38, isForecast: true },
  { time: "+24h", hrv: 32, isForecast: true },
  { time: "+36h", hrv: 28, isForecast: true },
  { time: "+48h", hrv: 25, isForecast: true },
];

export default function LandingPage() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 p-6 z-50 flex items-center justify-between backdrop-blur-md bg-background/50 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <Activity className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-foreground">Vitals Overwatch</span>
        </div>
        <button 
          onClick={() => login()}
          className="px-6 py-2 rounded-full bg-white/5 hover:bg-white/10 text-foreground font-medium transition-all border border-white/10"
        >
          Sign In
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-24 pb-12 px-4">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-accent/20 rounded-full blur-[150px] mix-blend-screen" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-semibold tracking-wider uppercase mb-6 inline-block">
              AI Health Intelligence
            </span>
            <h1 className="text-5xl md:text-7xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50 tracking-tight leading-tight">
              Your Family's Health, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Predicted Before It Happens.</span>
            </h1>
          </motion.div>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Continuously monitor wearables. Detect invisible anomalies. Get AI-powered alerts 48 hours before symptoms appear.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <button 
              onClick={() => login()}
              className="px-8 py-4 w-full sm:w-auto rounded-full bg-primary text-primary-foreground font-bold text-lg hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] transition-all flex items-center justify-center gap-2 group"
            >
              Get Started <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 w-full sm:w-auto rounded-full bg-white/5 text-foreground font-medium text-lg hover:bg-white/10 border border-white/10 transition-all"
            >
              See How It Works
            </button>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 border-y border-white/5 bg-black/40 backdrop-blur-sm relative z-10">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
          <div className="py-4 md:py-0">
            <motion.div initial={{ scale: 0.5, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} className="text-4xl font-display font-bold text-primary mb-2">48hrs</motion.div>
            <div className="text-muted-foreground font-medium uppercase tracking-wider text-sm">Early Warning</div>
          </div>
          <div className="py-4 md:py-0">
            <motion.div initial={{ scale: 0.5, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-4xl font-display font-bold text-foreground mb-2">4</motion.div>
            <div className="text-muted-foreground font-medium uppercase tracking-wider text-sm">Family Members Avg</div>
          </div>
          <div className="py-4 md:py-0">
            <motion.div initial={{ scale: 0.5, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="text-4xl font-display font-bold text-accent mb-2">99.7%</motion.div>
            <div className="text-muted-foreground font-medium uppercase tracking-wider text-sm">SpO2 Tracked</div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="how-it-works" className="py-24 px-4 relative z-10">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground">Biometric Time-Travel</h2>
            <p className="text-xl text-muted-foreground">Our AI analyzes thousands of data points from your wearables to forecast health events before you feel them.</p>
          </div>

          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-destructive/10 rounded-full blur-[100px]" />
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="space-y-1">
                <h3 className="text-2xl font-display font-bold flex items-center gap-2">
                  <BrainCircuit className="text-primary" /> Heart Rate Variability Forecast
                </h3>
                <p className="text-muted-foreground">Predicting significant drop in 48 hours</p>
              </div>
              <div className="px-4 py-2 bg-destructive/20 border border-destructive/50 text-destructive rounded-xl font-bold flex items-center gap-2 animate-pulse">
                Infection Risk: 71%
              </div>
            </div>

            <div className="h-[400px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={demoData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHrv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} domain={[20, 80]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <ReferenceLine x="Now" stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" label={{ position: 'top', value: 'Now', fill: 'hsl(var(--muted-foreground))' }} />
                  <Area 
                    type="monotone" 
                    dataKey="hrv" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorHrv)" 
                    activeDot={{ r: 8, fill: "hsl(var(--primary))" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-black/40 px-4 relative z-10 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground">Everything you need to protect them</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Activity, title: "Unified Family Dashboard", desc: "A single view of everyone's biometrics, synced automatically from their devices." },
              { icon: Shield, title: "Guardian View", desc: "Specialized monitoring mode for elderly or high-risk relatives with instant alerts." },
              { icon: BrainCircuit, title: "Biometric Time-Travel", desc: "Our killer feature. AI predicts health events 48 hours before symptoms hit." },
              { icon: FileText, title: "Clinical Reports", desc: "Generate physician-ready PDF reports with baseline analysis for doctor visits." },
              { icon: HeartPulse, title: "Smart Anomaly Detection", desc: "Learns each person's unique baseline and flags when they deviate significantly." },
              { icon: Watch, title: "Multi-Device Support", desc: "Connect Apple Watch, Oura Ring, Whoop, Garmin, and more seamlessly." }
            ].map((feat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-panel p-8 rounded-3xl border border-white/5 hover:border-primary/30 transition-all hover:-translate-y-2 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feat.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-display font-bold mb-3">{feat.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 relative z-10">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-panel p-8 rounded-3xl border border-white/5 space-y-6">
              <div className="flex text-primary gap-1">★★★★★</div>
              <p className="text-lg italic text-muted-foreground">"It predicted my son's flu two days before he had a fever. We were able to rest him early instead of sending him to practice."</p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold">SM</div>
                <div>
                  <div className="font-bold">Sarah M.</div>
                  <div className="text-sm text-muted-foreground">Parent of 2</div>
                </div>
              </div>
            </div>
            <div className="glass-panel p-8 rounded-3xl border border-white/5 space-y-6">
              <div className="flex text-primary gap-1">★★★★★</div>
              <p className="text-lg italic text-muted-foreground">"The Guardian View gives me peace of mind for my 82-year-old mother living alone. The alerts are incredibly accurate."</p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold">DR</div>
                <div>
                  <div className="font-bold">David R.</div>
                  <div className="text-sm text-muted-foreground">Monitoring Parent</div>
                </div>
              </div>
            </div>
            <div className="glass-panel p-8 rounded-3xl border border-white/5 space-y-6">
              <div className="flex text-primary gap-1">★★★★★</div>
              <p className="text-lg italic text-muted-foreground">"As a physician, the baseline reports are exactly what I wish all my patients brought to their visits."</p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold">JL</div>
                <div>
                  <div className="font-bold">Dr. James L.</div>
                  <div className="text-sm text-muted-foreground">Primary Care</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-4 relative z-10 border-t border-white/5 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-4xl md:text-6xl font-display font-bold">Take Control of Your Family's Health Today</h2>
          <p className="text-xl text-muted-foreground">Join thousands of families using AI to predict and prevent health issues before they escalate.</p>
          <button 
            onClick={() => login()}
            className="px-10 py-5 rounded-full bg-primary text-primary-foreground font-bold text-xl hover:scale-105 transition-transform inline-flex items-center gap-3 shadow-[0_0_40px_rgba(34,211,238,0.3)]"
          >
            Start Monitoring Now <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </section>
    </div>
  );
}
