import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sprout,
  TrendingUp,
  Package,
  ClipboardList,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  AlertTriangle,
  LogOut,
  MapPin,
  Tag,
  DollarSign,
  Layers,
  Star,
  RefreshCw,
  ShoppingBag,
  Clock,
  Phone,
  MessageSquare
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CropProduct, Order, OrderStatus, FarmerProfile, CropCategory, FarmerFeedback } from '../types';
import { CROP_PRESETS } from '../data';

interface FarmerDashboardProps {
  currentFarmer: FarmerProfile;
  crops: CropProduct[];
  orders: Order[];
  feedbacks: FarmerFeedback[];
  onUpdateCrops: (updatedCrops: CropProduct[]) => void;
  onUpdateOrders: (updatedOrders: Order[]) => void;
  onLogout: () => void;
}

function isProductRelatedToCrops(productName: string, productCategory: string, selectedCrops: string[]): boolean {
  if (!selectedCrops || selectedCrops.length === 0) return true; // Show all if no selection exists
  return selectedCrops.some(crop => {
    const c = crop.toLowerCase();
    const p = productName.toLowerCase();
    const cat = productCategory.toLowerCase();
    
    // Check if crop matches names or parts of names
    if (c === 'other') return true; 
    if (p.includes(c)) return true;
    if (cat.includes(c)) return true;
    
    // Plural rules and variant spelling forms
    if (c === 'tomato' && p.includes('tomatoes')) return true;
    if (c === 'potato' && p.includes('potatoes')) return true;
    if (c === 'chilli' && (p.includes('chili') || p.includes('chillies') || p.includes('chilles'))) return true;
    if (c === 'mango' && p.includes('mangoes')) return true;
    if (c === 'banana' && p.includes('bananas')) return true;
    
    return false;
  });
}

