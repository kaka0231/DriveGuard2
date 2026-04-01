import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  AlertTriangle, 
  Car, 
  Clock, 
  Activity, 
  ShieldAlert,
  ChevronRight,
  BarChart3,
  LayoutDashboard,
  MapPin,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MOCK_DRIVERS, Driver, DriverBehavior } from './data';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SPEED_LIMIT = 80;
type View = 'dashboard' | 'analytics' | 'fleet';

export default function App() {
  const [drivers, setDrivers] = useState<Driver[]>(MOCK_DRIVERS);
  const [selectedDriverId, setSelectedDriverId] = useState<string>(MOCK_DRIVERS[0].id);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [s3Status, setS3Status] = useState<string>('Connecting to S3...');

  // Fetch Spark Summary from Backend
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetch('/api/driver-summary');
        const result = await response.json();
        if (result.status === 'connected') {
          setS3Status(`Connected: ${result.message}`);
        } else {
          setS3Status('S3 Data Not Found - Using Mock Data');
        }
      } catch (error) {
        setS3Status('S3 Connection Failed - Check Backend Logs');
      }
    };
    fetchSummary();
  }, []);

  // Simulate real-time updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setDrivers(prevDrivers => prevDrivers.map(driver => {
        const newSpeed = Math.max(30, Math.min(120, driver.currentSpeed + (Math.random() * 20 - 10)));
        const newHistory = [
          ...driver.speedHistory.slice(1),
          { 
            timestamp: new Date().toLocaleTimeString(), 
            speed: Math.round(newSpeed) 
          }
        ];
        
        return {
          ...driver,
          currentSpeed: Math.round(newSpeed),
          speedHistory: newHistory
        };
      }));
      setLastUpdate(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const selectedDriver = useMemo(() => 
    drivers.find(d => d.id === selectedDriverId) || drivers[0],
  [drivers, selectedDriverId]);

  const speedingDrivers = useMemo(() => 
    drivers.filter(d => d.currentSpeed > SPEED_LIMIT),
  [drivers]);

  const analyticsData = useMemo(() => {
    return drivers.map(d => ({
      name: d.name,
      overspeed: d.behaviorSummary.overspeedCount,
      fatigue: d.behaviorSummary.fatigueDrivingCount,
      rapid: d.behaviorSummary.rapidlySpeedupCount + d.behaviorSummary.rapidlySlowdownCount
    }));
  }, [drivers]);

  const pieData = useMemo(() => {
    const totalOverspeed = drivers.reduce((acc, d) => acc + d.behaviorSummary.overspeedCount, 0);
    const totalFatigue = drivers.reduce((acc, d) => acc + d.behaviorSummary.fatigueDrivingCount, 0);
    const totalRapid = drivers.reduce((acc, d) => acc + (d.behaviorSummary.rapidlySpeedupCount + d.behaviorSummary.rapidlySlowdownCount), 0);
    
    return [
      { name: 'Overspeed', value: totalOverspeed, color: '#4F46E5' },
      { name: 'Fatigue', value: totalFatigue, color: '#F59E0B' },
      { name: 'Rapid Actions', value: totalRapid, color: '#F43F5E' },
    ];
  }, [drivers]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 z-50 hidden lg:block">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3 text-indigo-600">
            <div className="bg-indigo-600 p-2 rounded-xl">
              <Car className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-bold text-xl tracking-tight text-slate-800">DriveGuard</h1>
          </div>
        </div>
        
        <nav className="p-4 space-y-2">
          <button 
            onClick={() => setCurrentView('dashboard')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
              currentView === 'dashboard' ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          <button 
            onClick={() => setCurrentView('analytics')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
              currentView === 'analytics' ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <BarChart3 className="w-5 h-5" />
            Analytics
          </button>
          <button 
            onClick={() => setCurrentView('fleet')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
              currentView === 'fleet' ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <Activity className="w-5 h-5" />
            Fleet Status
          </button>
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-xl">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">System Status</p>
            <div className="flex items-center gap-2 text-emerald-500">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Live Monitoring Active</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 p-4 lg:p-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">
              {currentView === 'dashboard' && "Fleet Overview"}
              {currentView === 'analytics' && "Safety Analytics"}
              {currentView === 'fleet' && "Fleet Status"}
            </h2>
            <p className="text-slate-500 mt-1">
              {currentView === 'dashboard' && "Real-time driver behavior and safety monitoring"}
              {currentView === 'analytics' && "Comprehensive safety metrics and performance data"}
              {currentView === 'fleet' && "Real-time location and status of all fleet vehicles"}
            </p>
            <div className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-400">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                s3Status.includes('Connected') ? "bg-emerald-500" : "bg-amber-500"
              )} />
              {s3Status}
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
            <div className="px-4 py-2 text-sm font-medium text-slate-600 border-r border-slate-100">
              Last update: {lastUpdate.toLocaleTimeString()}
            </div>
            <div className="px-4 py-2 text-sm font-bold text-indigo-600">
              30s Refresh
            </div>
          </div>
        </header>

        {currentView === 'dashboard' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard 
                title="Total Drivers" 
                value={drivers.length.toString()} 
                icon={<Car className="w-6 h-6" />}
                color="indigo"
              />
              <StatCard 
                title="Active Speeding" 
                value={speedingDrivers.length.toString()} 
                icon={<AlertTriangle className="w-6 h-6" />}
                color={speedingDrivers.length > 0 ? "rose" : "emerald"}
              />
              <StatCard 
                title="Avg Fleet Speed" 
                value={`${Math.round(drivers.reduce((acc, d) => acc + d.currentSpeed, 0) / drivers.length)} km/h`} 
                icon={<Activity className="w-6 h-6" />}
                color="amber"
              />
              <StatCard 
                title="Safety Score" 
                value="94%" 
                icon={<ShieldAlert className="w-6 h-6" />}
                color="emerald"
              />
            </div>

            {/* Real-time Alerts */}
            <AnimatePresence>
              {speedingDrivers.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mb-8 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-4"
                >
                  <div className="bg-rose-500 p-2 rounded-lg text-white">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-rose-900">Critical Speeding Warning</h3>
                    <p className="text-rose-700 text-sm">
                      {speedingDrivers.map(d => `${d.name} (${d.carPlate})`).join(', ')} currently exceeding speed limit of {SPEED_LIMIT} km/h.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Summary Table */}
              <section className="xl:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-lg text-slate-800">Driver Behavior Summary</h3>
                  <button className="text-indigo-600 text-sm font-semibold hover:underline">Export Report</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                        <th className="px-6 py-4">Driver / Plate</th>
                        <th className="px-6 py-4">Overspeed (Count/Time)</th>
                        <th className="px-6 py-4">Fatigue Events</th>
                        <th className="px-6 py-4">Rapid Speedup/Slowdown</th>
                        <th className="px-6 py-4">Neutral Slide (Time)</th>
                        <th className="px-6 py-4">Throttle/Oil Status</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {drivers.map((driver) => (
                        <tr 
                          key={driver.id} 
                          onClick={() => setSelectedDriverId(driver.id)}
                          className={cn(
                            "hover:bg-slate-50 transition-colors cursor-pointer group",
                            selectedDriverId === driver.id && "bg-indigo-50/30"
                          )}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                                {driver.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-800">{driver.name}</div>
                                <div className="text-xs text-slate-500">{driver.carPlate}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className={cn(
                                "px-2 py-1 rounded-md text-xs font-bold w-fit",
                                driver.behaviorSummary.overspeedCount > 20 ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-600"
                              )}>
                                {driver.behaviorSummary.overspeedCount} times
                              </span>
                              <span className="text-[10px] text-slate-500 mt-1">
                                {Math.floor(driver.behaviorSummary.totalOverspeedTime / 60)}m {driver.behaviorSummary.totalOverspeedTime % 60}s
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2 py-1 rounded-md text-xs font-bold",
                              driver.behaviorSummary.fatigueDrivingCount > 0 ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-600"
                            )}>
                              {driver.behaviorSummary.fatigueDrivingCount}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <span className="px-2 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-600">
                                ↑{driver.behaviorSummary.rapidlySpeedupCount}
                              </span>
                              <span className="px-2 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-600">
                                ↓{driver.behaviorSummary.rapidlySlowdownCount}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                            {Math.floor(driver.behaviorSummary.neutralSlideTime / 60)}m {driver.behaviorSummary.neutralSlideTime % 60}s
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <span className={cn(
                                "text-[10px] font-bold uppercase",
                                driver.behaviorSummary.hThrottleStopCount > 5 ? "text-rose-500" : "text-slate-400"
                              )}>
                                Throttle Stop: {driver.behaviorSummary.hThrottleStopCount}
                              </span>
                              {driver.behaviorSummary.oilLeakDetected && (
                                <span className="text-[10px] font-bold text-rose-600 uppercase flex items-center gap-1">
                                  <div className="w-1 h-1 bg-rose-600 rounded-full" />
                                  Oil Leak
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className={cn(
                              "w-2.5 h-2.5 rounded-full",
                              driver.currentSpeed > SPEED_LIMIT ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
                            )} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Real-time Visualization */}
              <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">Speed Monitoring</h3>
                    <p className="text-sm text-slate-500">Live data for {selectedDriver.name}</p>
                  </div>
                  <div className={cn(
                    "px-4 py-2 rounded-2xl font-bold text-2xl",
                    selectedDriver.currentSpeed > SPEED_LIMIT ? "bg-rose-100 text-rose-600" : "bg-indigo-100 text-indigo-600"
                  )}>
                    {selectedDriver.currentSpeed} <span className="text-xs font-medium">km/h</span>
                  </div>
                </div>

                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedDriver.speedHistory}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis 
                        dataKey="timestamp" 
                        hide 
                      />
                      <YAxis 
                        domain={[0, 140]} 
                        stroke="#94A3B8" 
                        fontSize={12} 
                        tickFormatter={(v) => `${v}`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '16px', 
                          border: 'none', 
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="speed" 
                        stroke={selectedDriver.currentSpeed > SPEED_LIMIT ? "#F43F5E" : "#4F46E5"} 
                        strokeWidth={3} 
                        dot={false}
                        animationDuration={1000}
                      />
                      {/* Speed Limit Line */}
                      <Line 
                        type="monotone" 
                        dataKey={() => SPEED_LIMIT} 
                        stroke="#F43F5E" 
                        strokeDasharray="5 5" 
                        strokeWidth={1} 
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-slate-400" />
                      <span className="text-sm font-medium text-slate-600">Avg Speed (Last 10m)</span>
                    </div>
                    <span className="font-bold text-slate-800">
                      {Math.round(selectedDriver.speedHistory.reduce((acc, h) => acc + h.speed, 0) / selectedDriver.speedHistory.length)} km/h
                    </span>
                  </div>
                  
                  <div className="p-4 border border-slate-100 rounded-2xl">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Driver Profile</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500">License Plate</p>
                        <p className="font-bold text-slate-800">{selectedDriver.carPlate}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Experience</p>
                        <p className="font-bold text-slate-800">8 Years</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </motion.div>
        )}

        {currentView === 'analytics' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Behavior Distribution */}
              <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  Incident Distribution
                </h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* Driver Performance Comparison */}
              <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Driver Incident Comparison
                </h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} />
                      <YAxis stroke="#94A3B8" fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="overspeed" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Overspeed" />
                      <Bar dataKey="fatigue" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Fatigue" />
                      <Bar dataKey="rapid" fill="#F43F5E" radius={[4, 4, 0, 0]} name="Rapid Actions" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>

            {/* Safety Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-lg shadow-indigo-200">
                <h4 className="text-indigo-100 font-medium mb-1">Fleet Safety Rating</h4>
                <div className="text-4xl font-bold mb-4">A+</div>
                <p className="text-sm text-indigo-100">98% of drivers are within safe operating parameters this week.</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200">
                <h4 className="text-slate-500 font-medium mb-1">Total Distance Monitored</h4>
                <div className="text-3xl font-bold text-slate-800 mb-4">12,482 km</div>
                <div className="flex items-center gap-2 text-emerald-500 text-sm font-bold">
                  <TrendingUp className="w-4 h-4" />
                  +12% from last month
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200">
                <h4 className="text-slate-500 font-medium mb-1">Fuel Efficiency Impact</h4>
                <div className="text-3xl font-bold text-slate-800 mb-4">-15%</div>
                <p className="text-sm text-slate-500">Reduction in fuel waste due to improved neutral slide management.</p>
              </div>
            </div>
          </motion.div>
        )}

        {currentView === 'fleet' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drivers.map(driver => (
              <div key={driver.id} className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 font-bold text-xl">
                      {driver.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{driver.name}</h3>
                      <p className="text-xs text-slate-500">{driver.carPlate}</p>
                    </div>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5",
                    driver.currentSpeed > SPEED_LIMIT ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
                  )}>
                    {driver.currentSpeed > SPEED_LIMIT ? (
                      <><XCircle className="w-3 h-3" /> Speeding</>
                    ) : (
                      <><CheckCircle2 className="w-3 h-3" /> Normal</>
                    )}
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Last Location
                    </span>
                    <span className="font-medium text-slate-800">District {Math.floor(Math.random() * 10) + 1}, HK</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Current Speed
                    </span>
                    <span className="font-bold text-slate-800">{driver.currentSpeed} km/h</span>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setSelectedDriverId(driver.id);
                    setCurrentView('dashboard');
                  }}
                  className="w-full py-3 bg-slate-50 hover:bg-indigo-600 hover:text-white text-slate-600 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                >
                  View Live Dashboard
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: string, icon: React.ReactNode, color: string }) {
  const colorClasses: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600",
    rose: "bg-rose-50 text-rose-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-4">
      <div className={cn("p-4 rounded-2xl", colorClasses[color])}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}
