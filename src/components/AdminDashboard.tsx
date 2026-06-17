import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sprout,
  Users,
  ShoppingBag,
  TrendingUp,
  ClipboardList,
  Trash2,
  Check,
  X,
  MapPin,
  Phone,
  Layers,
  Award,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Search,
  Filter
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { CropProduct, Order, FarmerProfile, BuyerProfile } from '../types';

interface AdminDashboardProps {
  farmers: FarmerProfile[];
  buyers: BuyerProfile[];
  crops: CropProduct[];
  orders: Order[];
  onUpdateCrops: (updatedCrops: CropProduct[]) => void;
  onUpdateOrders: (updatedOrders: Order[]) => void;
  onLogout: () => void;
}

export default function AdminDashboard({
  farmers,
  buyers,
  crops,
  orders,
  onUpdateCrops,
  onUpdateOrders,
  onLogout
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'crops' | 'farmers' | 'buyers' | 'orders'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Compute platform metrics
  const stats = useMemo(() => {
    const totalFarmers = farmers.length;
    const totalBuyers = buyers.length;
    const totalCrops = crops.length;
    const totalOrdersCount = orders.length;

    // Sum total completed or ready for pickup orders
    const totalSales = orders
      .filter(o => ['Completed', 'Ready for Pickup', 'Delivered'].includes(o.status))
      .reduce((sum, o) => sum + o.total, 0);

    return {
      totalFarmers,
      totalBuyers,
      totalCrops,
      totalOrdersCount,
      totalSales
    };
  }, [farmers, buyers, crops, orders]);

  // Chart data 1: Category Distribution
  const categoryChartData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    crops.forEach(c => {
      counts[c.category] = (counts[c.category] || 0) + 1;
    });
    return Object.keys(counts).map(cat => ({
      name: cat,
      value: counts[cat]
    }));
  }, [crops]);

  // Chart data 2: Order Status distribution
  const statusPieData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    orders.forEach(o => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return Object.keys(counts).map(st => ({
      name: st,
      value: counts[st]
    }));
  }, [orders]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];

  // Moderate / Delete a crop listing
  const handleDeleteCrop = (cropId: string) => {
    if (window.confirm('Are you sure you want to remove this crop listing from the marketplace?')) {
      const updated = crops.filter(c => c.id !== cropId);
      onUpdateCrops(updated);
    }
  };

  // Moderate / Cancel an order
  const handleCancelOrder = (orderId: string) => {
    if (window.confirm('Are you sure you want to cancel this order as an administrator?')) {
      const updated = orders.map(o => o.id === orderId ? { ...o, status: 'Declined' as const } : o);
      onUpdateOrders(updated);
    }
  };

  // Filter listings based on select criteria
  const filteredCrops = useMemo(() => {
    return crops.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            c.farmName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.farmerName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || c.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [crops, searchQuery, categoryFilter]);

  const filteredFarmers = useMemo(() => {
    return farmers.filter(f => 
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.farmName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.location && f.location.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [farmers, searchQuery]);

  const filteredBuyers = useMemo(() => {
    return buyers.filter(b => 
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.deliveryAddress && b.deliveryAddress.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [buyers, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Platform Administration Top Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-widest text-slate-400 font-mono">SUPREME CONSOLE</h1>
              <span className="text-xl font-black text-white">Farmer Direct Admin</span>
            </div>
          </div>
          
          <button
            onClick={onLogout}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-850 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20 text-xs font-semibold text-slate-300 hover:text-red-400 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Terminate Session</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Navigation Tab Pills */}
        <div className="flex flex-wrap gap-2 mb-8 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-900 max-w-2xl">
          <button
            onClick={() => { setActiveTab('overview'); setSearchQuery(''); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
              activeTab === 'overview' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/15' : 'text-slate-400 hover:text-white'
            }`}
          >
            Overview Metrics
          </button>
          <button
            onClick={() => { setActiveTab('crops'); setSearchQuery(''); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
              activeTab === 'crops' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/15' : 'text-slate-400 hover:text-white'
            }`}
          >
            Crops Directory ({crops.length})
          </button>
          <button
            onClick={() => { setActiveTab('farmers'); setSearchQuery(''); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
              activeTab === 'farmers' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/15' : 'text-slate-400 hover:text-white'
            }`}
          >
            Farmer Partners ({farmers.length})
          </button>
          <button
            onClick={() => { setActiveTab('buyers'); setSearchQuery(''); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
              activeTab === 'buyers' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/15' : 'text-slate-400 hover:text-white'
            }`}
          >
            Buyer Members ({buyers.length})
          </button>
          <button
            onClick={() => { setActiveTab('orders'); setSearchQuery(''); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
              activeTab === 'orders' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/15' : 'text-slate-400 hover:text-white'
            }`}
          >
            Platform Orders ({orders.length})
          </button>
        </div>

        {/* 1. OVERVIEW VIEW */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Stats bento layout */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3 text-slate-400">
                    <span className="text-[10px] font-mono tracking-widest font-bold">TOTAL REVENUE</span>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-black text-white">₹{stats.totalSales.toLocaleString('en-IN')}</h3>
                  <p className="text-[10px] text-emerald-400 font-mono mt-1">Completed cycle sales</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3 text-slate-400">
                    <span className="text-[10px] font-mono tracking-widest font-bold">CROP LISTINGS</span>
                    <Sprout className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-black text-white">{stats.totalCrops}</h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">Active global catalogs</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3 text-slate-400">
                    <span className="text-[10px] font-mono tracking-widest font-bold">AGRICULTURISTS</span>
                    <Users className="w-4 h-4 text-sky-400" />
                  </div>
                  <h3 className="text-2xl font-black text-white">{stats.totalFarmers}</h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">Verified farm heads</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3 text-slate-400">
                    <span className="text-[10px] font-mono tracking-widest font-bold">SUBSCRIBED BUYERS</span>
                    <Users className="w-4 h-4 text-amber-400" />
                  </div>
                  <h3 className="text-2xl font-black text-white">{stats.totalBuyers}</h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">Consumers & kitchens</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3 text-slate-400">
                    <span className="text-[10px] font-mono tracking-widest font-bold">orders ENGINE</span>
                    <ShoppingBag className="w-4 h-4 text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-black text-white">{stats.totalOrdersCount}</h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">Platform checkouts</p>
                </div>
              </div>

              {/* Graphical Analysis with Recharts */}
              <div className="grid md:grid-cols-2 gap-8">
                {/* Crop Categories Distribution graph */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-sm font-extrabold tracking-widest font-mono text-slate-400 uppercase mb-6">Crop Category Breakdown</h3>
                  <div className="h-64">
                    {categoryChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryChartData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          >
                            {categoryChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">NO ACTIVE CATALOGS DATA FOUND</div>
                    )}
                  </div>
                </div>

                {/* Orders Status Ratio Map graph */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-sm font-extrabold tracking-widest font-mono text-slate-400 uppercase mb-6">Execution Pipeline Status</h3>
                  <div className="h-64">
                    {statusPieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name }) => name}
                          >
                            {statusPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">NO PLATFORM ORDERS RECORDED</div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 2. CROPS TAB */}
          {activeTab === 'crops' && (
            <motion.div
              key="crops-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Search & Filter tools */}
              <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-slate-900 border border-slate-850 p-4 rounded-2xl">
                <div className="relative w-full md:max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search crops, farms, or grower key..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 pl-11 pr-4 py-2.5 rounded-xl border border-slate-800 text-xs focus:outline-none focus:border-emerald-500 text-white font-mono"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs font-mono text-slate-300"
                  >
                    <option value="All">All Categories</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Grains">Grains</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Organic Products">Organic Products</option>
                    <option value="Spices">Spices</option>
                  </select>
                </div>
              </div>

              {/* Table listings */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      <th className="py-4 px-6">Product Details</th>
                      <th className="py-4 px-6">Origin Farm</th>
                      <th className="py-4 px-6">Category</th>
                      <th className="py-4 px-6">Metrics & Pricing</th>
                      <th className="py-4 px-6 text-right">Moderations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-xs font-sans">
                    {filteredCrops.length > 0 ? (
                      filteredCrops.map(c => (
                        <tr key={c.id} className="hover:bg-slate-850/50">
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3.5">
                              {c.image && (
                                <img src={c.image} alt={c.name} className="w-10 h-10 rounded-lg object-cover border border-slate-850" referrerPolicy="no-referrer" />
                              )}
                              <div>
                                <h4 className="font-bold text-white text-sm">{c.name}</h4>
                                <span className="text-[10px] font-mono text-slate-500">ID: {c.id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-medium text-slate-200 block">{c.farmName}</span>
                            <span className="text-[10px] text-slate-500 font-mono">By: {c.farmerName}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-slate-800 text-emerald-400 border border-slate-700">{c.category}</span>
                          </td>
                          <td className="py-4 px-6 font-mono">
                            <div className="text-white font-bold">₹{c.price} / {c.unit}</div>
                            <div className="text-[10px] text-slate-500">Stock Available: {c.stock || 0} {c.unit}</div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => handleDeleteCrop(c.id)}
                              className="p-2 bg-slate-950 text-slate-400 hover:text-red-400 border border-slate-850 hover:border-red-900/40 rounded-xl transition-all cursor-pointer"
                              title="Delete Crop Listing"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-xs text-slate-500 font-mono">No matching crops listings found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* 3. FARMERS TAB */}
          {activeTab === 'farmers' && (
            <motion.div
              key="farmers-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="relative w-full max-w-md bg-slate-900 border border-slate-850 p-3 rounded-2xl">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Query verified farmers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 pl-11 pr-4 py-2 rounded-xl border border-slate-800 text-xs focus:outline-none focus:border-emerald-500 text-white font-mono"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {filteredFarmers.length > 0 ? (
                  filteredFarmers.map(f => (
                    <div key={f.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
                      <div className="flex items-center space-x-3 mb-4">
                        {f.photo ? (
                          <img src={f.photo} alt={f.name} className="w-12 h-12 rounded-full object-cover border border-slate-800" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-sm font-bold">
                            {f.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h4 className="font-extrabold text-white text-sm">{f.name}</h4>
                          <span className="text-[10px] text-slate-500 font-mono">Farmer ID: {f.id}</span>
                        </div>
                      </div>

                      <div className="space-y-3.5 border-t border-slate-850 pt-4 text-xs">
                        <div className="flex items-center space-x-2 text-slate-300">
                          <Award className="w-4 h-4 text-emerald-400" />
                          <span className="font-bold">{f.farmName}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-slate-400">
                          <MapPin className="w-4 h-4 text-slate-500" />
                          <span>{f.village || f.location || 'Visakhapatnam'}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-slate-400">
                          <Phone className="w-4 h-4 text-slate-500" />
                          <span>{f.mobileNumber || f.contact || 'No contact'}</span>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-850 flex justify-between items-center text-[10px] font-mono text-slate-500">
                        <span>ESTD: {f.createdAt ? new Date(f.createdAt).toLocaleDateString() : 'Platform Seed'}</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase font-bold">VERIFIED</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 text-xs text-slate-500 font-mono">No matching farmer profiles detected.</div>
                )}
              </div>
            </motion.div>
          )}

          {/* 4. BUYERS TAB */}
          {activeTab === 'buyers' && (
            <motion.div
              key="buyers-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="relative w-full max-w-md bg-slate-900 border border-slate-850 p-3 rounded-2xl">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Query registered buyer members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 pl-11 pr-4 py-2 rounded-xl border border-slate-800 text-xs focus:outline-none focus:border-emerald-500 text-white font-mono"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {filteredBuyers.length > 0 ? (
                  filteredBuyers.map(b => (
                    <div key={b.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-11 h-11 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-400 text-xs font-bold">
                          {b.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-white text-sm">{b.name}</h4>
                          <span className="text-[10px] text-slate-500 font-mono">Buyer ID: {b.id}</span>
                        </div>
                      </div>

                      <div className="space-y-3.5 border-t border-slate-850 pt-4 text-xs">
                        <div className="flex items-start space-x-2 text-slate-400">
                          <MapPin className="w-4 h-11 text-slate-500 shrink-0" />
                          <span className="line-clamp-2">{b.deliveryAddress || 'No Address Listed'}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-slate-400">
                          <Phone className="w-4 h-4 text-slate-500" />
                          <span>{b.contact || 'No contact numbers'}</span>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-850 text-[10px] font-mono text-slate-500 flex justify-between items-center">
                        <span>REGISTERED: {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'Platform Seed'}</span>
                        <span className="text-sky-400 font-bold">ACTIVE BUYER</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 text-xs text-slate-500 font-mono">No matching buyer/customer records detected.</div>
                )}
              </div>
            </motion.div>
          )}

          {/* 5. ORDERS TAB */}
          {activeTab === 'orders' && (
            <motion.div
              key="orders-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      <th className="py-4 px-6">OrderID / Date</th>
                      <th className="py-4 px-6">Cart Items</th>
                      <th className="py-4 px-6">Delivery Details</th>
                      <th className="py-4 px-6">Status / pipeline</th>
                      <th className="py-4 px-6 text-right">Moderations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-xs font-sans">
                    {orders.length > 0 ? (
                      orders.map(o => (
                        <tr key={o.id} className="hover:bg-slate-850/50">
                          <td className="py-4 px-6 font-mono">
                            <span className="text-white font-bold block">{o.id}</span>
                            <span className="text-[10px] text-slate-500">{new Date(o.date).toLocaleDateString() || 'Fresh check'}</span>
                            <span className="text-white font-bold text-xs block mt-1">₹{o.total}</span>
                          </td>
                          <td className="py-4 px-6 max-w-xs">
                            <div className="space-y-1">
                              {o.items.map((it, idx) => (
                                <div key={idx} className="flex justify-between text-slate-300">
                                  <span>{it.productName} (x{it.quantity})</span>
                                  <span className="font-mono text-[10px] text-slate-500">₹{it.price}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="max-w-xs truncate text-slate-300 font-medium">{o.deliveryAddress}</div>
                            <div className="text-[10px] text-slate-500 font-mono">Name: {o.buyerName || o.consumerName || 'Market Buyer'}</div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              o.status === 'Completed' || o.status === 'Delivered'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : o.status === 'Pending'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : o.status === 'Declined'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            {['Pending', 'Accepted'].includes(o.status) && (
                              <button
                                onClick={() => handleCancelOrder(o.id)}
                                className="px-3 py-1.5 bg-slate-950 text-red-400 hover:bg-red-500/10 hover:text-red-300 border border-slate-850 hover:border-red-900/40 rounded-xl transition-all cursor-pointer font-semibold font-mono"
                              >
                                Cancel Order
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-xs text-slate-500 font-mono">No checkout orders registered yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