export default function FarmerDashboard({
  currentFarmer,
  crops,
  orders,
  feedbacks,
  onUpdateCrops,
  onUpdateOrders,
  onLogout
}: FarmerDashboardProps) {
  // Navigation: 'analytics' | 'inventory' | 'orders' | 'reviews'
  const [activeTab, setActiveTab] = useState<'analytics' | 'inventory' | 'orders' | 'reviews'>('analytics');

  // Crop Form States
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [editingCropId, setEditingCropId] = useState<string | null>(null);
  const [cropForm, setCropForm] = useState({
    name: '',
    category: 'Vegetables' as CropCategory,
    price: 0,
    unit: 'lb',
    stock: 0,
    status: 'Live' as 'Draft' | 'Live' | 'Sold Out',
    image: CROP_PRESETS[0].image,
    description: ''
  });

  // Filter states
  const [invFilter, setInvFilter] = useState<'All' | 'Live' | 'Draft' | 'Sold Out' | 'Low Stock'>('All');

  // Multi-Step / Custom Preset Picker
  const [showPresetPicker, setShowPresetPicker] = useState(true);

  // Filter crops belonging to this farmer
  const farmerCrops = useMemo(() => {
    const base = crops.filter(c => c.farmerId === currentFarmer.id);
    if (!currentFarmer.selectedCrops || currentFarmer.selectedCrops.length === 0) {
      return base;
    }
    return base.filter(c => isProductRelatedToCrops(c.name, c.category, currentFarmer.selectedCrops || []));
  }, [crops, currentFarmer.id, currentFarmer.selectedCrops]);

  // Filter orders containing items from this farmer
  // An order belongs to a farmer if at least one item is from this farmer
  const farmerOrders = useMemo(() => {
    return orders.filter(o => o.items.some(item => item.farmerId === currentFarmer.id));
  }, [orders, currentFarmer.id]);

  const farmerFeedbacks = useMemo(() => {
    return feedbacks.filter(f => f.farmerId === currentFarmer.id);
  }, [feedbacks, currentFarmer.id]);

  // Calculations for Earnings & Metrics
  const metrics = useMemo(() => {
    let totalEarnings = 0;
    let pendingFulfillmentCount = 0;
    let lowStockCount = 0;

    farmerCrops.forEach(c => {
      if (c.stock < 10 && c.status === 'Live') lowStockCount++;
    });

    farmerOrders.forEach(o => {
      if (o.status !== 'Declined') {
        const orderFarmerTotal = o.items
          .filter(item => item.farmerId === currentFarmer.id)
          .reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        if (o.status === 'Delivered') {
          totalEarnings += orderFarmerTotal;
        } else if (o.status !== 'Declined') {
          pendingFulfillmentCount++;
        }
      }
    });

    const averageRating = farmerFeedbacks.length > 0 
      ? (farmerFeedbacks.reduce((sum, f) => sum + f.rating, 0) / farmerFeedbacks.length).toFixed(1)
      : '5.0';

    return { totalEarnings, pendingFulfillmentCount, lowStockCount, averageRating };
  }, [farmerCrops, farmerOrders, farmerFeedbacks, currentFarmer.id]);

  // Recharts Category Analytics
  const categoryChartData = useMemo(() => {
    const dataMap: Record<string, number> = {};
    
    // Accumulate actual sales from delivered orders
    farmerOrders.forEach(o => {
      if (o.status === 'Delivered') {
        o.items.forEach(item => {
          if (item.farmerId === currentFarmer.id) {
            // Find corresponding category from product
            const originalProduct = crops.find(p => p.id === item.productId);
            const category = originalProduct ? originalProduct.category : 'Greenhouse';
            dataMap[category] = (dataMap[category] || 0) + (item.price * item.quantity);
          }
        });
      }
    });

    // Fallback/Seed values for visualization if no sales have occurred yet
    const categories: CropCategory[] = ['Vegetables', 'Fruits', 'Grains', 'Dairy', 'Poultry'];
    return categories.map(cat => ({
      name: cat,
      sales: Number((dataMap[cat] || 0).toFixed(2)),
      listings: farmerCrops.filter(c => c.category === cat).length
    }));
  }, [farmerOrders, farmerCrops, currentFarmer.id, crops]);

  const COLORS = ['#10b981', '#059669', '#047857', '#065f46', '#064e3b', '#34d399'];

  // CRUD Crop Listings Operations
  const handleOpenAddModal = () => {
    setEditingCropId(null);
    setCropForm({
      name: '',
      category: 'Vegetables' as CropCategory,
      price: 2.99,
      unit: 'lb',
      stock: 50,
      status: 'Live',
      image: CROP_PRESETS[0].image,
      description: ''
    });
    setShowPresetPicker(true);
    setIsCropModalOpen(true);
  };

  const handleOpenEditModal = (crop: CropProduct) => {
    setEditingCropId(crop.id);
    setCropForm({
      name: crop.name,
      category: crop.category,
      price: crop.price,
      unit: crop.unit,
      stock: crop.stock,
      status: crop.status,
      image: crop.image,
      description: crop.description
    });
    setShowPresetPicker(false);
    setIsCropModalOpen(true);
  };

  const handleApplyPreset = (preset: typeof CROP_PRESETS[number]) => {
    setCropForm(prev => ({
      ...prev,
      name: preset.name,
      category: preset.category,
      price: preset.defaultPrice,
      unit: preset.defaultUnit,
      image: preset.image
    }));
    setShowPresetPicker(false);
  };

  const handleSaveCrop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cropForm.name || cropForm.price <= 0 || cropForm.stock < 0) {
      alert('Please check validity of name, price, and stock quantity.');
      return;
    }

    let updatedList: CropProduct[];

    if (editingCropId) {
      // Edit mode
      updatedList = crops.map(c => {
        if (c.id === editingCropId) {
          return {
            ...c,
            name: cropForm.name,
            category: cropForm.category,
            price: Number(cropForm.price),
            unit: cropForm.unit,
            stock: Number(cropForm.stock),
            quantity: Number(cropForm.stock),
            status: cropForm.stock === 0 ? 'Sold Out' : cropForm.status,
            image: cropForm.image,
            description: cropForm.description
          };
        }
        return c;
      });
    } else {
      // Add mode
      const newCrop: CropProduct = {
        id: `crop-${Date.now()}`,
        farmerId: currentFarmer.id,
        farmerName: currentFarmer.name,
        farmName: currentFarmer.farmName,
        name: cropForm.name,
        category: cropForm.category,
        price: Number(cropForm.price),
        unit: cropForm.unit,
        stock: Number(cropForm.stock),
        quantity: Number(cropForm.stock),
        status: cropForm.stock === 0 ? 'Sold Out' : cropForm.status,
        image: cropForm.image,
        description: cropForm.description || 'Grown locally with careful precision.'
      };
      updatedList = [newCrop, ...crops];
    }

    onUpdateCrops(updatedList);
    setIsCropModalOpen(false);
  };

  const handleDeleteCrop = (id: string) => {
    if (confirm('Are you sure you want to permanently delete this produce listing? This cannot be undone.')) {
      const updatedList = crops.filter(c => c.id !== id);
      onUpdateCrops(updatedList);
    }
  };

  // Inline toggle for crop status
  const handleToggleStatus = (crop: CropProduct) => {
    const nextStatusMap: Record<string, 'Live' | 'Draft' | 'Sold Out'> = {
      'Live': 'Draft',
      'Draft': 'Live',
      'Sold Out': 'Live'
    };
    const newStatus = nextStatusMap[crop.status] || 'Live';
    const updated = crops.map(c => {
      if (c.id === crop.id) {
        return {
          ...c,
          status: c.stock === 0 && newStatus === 'Live' ? 'Sold Out' : newStatus
        };
      }
      return c;
    });
    onUpdateCrops(updated);
  };

  const handleUpdateCropField = (cropId: string, updates: Partial<CropProduct>) => {
    const updated = crops.map(c => {
      if (c.id === cropId) {
        const nextCrop = { ...c, ...updates };
        if (updates.stock !== undefined) {
          nextCrop.quantity = nextCrop.stock;
          nextCrop.status = nextCrop.stock === 0 ? 'Sold Out' : 'Live';
        }
        return nextCrop;
      }
      return c;
    });
    onUpdateCrops(updated);
  };

  // Order Fulfillment operations
  const handleOrderAction = (orderId: string, action: 'accept' | 'decline' | 'advance') => {
    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        let nextStatus: any = o.status;
        if (action === 'accept') {
          nextStatus = 'Harvesting';
        } else if (action === 'decline') {
          nextStatus = 'Declined';
        } else if (action === 'advance') {
          if (o.status === 'Harvesting') nextStatus = 'Ready for Pickup';
          else if (o.status === 'Ready for Pickup') nextStatus = 'Delivered';
        }

        // Apply product stock reduction if delivering/accepting?
        // Let's deduct stock when order is accepted
        return { ...o, status: nextStatus };
      }
      return o;
    });

    // If accepted, also decrease crop stocks in localStorage!
    if (action === 'accept') {
      const targetOrder = orders.find(o => o.id === orderId);
      if (targetOrder) {
        const cropMap = [...crops];
        targetOrder.items.forEach(item => {
          if (item.farmerId === currentFarmer.id) {
            const cropIdx = cropMap.findIndex(c => c.id === item.productId);
            if (cropIdx !== -1) {
              const resultingStock = Math.max(0, cropMap[cropIdx].stock - item.quantity);
              cropMap[cropIdx] = {
                ...cropMap[cropIdx],
                stock: resultingStock,
                status: resultingStock === 0 ? 'Sold Out' : cropMap[cropIdx].status
              };
            }
          }
        });
        onUpdateCrops(cropMap);
      }
    }

    onUpdateOrders(updatedOrders);
  };

  // Render the inventory list after applying filter
  const filteredCrops = useMemo(() => {
    return farmerCrops.filter(c => {
      if (invFilter === 'All') return true;
      if (invFilter === 'Low Stock') return c.stock < 10 && c.status === 'Live';
      return c.status === invFilter;
    });
  }, [farmerCrops, invFilter]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row font-sans">
      
      {/* Side Control Station */}
      <aside className="w-full md:w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col justify-between p-4 flex-shrink-0">
        <div className="space-y-6">
          
          {/* Farm details summary */}
          <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
            <div className="flex items-center space-x-3 text-emerald-400 mb-2">
              <Sprout className="w-6 h-6 animate-pulse" />
              <span className="font-bold tracking-wide font-mono text-sm uppercase">Farmer Station</span>
            </div>
            <div className="aspect-video w-full rounded-md overflow-hidden mb-2">
              <img src={currentFarmer.photo} alt="My Farm" className="w-full h-full object-cover" />
            </div>
            <h3 id="farm-portal-name" className="font-semibold text-sm text-zinc-100 truncate">{currentFarmer.farmName}</h3>
            <p className="text-xs text-zinc-400 truncate flex items-center mt-1">
              <MapPin className="w-3 h-3 mr-1 text-emerald-500" />
              {currentFarmer.location || `${currentFarmer.village}, ${currentFarmer.state}`}
            </p>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            <button
              id="tab-analytics"
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-mono tracking-wider text-left flex-shrink-0 transition-all ${activeTab === 'analytics' ? 'bg-emerald-950 text-emerald-400 border-l-2 border-emerald-500 font-bold' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>EARNINGS & ANALYTICS</span>
            </button>

            <button
              id="tab-inventory"
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-mono tracking-wider text-left flex-shrink-0 transition-all ${activeTab === 'inventory' ? 'bg-emerald-950 text-emerald-400 border-l-2 border-emerald-500 font-bold' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
            >
              <Package className="w-4 h-4" />
              <span>MY INVENTORY ({farmerCrops.length})</span>
            </button>

            <button
              id="tab-orders"
              onClick={() => setActiveTab('orders')}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-mono tracking-wider text-left flex-shrink-0 relative transition-all ${activeTab === 'orders' ? 'bg-emerald-950 text-emerald-400 border-l-2 border-emerald-500 font-bold' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>FULFILLMENT ({farmerOrders.length})</span>
              {metrics.pendingFulfillmentCount > 0 && (
                <span className="absolute right-2 top-2 px-1.5 py-0.5 bg-emerald-500 text-zinc-950 text-[9px] font-bold rounded-full font-mono">
                  {metrics.pendingFulfillmentCount}
                </span>
              )}
            </button>

            <button
              id="tab-reviews"
              onClick={() => setActiveTab('reviews')}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-mono tracking-wider text-left flex-shrink-0 transition-all ${activeTab === 'reviews' ? 'bg-emerald-950 text-emerald-400 border-l-2 border-emerald-500 font-bold' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>BUYER REVIEWS ({farmerFeedbacks.length})</span>
            </button>
          </nav>

        </div>

        {/* Logout Actions */}
        <div className="pt-4 border-t border-zinc-800 mt-4 md:mt-0">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-3 font-mono">
            <span>Operator:</span>
            <span className="font-semibold text-zinc-200 truncate max-w-[120px]">{currentFarmer.name}</span>
          </div>
          <button
            id="farmer-logout-btn"
            onClick={onLogout}
            className="w-full py-2.5 bg-zinc-800 hover:bg-red-950 hover:text-red-400 text-sm font-semibold rounded-lg text-zinc-300 transition-colors flex items-center justify-center space-x-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Lock Station</span>
          </button>
        </div>
      </aside>

      {/* Main workspace section */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-h-screen">
        
        {/* TOP STATUS HIGHLIGHTS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 id="farmer-active-tab-title" className="text-3xl font-extrabold tracking-tight text-white font-sans">
              {activeTab === 'analytics' && 'Earnings & Direct Analytics'}
              {activeTab === 'inventory' && 'Organic Produce Catalog'}
              {activeTab === 'orders' && 'Harvest Fulfillment Control'}
              {activeTab === 'reviews' && 'Conscious Buyer Feedbacks'}
            </h1>
            <p className="text-zinc-400 text-xs font-mono mt-1 uppercase tracking-widest text-emerald-400">
              {currentFarmer.farmName} • STATION PERSISTED LOCALLY
            </p>
          </div>

          {activeTab === 'inventory' && (
            <button
              id="add-produce-listing-btn"
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold font-mono tracking-wider rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ADD PRODUCE LISTING</span>
            </button>
          )}
        </div>

        {/* WORKSPACE DETAILED VIEWS */}
        
        {/* Tab 1: EARNINGS & ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-zinc-900 border border-zinc-805 rounded-xl p-5 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                <div className="text-zinc-400 text-xs font-mono uppercase">Direct Sales Revenue</div>
                <div className="text-2xl font-extrabold text-zinc-100 font-mono mt-2">₹{metrics.totalEarnings.toFixed(0)}</div>
                <p className="text-[10px] text-zinc-500 font-sans mt-1">From completed orders</p>
              </div>

              <div className="bg-zinc-900 border border-zinc-805 rounded-xl p-5 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                <div className="text-zinc-400 text-xs font-mono uppercase font-sans">Active Listings</div>
                <div className="text-2xl font-extrabold text-zinc-100 font-mono mt-2">{farmerCrops.length}</div>
                <p className="text-[10px] text-zinc-500 mt-1">Live & draft crops</p>
              </div>

              <div className="bg-zinc-900 border border-zinc-805 rounded-xl p-5 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-yellow-500/80" />
                <div className="text-zinc-400 text-xs font-mono uppercase flex items-center">
                  Low Stock Warnings
                  {metrics.lowStockCount > 0 && <AlertTriangle className="w-3_5 h-3.5 ml-1 text-yellow-500 animate-bounce" />}
                </div>
                <div className="text-2xl font-extrabold text-zinc-100 font-mono mt-2">{metrics.lowStockCount}</div>
                <p className="text-[10px] text-zinc-500 mt-1">Crops under 10 units</p>
              </div>

              <div className="bg-zinc-900 border border-zinc-850 rounded-xl p-5 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                <div className="text-zinc-400 text-xs font-mono uppercase">Rating Index</div>
                <div className="text-2xl font-extrabold text-zinc-100 font-mono mt-2 flex items-center space-x-1.5">
                  <span>{metrics.averageRating}</span>
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Out of {farmerFeedbacks.length} feedbacks</p>
              </div>
            </div>

            {/* Graphics Bento Board */}
            <div className="grid lg:grid-cols-12 gap-6">
              
              {/* Category Sales Chart */}
              <div className="lg:col-span-8 bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg">
                <h3 className="text-sm font-semibold tracking-wide text-zinc-300 font-mono mb-6 uppercase">Category Sales Distribution</h3>
                <div className="h-64">
                  {metrics.totalEarnings === 0 ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 space-y-2 border border-dashed border-zinc-800 rounded-lg">
                      <TrendingUp className="w-8 h-8 text-zinc-600 animate-pulse" />
                      <p className="text-xs font-mono">No physical payouts detected yet.</p>
                      <p className="text-[10px] max-w-[280px] text-center">Fulfill pending marketplace baskets to view distribution charting metrics in real-time.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} />
                        <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                          labelClassName="text-xs font-mono text-zinc-400"
                        />
                        <Bar dataKey="sales" fill="#10b981" radius={[4, 4, 0, 0]}>
                          {categoryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Crop Catalog Status Breakdown */}
              <div className="lg:col-span-4 bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-semibold tracking-wide text-zinc-300 font-mono mb-4 uppercase">Catalog Categories</h3>
                  <p className="text-xs text-zinc-400 mb-6 font-sans">Number of listings published in categories.</p>
                </div>
                
                <div className="space-y-4">
                  {categoryChartData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="text-xs font-semibold text-zinc-300">{item.name}</span>
                      </div>
                      <span className="text-xs font-bold text-emerald-400 font-mono">{item.listings} listings</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-zinc-800 text-center mt-6">
                  <span className="text-[10px] text-zinc-400 font-mono">Meadowbrook Core Telemetry v1.1</span>
                </div>
              </div>

            </div>


          </div>
        )}

        {/* Tab 2: ORGANIC PRODUCE CATALOG (CRUD) */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            {/* Filter buttons & Header search */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
              <div className="flex flex-wrap items-center gap-1.5">
                {(['All', 'Live', 'Draft', 'Sold Out', 'Low Stock'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setInvFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${invFilter === filter ? 'bg-emerald-600 text-zinc-950 font-bold' : 'text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200'}`}
                  >
                    {filter === 'Low Stock' ? '⚠️ LOW STOCK' : filter.toUpperCase()}
                  </button>
                ))}
              </div>
              
              <div className="text-xs text-zinc-400 font-mono">
                Showing {filteredCrops.length} of {farmerCrops.length} products
              </div>
            </div>

            {/* Produce Grid list */}
            {filteredCrops.length === 0 ? (
              <div className="text-center py-20 bg-zinc-900 border border-dashed border-zinc-800 rounded-2xl">
                <Package className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-lg font-mono font-bold text-zinc-350">No crops found matching category</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">Add a new item or reset the filters to trace existing items.</p>
                <button
                  onClick={handleOpenAddModal}
                  className="mt-6 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-mono font-bold rounded-lg cursor-pointer"
                >
                  Create New Crop Listing
                </button>
              </div>
            ) : (
              <div id="crop-catalog-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCrops.map((crop) => {
                  const isLowStock = crop.stock < 10 && crop.status === 'Live';
                  return (
                    <motion.div
                      key={crop.id}
                      layout
                      className="bg-zinc-900 border border-zinc-805/85 hover:border-emerald-500/50 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between"
                    >
                      <div>
                        {/* Crop banner, category & stock overlay */}
                        <div className="aspect-video w-full bg-zinc-950 relative overflow-hidden">
                          <img src={crop.image} alt={crop.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                          
                          {/* Rating badge */}
                          <div className="absolute top-3 left-3 px-2 py-1 bg-zinc-950/80 backdrop-blur-sm border border-zinc-800 text-[10px] text-yellow-400 font-bold font-mono rounded flex items-center space-x-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span>5.0</span>
                          </div>

                          <div className="absolute top-3 right-3 flex flex-col items-end space-y-1">
                            {/* Stock badge */}
                            <span className={`px-2 py-1 text-[10px] font-mono font-bold uppercase rounded ${isLowStock ? 'bg-yellow-500 text-zinc-950 animate-pulse' : crop.stock === 0 ? 'bg-rose-950 border border-rose-800 text-rose-400' : 'bg-emerald-950 border border-emerald-900 text-emerald-400'}`}>
                              {crop.stock === 0 ? 'Out of Stock' : `${crop.stock} ${crop.unit || 'kg'} Left`}
                            </span>
                          </div>

                          {/* Category indicator bottom banner */}
                          <div className="absolute bottom-3 left-3 px-2 py-0.5 bg-emerald-500 text-zinc-950 text-[10px] font-mono font-bold uppercase rounded">
                            {crop.category}
                          </div>
                        </div>

                        {/* Detailed pricing information */}
                        <div className="p-4 space-y-1">
                          <h3 className="font-bold text-base text-zinc-50 truncate">{crop.name}</h3>
                          <p className="text-[11px] text-zinc-400 line-clamp-1">
                            {crop.description || 'Grown sustainably locally.'}
                          </p>
                        </div>

                        {/* Direct Stock & Price Control Station */}
                        <div className="p-4 mx-4 mb-4 bg-zinc-955 border border-zinc-800/80 rounded-xl space-y-3">
                          {/* Stock Counter with + and - Buttons */}
                          <div className="space-y-1.5 text-left">
                            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                              <span>AVAILABLE STOCK</span>
                              {crop.stock > 0 ? (
                                <span className="text-emerald-400 font-bold flex items-center space-x-1">
                                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping mr-1" />
                                  IN STOCK
                                </span>
                              ) : (
                                <span className="text-rose-400 font-bold">OUT OF STOCK</span>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-xl p-1">
                              <button
                                type="button"
                                onClick={() => {
                                  const nextStock = Math.max(0, crop.stock - 10);
                                  handleUpdateCropField(crop.id, { stock: nextStock });
                                }}
                                className="w-8 h-8 flex items-center justify-center bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 active:scale-95 text-zinc-300 font-bold rounded-lg text-xs cursor-pointer select-none transition-all"
                                title="Remove 10"
                              >
                                -10
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const nextStock = Math.max(0, crop.stock - 1);
                                  handleUpdateCropField(crop.id, { stock: nextStock });
                                }}
                                className="w-7 h-7 flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-zinc-400 font-medium rounded text-xs cursor-pointer select-none transition-all"
                                title="Remove 1"
                              >
                                -1
                              </button>

                              <div className="flex-1 text-center font-mono text-xs font-bold text-white">
                                <input
                                  type="number"
                                  min="0"
                                  value={crop.stock}
                                  onChange={(e) => {
                                    const val = Math.max(0, parseInt(e.target.value) || 0);
                                    handleUpdateCropField(crop.id, { stock: val });
                                  }}
                                  className="w-12 bg-transparent text-center focus:outline-none rounded border border-transparent p-0.5 font-bold font-mono text-white text-xs"
                                />
                                <span className="text-[10px] text-zinc-500 font-sans font-normal ml-0.5">{crop.unit || 'kg'}</span>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  handleUpdateCropField(crop.id, { stock: crop.stock + 1 });
                                }}
                                className="w-7 h-7 flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-zinc-400 font-medium rounded text-xs cursor-pointer select-none transition-all"
                                title="Add 1"
                              >
                                +1
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  handleUpdateCropField(crop.id, { stock: crop.stock + 10 });
                                }}
                                className="w-8 h-8 flex items-center justify-center bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 active:scale-95 text-zinc-300 font-bold rounded-lg text-xs cursor-pointer select-none transition-all"
                                title="Add 10"
                              >
                                +10
                              </button>
                            </div>
                                                    {/* Price changer */}
                          <div className="space-y-1.5 text-left">
                            <span className="block text-[11px] font-mono text-zinc-400">PRICE (₹/{crop.unit || 'kg'})</span>
                            <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-xl p-1">
                              <button
                                type="button"
                                onClick={() => {
                                  const nextPrice = Math.max(1, crop.price - 5);
                                  handleUpdateCropField(crop.id, { price: Number(nextPrice.toFixed(0)) });
                                }}
                                className="w-8 h-8 flex items-center justify-center bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 active:scale-95 text-zinc-400 rounded-lg text-xs cursor-pointer select-none transition-all"
                                title="Decrease ₹5"
                              >
                                -₹5
                              </button>

                              <div className="flex-1 text-center font-mono font-bold text-white flex items-center justify-center space-x-1">
                                <span className="text-[10px] text-zinc-500">₹</span>
                                <input
                                  type="number"
                                  step="1"
                                  min="1"
                                  value={crop.price}
                                  onChange={(e) => {
                                    const val = Math.max(1, parseFloat(e.target.value) || 1);
                                    handleUpdateCropField(crop.id, { price: Number(val.toFixed(0)) });
                                  }}
                                  className="w-14 bg-transparent text-center focus:outline-none rounded border border-transparent p-0.5 font-bold font-mono text-white text-xs"
                                />
                                <span className="text-[10px] text-zinc-500 font-sans font-normal">/ {crop.unit || 'kg'}</span>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  const nextPrice = crop.price + 5;
                                  handleUpdateCropField(crop.id, { price: Number(nextPrice.toFixed(0)) });
                                }}
                                className="w-8 h-8 flex items-center justify-center bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 active:scale-95 text-zinc-400 rounded-lg text-xs cursor-pointer select-none transition-all"
                                title="Increase ₹5"
                              >
                                +₹5
                              </button>
                            </div>
                          </div>  </div>

                          {/* Direct Mark Out of stock / In stock */}
                          <div className="pt-1 border-t border-zinc-900">
                            {crop.stock > 0 ? (
                              <button
                                type="button"
                                onClick={() => {
                                  handleUpdateCropField(crop.id, { stock: 0 });
                                }}
                                className="w-full py-2 bg-rose-950/40 border border-rose-900 hover:bg-rose-955 hover:border-rose-500 text-rose-400 font-bold text-[11px] font-mono rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>MARK OUT OF STOCK</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  handleUpdateCropField(crop.id, { stock: 50 });
                                }}
                                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs font-mono rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1 shadow-lg shadow-emerald-500/10"
                              >
                                <Check className="w-4 h-4 text-zinc-950 stroke-[3]" />
                                <span>MARK AVAILABLE (50 kg)</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Modification Action Rail */}
                      <div className="px-4 pb-4 pt-2.5 border-t border-zinc-805 bg-zinc-955 flex items-center justify-between">
                        {/* Inline status toggle button */}
                        <button
                          onClick={() => handleToggleStatus(crop)}
                          className={`px-2 py-1 rounded text-[10px] font-mono border transition-all cursor-pointer ${crop.status === 'Live' ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400 hover:bg-emerald-900/10' : crop.status === 'Draft' ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700' : 'bg-red-950/40 border-red-905 text-red-100 cursor-not-allowed'}`}
                          disabled={crop.stock === 0}
                        >
                          STATUS: {crop.status.toUpperCase()}
                        </button>

                        <div className="flex items-center space-x-1">
                          {/* Edit Item */}
                          <button
                            id={`edit-crop-${crop.id}`}
                            onClick={() => handleOpenEditModal(crop)}
                            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors cursor-pointer"
                            title="Edit Custom Fields"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Item */}
                          <button
                            id={`delete-crop-${crop.id}`}
                            onClick={() => handleDeleteCrop(crop.id)}
                            className="p-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-900/30 text-rose-400 rounded-lg transition-colors cursor-pointer"
                            title="Delete Listing"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: HARVEST FULFILLMENT CONTROL */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            
            {/* Sub Stats information */}
            <div className="grid grid-cols-3 gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
              <div className="text-center">
                <span className="text-[10px] font-mono text-zinc-400 uppercase block">Pending Review</span>
                <span className="text-xl font-bold text-yellow-500 block font-mono mt-1">
                  {farmerOrders.filter(o => o.status === 'Pending').length}
                </span>
              </div>
              <div className="text-center border-x border-zinc-800">
                <span className="text-[10px] font-mono text-zinc-400 uppercase block">Active Processing</span>
                <span className="text-xl font-bold text-emerald-400 block font-mono mt-1">
                  {farmerOrders.filter(o => o.status === 'Harvesting' || o.status === 'Ready for Pickup').length}
                </span>
              </div>
              <div className="text-center">
                <span className="text-[10px] font-mono text-zinc-400 uppercase block">Deliveries Completed</span>
                <span className="text-xl font-bold text-zinc-350 block font-mono mt-1">
                  {farmerOrders.filter(o => o.status === 'Delivered').length}
                </span>
              </div>
            </div>

            {/* Kanban-style Fulfillment columns */}
            <div className="grid lg:grid-cols-3 gap-6">
              
              {/* Column 1: Incoming & Pending Requests */}
              <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-4 shadow-md">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-yellow-500 flex items-center select-none">
                    <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2 animate-ping" />
                    Incoming Requests
                  </span>
                  <span className="px-2 py-0.5 bg-zinc-850 text-zinc-300 text-[10px] font-mono rounded">
                    {farmerOrders.filter(o => o.status === 'Pending').length}
                  </span>
                </div>

                <div className="space-y-4">
                  {farmerOrders.filter(o => o.status === 'Pending').length === 0 ? (
                    <p className="text-zinc-500 text-xs italic text-center py-6">No incoming buyer requests.</p>
                  ) : (
                    farmerOrders.filter(o => o.status === 'Pending').map(order => (
                      <FulfillCard
                        key={order.id}
                        order={order}
                        farmerId={currentFarmer.id}
                        onAccept={() => handleOrderAction(order.id, 'accept')}
                        onDecline={() => handleOrderAction(order.id, 'decline')}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Column 2: Active Harvesting & Processing */}
              <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-4 shadow-md">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center select-none">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2" />
                    Active Harvesting
                  </span>
                  <span className="px-2 py-0.5 bg-zinc-850 text-zinc-300 text-[10px] font-mono rounded">
                    {farmerOrders.filter(o => o.status === 'Harvesting').length}
                  </span>
                </div>

                <div className="space-y-4">
                  {farmerOrders.filter(o => o.status === 'Harvesting').length === 0 ? (
                    <p className="text-zinc-500 text-xs italic text-center py-6">Nothing harvesting currently.</p>
                  ) : (
                    farmerOrders.filter(o => o.status === 'Harvesting').map(order => (
                      <FulfillCard
                        key={order.id}
                        order={order}
                        farmerId={currentFarmer.id}
                        onAdvance={() => handleOrderAction(order.id, 'advance')}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Column 3: Ready for Pickup & Picked Up */}
              <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-4 shadow-md">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center select-none">
                    <span className="w-2 h-2 bg-zinc-400 rounded-full mr-2" />
                    Pickup & Completed
                  </span>
                  <span className="px-2 py-0.5 bg-zinc-850 text-zinc-300 text-[10px] font-mono rounded">
                    {farmerOrders.filter(o => o.status === 'Ready for Pickup' || o.status === 'Delivered').length}
                  </span>
                </div>

                <div className="space-y-4">
                  {farmerOrders.filter(o => o.status === 'Ready for Pickup' || o.status === 'Delivered').length === 0 ? (
                    <p className="text-zinc-500 text-xs italic text-center py-6">No pickups or deliveries tracked.</p>
                  ) : (
                    farmerOrders.filter(o => o.status === 'Ready for Pickup' || o.status === 'Delivered').map(order => (
                      <FulfillCard
                        key={order.id}
                        order={order}
                        farmerId={currentFarmer.id}
                        onAdvance={order.status === 'Ready for Pickup' ? () => handleOrderAction(order.id, 'advance') : undefined}
                      />
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Tab 4: BUYER REVIEWS & FEEDBACK */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
              <h3 className="text-sm font-semibold tracking-wide text-zinc-300 font-mono mb-4 uppercase">Reviews Overview</h3>
              
              {farmerFeedbacks.length === 0 ? (
                <div className="text-center py-10 text-zinc-500 italic text-xs">
                  No buyer feedback submitted yet for this farmer. Reviews appear once orders are settled.
                </div>
              ) : (
                <div className="grid gap-4">
                  {farmerFeedbacks.map((f) => (
                    <div key={f.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg text-left">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-zinc-200 text-sm">{f.consumerName}</span>
                          <span className="text-[10px] text-zinc-500 font-mono ml-3">{new Date(f.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star
                              key={idx}
                              className={`w-3.5 h-3.5 ${idx < f.rating ? 'fill-yellow-500 text-yellow-500' : 'text-zinc-700'}`}
                            />
                          ))}
                        </div>
                      </div>
                      
                      <div className="text-[10px] font-mono text-emerald-400 mt-1 uppercase">
                        Product: {f.cropName}
                      </div>
                      
                      <p className="text-xs text-zinc-300 mt-2 italic leading-relaxed">
                        "{f.comment}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* CREATE & EDIT LISTING MODAL SHEET */}
      <AnimatePresence>
        {isCropModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-xl overflow-hidden shadow-2xl relative"
            >
              
              {/* Modal Banner header */}
              <div className="bg-zinc-950 px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
                <h2 className="text-base font-bold font-mono text-zinc-100 flex items-center">
                  <Sprout className="w-5 h-5 text-emerald-400 mr-2" />
                  {editingCropId ? 'EDIT HARVEST PRODUCT' : 'POST FRESH HARVEST'}
                </h2>
                <button
                  id="crop-dialog-close-btn"
                  onClick={() => setIsCropModalOpen(false)}
                  className="text-zinc-400 hover:text-zinc-100 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Multi-step selector: Choose from preset or custom */}
              {showPresetPicker && !editingCropId ? (
                <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-zinc-300 font-sans">Choose Product from your Registered List:</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {CROP_PRESETS.filter(preset => !currentFarmer.selectedCrops || currentFarmer.selectedCrops.length === 0 || currentFarmer.selectedCrops.includes(preset.name)).map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className="flex items-center space-x-3 p-2 border border-zinc-800 hover:border-emerald-500 hover:bg-zinc-950 rounded-lg text-left transition-all cursor-pointer text-xs"
                      >
                        <div className="w-10 h-10 rounded overflow-hidden bg-zinc-900 flex-shrink-0">
                          <img src={preset.image} alt={preset.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-zinc-200 truncate">{preset.name}</div>
                          <div className="text-[10px] text-zinc-400 font-mono mt-0.5">₹{preset.defaultPrice} / {preset.defaultUnit}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveCrop} className="p-6 space-y-4 text-left max-h-[75vh] overflow-y-auto">
                  
                  {/* Option to toggle back to preset if creating */}
                  {!editingCropId && (
                    <button
                      type="button"
                      onClick={() => setShowPresetPicker(true)}
                      className="text-xs text-emerald-405 hover:text-emerald-400 underline font-mono select-none"
                    >
                      ← Return to presets selection
                    </button>
                  )}

                  {/* Crop Name */}
                  <div>
                    <label className="block text-xs font-mono text-zinc-400 mb-1">Crop Name *</label>
                    <input
                      id="crop-dialog-name"
                      type="text"
                      required
                      placeholder="e.g. Crisp Wild Vine Blackberries"
                      value={cropForm.name}
                      onChange={(e) => setCropForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Category & Unit */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-zinc-400 mb-1">Produce Category</label>
                      <select
                        id="crop-dialog-category"
                        value={cropForm.category}
                        onChange={(e) => setCropForm(prev => ({ ...prev, category: e.target.value as CropCategory }))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-150 focus:outline-none"
                      >
                        <option value="Vegetables">Vegetables</option>
                        <option value="Fruits">Fruits</option>
                        <option value="Grains">Grains</option>
                        <option value="Dairy">Dairy</option>
                        <option value="Poultry">Poultry</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-zinc-400 mb-1">Pricing Unit Type</label>
                      <input
                        id="crop-dialog-unit"
                        type="text"
                        required
                        placeholder="e.g. kg, litre, dozen, quintal, piece"
                        value={cropForm.unit}
                        onChange={(e) => setCropForm(prev => ({ ...prev, unit: e.target.value }))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Price & Stock */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-zinc-400 mb-1">Price Per Unit (₹) *</label>
                      <input
                        id="crop-dialog-price"
                        type="number"
                        step="1"
                        min="1"
                        required
                        value={cropForm.price}
                        onChange={(e) => setCropForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-zinc-400 mb-1">Harvest Stock Quantity *</label>
                      <input
                        id="crop-dialog-stock"
                        type="number"
                        min="0"
                        required
                        value={cropForm.stock}
                        onChange={(e) => setCropForm(prev => ({ ...prev, stock: Number(e.target.value) }))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-100 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Photo Preset / URL search */}
                  <div>
                    <label className="block text-xs font-mono text-zinc-400 mb-1">Photo Selection Preset URL</label>
                    <input
                      id="crop-dialog-image"
                      type="text"
                      placeholder="https://images.unsplash.com/..."
                      value={cropForm.image}
                      onChange={(e) => setCropForm(prev => ({ ...prev, image: e.target.value }))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-100 focus:outline-none h-9 text-ellipsis"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-mono text-zinc-400 mb-1">Direct Description</label>
                    <textarea
                      id="crop-dialog-description"
                      rows={3}
                      placeholder="Add information on growth methods, taste quality, or preservation recommendations..."
                      value={cropForm.description}
                      onChange={(e) => setCropForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-100 focus:outline-none"
                    />
                  </div>

                  <div className="flex space-x-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsCropModalOpen(false)}
                      className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold font-mono text-zinc-300 rounded-lg cursor-pointer"
                    >
                      CANCEL
                    </button>
                    <button
                      id="crop-save-btn"
                      type="submit"
                      className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold font-mono rounded-lg cursor-pointer"
                    >
                      SAVE HARVEST
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Interactive helper layout card for Fulfill board
interface FulfillCardProps {
  key?: string;
  order: Order;
  farmerId: string;
  onAccept?: () => void;
  onDecline?: () => void;
  onAdvance?: () => void;
}

function FulfillCard({ order, farmerId, onAccept, onDecline, onAdvance }: FulfillCardProps) {
  // Extract items belonging only to current farmer for visualization
  const farmerItems = useMemo(() => {
    return order.items.filter(item => item.farmerId === farmerId);
  }, [order.items, farmerId]);

  const subTotal = useMemo(() => {
    return farmerItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [farmerItems]);

  return (
    <div className="bg-zinc-950 border border-zinc-800/80 p-4 rounded-xl space-y-3 shadow text-left hover:border-zinc-700 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-zinc-400">ORDER {order.id}</span>
        <span className="text-[9px] text-zinc-500 font-mono">{new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>

      <div className="space-y-1">
        <h4 className="font-bold text-xs text-zinc-200">{order.buyerName || order.consumerName}</h4>
        <p className="text-[10px] text-zinc-400 truncate flex items-center">
          <Phone className="w-2.5 h-2.5 mr-1 text-zinc-500" />
          {order.buyerContact || order.consumerContact}
        </p>
      </div>

      {/* Item summary List */}
      <div className="space-y-1.5 py-2 border-y border-zinc-900/60 font-sans">
        {farmerItems.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center text-xs">
            <span className="text-zinc-300 truncate max-w-[130px] font-medium">{item.productName}</span>
            <span className="text-zinc-400 font-mono text-[11px]">
              {item.quantity} {item.unit} x ₹{item.price}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-zinc-500">MY SHARE TOTAL:</span>
        <span className="text-xs font-bold font-mono text-emerald-400">₹{subTotal}</span>
      </div>

      <div className="text-[10px] text-zinc-400 leading-relaxed max-h-12 overflow-hidden text-ellipsis">
        <span className="font-mono text-zinc-500">Address: </span> {order.deliveryAddress}
      </div>

      {order.pickupTime && (
        <div className="text-[9px] text-zinc-400 bg-zinc-900/60 p-2 rounded flex items-center">
          <Clock className="w-3 h-3 mr-1 text-emerald-500 flex-shrink-0" />
          <span className="truncate">{order.pickupTime}</span>
        </div>
      )}

      {/* Progress Trigger button interactions */}
      <div className="pt-2 flex gap-2">
        {order.status === 'Pending' && onAccept && onDecline && (
          <>
            <button
              onClick={onDecline}
              className="flex-1 py-1.5 border border-red-950 hover:bg-red-950/40 text-red-400 text-[10px] font-mono font-bold rounded cursor-pointer flex items-center justify-center space-x-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>DECLINE</span>
            </button>
            <button
              onClick={onAccept}
              className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-[10px] font-mono font-bold rounded cursor-pointer flex items-center justify-center space-x-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>ACCEPT</span>
            </button>
          </>
        )}

        {order.status === 'Harvesting' && onAdvance && (
          <button
            onClick={onAdvance}
            className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-[10px] font-mono font-bold rounded cursor-pointer flex items-center justify-center space-x-1"
          >
            <Sprout className="w-3.5 h-3.5" />
            <span>FINISH HARVEST ➔ READY</span>
          </button>
        )}

        {order.status === 'Ready for Pickup' && onAdvance && (
          <button
            onClick={onAdvance}
            className="w-full py-1.5 bg-zinc-250 hover:bg-emerald-500 hover:text-black text-[10px] font-mono font-bold rounded text-zinc-100 bg-emerald-600 cursor-pointer flex items-center justify-center space-x-1"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>CONFIRM DISPATCH DELIVERY</span>
          </button>
        )}

        {order.status === 'Delivered' && (
          <div className="w-full py-1 bg-zinc-900 text-zinc-500 text-[10px] font-mono font-medium rounded text-center uppercase tracking-wide border border-zinc-800 flex items-center justify-center space-x-1">
            <Check className="w-3.5 h-3.5 text-zinc-650" />
            <span>Fulfillment Succeeded</span>
          </div>
        )}

        {order.status === 'Declined' && (
          <div className="w-full py-1 bg-zinc-900 text-red-405 text-[10px] font-mono font-medium rounded text-center uppercase tracking-wide border border-zinc-850">
            Declined
          </div>
        )}
      </div>
    </div>
  );
}
