import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingBag,
  Search,
  Filter,
  ShoppingCart,
  Clock,
  MapPin,
  CreditCard,
  User,
  Star,
  CheckCircle,
  X,
  ChevronRight,
  Info,
  Trash2,
  Calendar,
  Heart,
  Bell,
  Settings,
  Sliders,
  DollarSign,
  Plus,
  Minus,
  Check,
  Map,
  Badge,
  LogOut,
  ChevronLeft
} from 'lucide-react';
import { CropProduct, Order, OrderItem, BuyerProfile, FarmerProfile, CropCategory, FarmerFeedback, OrderStatus, AppNotification } from '../types';

interface BuyerDashboardProps {
  currentBuyer: BuyerProfile;
  crops: CropProduct[];
  orders: Order[];
  ordersLoading?: boolean;
  farmers: FarmerProfile[];
  feedbacks: FarmerFeedback[];
  notifications: AppNotification[];
  wishlistProductIds: string[];
  onToggleWishlist: (productId: string) => void;
  onPlaceOrder: (items: OrderItem[], total: number, deliveryAddress: string, pickupTime: string) => Promise<any>;
  onUpdateBuyerProfile: (updatedBuyer: BuyerProfile) => Promise<any>;
  onAddFeedback: (feedback: Omit<FarmerFeedback, 'id' | 'date'>) => Promise<any>;
  onMarkNotificationRead: (id: string) => void;
  onLogout: () => void;
}

export default function BuyerDashboard({
  currentBuyer,
  crops,
  orders,
  ordersLoading = false,
  farmers,
  feedbacks,
  notifications,
  wishlistProductIds,
  onToggleWishlist,
  onPlaceOrder,
  onUpdateBuyerProfile,
  onAddFeedback,
  onMarkNotificationRead,
  onLogout
}: BuyerDashboardProps) {
  // Tabs: 'home' | 'market' | 'orders' | 'wishlist' | 'notifications' | 'profile' | 'settings'
  const [activeTab, setActiveTab] = useState<'home' | 'market' | 'orders' | 'wishlist' | 'notifications' | 'profile' | 'settings'>('home');

  // Marketplace states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CropCategory | 'All'>('All');
  const [priceRange, setPriceRange] = useState<number>(3500); // Max budget filter
  const [filterState, setFilterState] = useState<string>('All');
  const [filterDistrict, setFilterDistrict] = useState<string>('All');

  // Shopping Cart: Record<productId, quantity>
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Checkout address forms
  const [deliveryAddress, setDeliveryAddress] = useState(currentBuyer.deliveryAddress || '123 Main Street, Central City');
  const [pickupTime, setPickupTime] = useState('Saturday Morning (8:00 AM - 11:30 AM)');
  const [buyerContact, setBuyerContact] = useState(currentBuyer.contact || '+1 (555) 123-4567');

  // Profile Edit states
  const [editName, setEditName] = useState(currentBuyer.name);
  const [editEmail, setEditEmail] = useState(currentBuyer.email);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Selected Farmer profile view
  const [viewFarmer, setViewFarmer] = useState<FarmerProfile | null>(null);

  // Feedback states
  const [ratingOrder, setRatingOrder] = useState<Order | null>(null);
  const [ratingValue, setRatingValue] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState<string>('');
  const [activeFeedbackProduct, setActiveFeedbackProduct] = useState<OrderItem | null>(null);

  // Filter lists derived
  const statesAvailable = useMemo(() => {
    const list = new Set<string>();
    farmers.forEach(f => { if (f.state) list.add(f.state); });
    return Array.from(list);
  }, [farmers]);

  const districtsAvailable = useMemo(() => {
    const list = new Set<string>();
    farmers.forEach(f => { if (f.district) list.add(f.district); });
    return Array.from(list);
  }, [farmers]);

  // Categories list
  const cropCategories: CropCategory[] = [
    'Vegetables', 'Fruits', 'Grains', 'Dairy', 'Poultry'
  ];

  // Filtering products
  const displayCrops = useMemo(() => {
    return crops.filter(c => {
      if (c.status === 'Draft') return false;
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.farmerName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
      const matchesPrice = c.price <= priceRange;

      // Find the farmer location to match filters
      const farmer = farmers.find(f => f.id === c.farmerId);
      const matchesState = filterState === 'All' || (farmer && farmer.state === filterState);
      const matchesDistrict = filterDistrict === 'All' || (farmer && farmer.district === filterDistrict);

      return matchesSearch && matchesCategory && matchesPrice && matchesState && matchesDistrict;
    });
  }, [crops, searchQuery, selectedCategory, priceRange, filterState, filterDistrict, farmers]);

  // Cart helper calculations
  const cartItems = useMemo(() => {
    return Object.entries(cart).map(([pId, qty]) => {
      const product = crops.find(c => c.id === pId);
      return product ? { product, qty } : null;
    }).filter((x): x is { product: CropProduct; qty: number } => x !== null);
  }, [cart, crops]);

  const cartTotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + (item.product.price * item.qty), 0);
  }, [cartItems]);

  const cartCount = useMemo(() => {
    return Object.keys(cart).reduce((sum, key) => sum + (cart[key] || 0), 0);
  }, [cart]);

  // Orders placed by this buyer
  const buyerOrders = useMemo(() => {
    return orders.filter(o => o.buyerId === currentBuyer.id)
                 .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders, currentBuyer.id]);

  // Wishlist products
  const wishlistProducts = useMemo(() => {
    return crops.filter(c => wishlistProductIds.includes(c.id));
  }, [crops, wishlistProductIds]);

  const handleAddToCart = (product: CropProduct) => {
    if (product.quantity <= 0) return;
    const currentQty = cart[product.id] || 0;
    if (currentQty >= product.quantity) {
      alert(`We are sorry, only ${product.quantity} ${product.unit} of this crop is in stock!`);
      return;
    }
    setCart(prev => ({ ...prev, [product.id]: currentQty + 1 }));
  };

  const handleUpdateCartQty = (productId: string, diff: number) => {
    const product = crops.find(c => c.id === productId);
    if (!product) return;
    const currentQty = cart[productId] || 0;
    const newQty = currentQty + diff;

    if (newQty <= 0) {
      const updated = { ...cart };
      delete updated[productId];
      setCart(updated);
    } else if (newQty > product.quantity) {
      alert(`Only ${product.quantity} units are in stock!`);
    } else {
      setCart(prev => ({ ...prev, [productId]: newQty }));
    }
  };

  const handleOrderSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    onPlaceOrder(
      cartItems.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.qty,
        price: item.product.price,
        unit: item.product.unit,
        farmerId: item.product.farmerId,
        farmName: item.product.farmName
      })),
      cartTotal,
      deliveryAddress,
      pickupTime
    ).then(() => {
      setCart({});
      setIsCheckoutOpen(false);
      setIsCartOpen(false);
      setActiveTab('orders');
      alert('Order placed successfully direct to farmer! Check status in Orders tab.');
    }).catch(err => {
      alert('Error booking harvest: ' + err.message);
    });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBuyerProfile({
      ...currentBuyer,
      name: editName,
      email: editEmail,
      deliveryAddress,
      contact: buyerContact
    }).then(() => {
      setProfileSuccessMsg('Profile settings synchronized safely!');
      setTimeout(() => setProfileSuccessMsg(''), 4000);
    });
  };

  const submitFeedbackRating = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFeedbackProduct || !ratingOrder) return;

    onAddFeedback({
      farmerId: activeFeedbackProduct.farmerId,
      buyerName: currentBuyer.name,
      rating: ratingValue,
      comment: ratingComment,
      cropName: activeFeedbackProduct.productName
    }).then(() => {
      setRatingOrder(null);
      setActiveFeedbackProduct(null);
      setRatingComment('');
      alert('Thank you! Your feedback has been sent directly to the farmer.');
    });
  };

  return (
    <div id="buyer-cabinet" className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/40 p-6 flex flex-col justify-between shrink-0 hidden md:flex">
        <div className="space-y-8">
          <div className="flex items-center space-x-3 text-sky-400">
            <div className="p-2 bg-sky-500/10 rounded-lg border border-sky-500/20">
              <ShoppingBag className="w-6 h-6 text-sky-400" />
            </div>
            <span className="font-extrabold tracking-tight text-white">Farmer Direct</span>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-slate-500 block px-3">Portals</span>
            
            <button
              id="buyer-sidebar-home"
              onClick={() => setActiveTab('home')}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center space-x-3 transition-all ${activeTab === 'home' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>Overview</span>
            </button>

            <button
              id="buyer-sidebar-market"
              onClick={() => setActiveTab('market')}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center space-x-3 transition-all ${activeTab === 'market' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
            >
              <Sliders className="w-4 h-4" />
              <span>Explore Marketplace</span>
            </button>

            <button
              id="buyer-sidebar-orders"
              onClick={() => setActiveTab('orders')}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center space-x-3 transition-all ${activeTab === 'orders' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
            >
              <Clock className="w-4 h-4" />
              <span>My Orders</span>
              {buyerOrders.filter(o => o.status === 'Pending').length > 0 && (
                <span className="ml-auto w-4 h-4 bg-amber-500 text-[9px] font-black text-slate-950 rounded-full flex items-center justify-center">
                  {buyerOrders.filter(o => o.status === 'Pending').length}
                </span>
              )}
            </button>

            <button
              id="buyer-sidebar-wishlist"
              onClick={() => setActiveTab('wishlist')}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center space-x-3 transition-all ${activeTab === 'wishlist' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
            >
              <Heart className="w-4 h-4" />
              <span>Saved Wishlist</span>
              {wishlistProductIds.length > 0 && (
                <span className="ml-auto px-1.5 py-0.5 bg-slate-800 text-[9px] font-bold text-slate-300 rounded">
                  {wishlistProductIds.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center space-x-3 transition-all ${activeTab === 'notifications' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
            >
              <Bell className="w-4 h-4" />
              <span>Alert Notifications</span>
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="ml-auto w-2 h-2 bg-rose-500 rounded-full animate-ping" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center space-x-3 transition-all ${activeTab === 'profile' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
            >
              <User className="w-4 h-4" />
              <span>Direct Profile</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center space-x-3 transition-all ${activeTab === 'settings' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
            >
              <Settings className="w-4 h-4" />
              <span>Utility Settings</span>
            </button>
          </div>
        </div>

        {/* LOGOUT BOX */}
        <div className="pt-6 border-t border-slate-800 space-y-4">
          <div className="flex items-center space-x-3 px-3">
            <div className="w-8 h-8 rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold text-sm border border-sky-500/20">
              {currentBuyer.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{currentBuyer.name}</p>
              <span className="text-[10px] text-slate-500 font-mono">Buyer Account</span>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-slate-950 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-950 flex items-center space-x-3 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN APPLICATION WORKSPACE */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen">
        
        {/* TOP STATUS NAVIGATION BAR */}
        <header className="p-4 md:px-8 border-b border-slate-900 bg-slate-950 sticky top-0 z-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 md:hidden">
            <ShoppingBag className="w-6 h-6 text-sky-400" />
            <span className="font-extrabold text-sm text-white">Farmer Direct</span>
          </div>

          <div className="hidden md:block">
            <h1 className="text-lg font-bold font-mono tracking-tight text-white flex items-center space-x-2">
              <span>🌾 Buyer Marketplace Portal</span>
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-sky-500 text-slate-950 text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                  {cartCount}
                </span>
              )}
            </button>
            <div className="md:hidden">
              <button 
                onClick={onLogout}
                className="p-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT CONTAINER */}
        <div id="buyer-workspace-content" className="p-4 md:p-8 flex-1 overflow-y-auto">
          
          {/* MOBILE NAVIGATION PILLS */}
          <div className="flex space-x-1.5 overflow-x-auto pb-4 md:hidden border-b border-slate-900 mb-6 font-mono text-[11px]">
            <button 
              onClick={() => setActiveTab('home')}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap ${activeTab === 'home' ? 'bg-sky-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'}`}
            >
              Home
            </button>
            <button 
              onClick={() => setActiveTab('market')}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap ${activeTab === 'market' ? 'bg-sky-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'}`}
            >
              Market
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap ${activeTab === 'orders' ? 'bg-sky-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'}`}
            >
              Orders ({buyerOrders.length})
            </button>
            <button 
              onClick={() => setActiveTab('wishlist')}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap ${activeTab === 'wishlist' ? 'bg-sky-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'}`}
            >
              Saved ({wishlistProductIds.length})
            </button>
            <button 
              onClick={() => setActiveTab('notifications')}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap ${activeTab === 'notifications' ? 'bg-sky-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'}`}
            >
              Alerts
            </button>
            <button 
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap ${activeTab === 'profile' ? 'bg-sky-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'}`}
            >
              Profile
            </button>
          </div>

          <AnimatePresence mode="wait">
            
            {/* OVERVIEW / HOME VIEW */}
            {activeTab === 'home' && (
              <motion.div
                key="home-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8 text-left"
              >
                {/* Visual Banner */}
                <div className="relative bg-gradient-to-r from-sky-900/40 via-indigo-900/25 to-slate-900 p-8 md:p-12 rounded-3xl border border-sky-800/10 overflow-hidden">
                  <div className="relative z-10 max-w-xl">
                    <span className="px-3 py-1 bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-mono rounded-full tracking-wide">Direct Trade Alliance</span>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-4">Welcome back, {currentBuyer.name}!</h2>
                    <p className="text-slate-300 text-sm mt-2 leading-relaxed">
                      Savor the seasons. Order directly from certified bio-diverse farms with complete traceability and honest farmgate billing.
                    </p>
                    <button 
                      onClick={() => setActiveTab('market')}
                      className="mt-6 px-6 py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-sky-500/10"
                    >
                      <span>Browse Harvest Marketplace</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Dashboard statistics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 font-mono">
                  <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Orders Booked</span>
                    <strong className="text-2xl text-white block mt-1">{buyerOrders.length}</strong>
                  </div>
                  <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Uncompleted Orders</span>
                    <strong className="text-2xl text-amber-400 block mt-1">
                      {buyerOrders.filter(o => !['Delivered', 'Completed', 'Declined'].includes(o.status)).length}
                    </strong>
                  </div>
                  <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Starred Items</span>
                    <strong className="text-2xl text-rose-400 block mt-1">{wishlistProductIds.length}</strong>
                  </div>
                  <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Dispersed</span>
                    <strong className="text-2xl text-sky-400 block mt-1">
                      ₹{buyerOrders.reduce((sum, o) => sum + o.total, 0)}
                    </strong>
                  </div>
                </div>

                {/* Latest Listed Crops */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-white text-base">New Farm-to-Gate Offers</h3>
                    <button onClick={() => setActiveTab('market')} className="text-xs text-sky-400 hover:underline">View All</button>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {crops.filter(c => c.status === 'Live').slice(0, 3).map(product => (
                      <div key={product.id} className="bg-slate-900/40 rounded-2xl border border-slate-800/80 overflow-hidden group flex flex-col justify-between">
                        <div className="relative aspect-video bg-slate-950 overflow-hidden">
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            referreypolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          />
                          <button
                            onClick={() => onToggleWishlist(product.id)}
                            className="absolute top-3 right-3 p-2 bg-slate-950/80 hover:bg-slate-900 text-slate-200 hover:text-rose-500 rounded-full border border-slate-800 transition-colors"
                          >
                            <Heart className={`w-4 h-4 ${wishlistProductIds.includes(product.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                          </button>
                        </div>
                        <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                          <div>
                            <span className="px-2 py-0.5 bg-slate-800 text-[9px] font-mono rounded text-slate-400 uppercase tracking-widest">{product.category}</span>
                            <h4 className="font-bold text-white text-sm mt-1">{product.name}</h4>
                            <p className="text-xs text-slate-400 line-clamp-2 mt-1">{product.description}</p>
                          </div>
                          
                          <div className="pt-3 border-t border-slate-900 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-mono text-slate-500 font-bold">Price</span>
                              <strong className="text-white font-mono text-sm">₹{product.price} / {product.unit}</strong>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-mono text-slate-500 font-bold">Farmer Outlet</span>
                              <span 
                                onClick={() => {
                                  const farmer = farmers.find(f => f.id === product.farmerId);
                                  if (farmer) setViewFarmer(farmer);
                                }} 
                                className="text-emerald-400 hover:underline font-bold cursor-pointer"
                              >
                                {product.farmName}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="px-4 pb-4">
                          <button
                            onClick={() => handleAddToCart(product)}
                            className="w-full py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs rounded-xl flex items-center justify-center space-x-1 cursor-pointer transition-all"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Add To Cart</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* EXPEDITION / MARKETPLACE VIEW */}
            {activeTab === 'market' && (
              <motion.div
                key="market-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 text-left"
              >
                {/* Advanced Live Search & Filters panel */}
                <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search crops, category, farm name, flavor..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-950 pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 text-xs focus:outline-none focus:border-sky-500 text-white font-mono"
                      />
                    </div>
                    
                    {/* Horizontal filter categories */}
                    <div className="flex items-center space-x-1.5 overflow-x-auto text-[10px] font-mono max-w-full md:max-w-md pb-2 md:pb-0">
                      <button
                        onClick={() => setSelectedCategory('All')}
                        className={`px-3 py-2 rounded-lg whitespace-nowrap font-bold ${selectedCategory === 'All' ? 'bg-sky-500 text-slate-950' : 'bg-slate-950 text-slate-400 border border-slate-900 hover:border-slate-800'}`}
                      >
                        All
                      </button>
                      {cropCategories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-3 py-2 rounded-lg whitespace-nowrap font-bold ${selectedCategory === cat ? 'bg-sky-500 text-slate-950' : 'bg-slate-950 text-slate-400 border border-slate-900 hover:border-slate-800'}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-4 gap-4 pt-3 border-t border-slate-950 font-mono text-xs">
                    {/* Budget slider */}
                    <div>
                      <div className="flex justify-between items-center mb-1 text-slate-500 font-bold">
                        <span>Max Price Slider</span>
                        <strong className="text-white">₹{priceRange}</strong>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={3500}
                        step={10}
                        value={priceRange}
                        onChange={(e) => setPriceRange(Number(e.target.value))}
                        className="w-full accent-sky-500 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* State Selector */}
                    <div>
                      <span className="text-slate-500 block mb-1 font-bold">Filter State</span>
                      <select
                        value={filterState}
                        onChange={(e) => setFilterState(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white"
                      >
                        <option value="All">All States (No Filter)</option>
                        {statesAvailable.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    {/* District Selector */}
                    <div>
                      <span className="text-slate-500 block mb-1 font-bold">Filter District</span>
                      <select
                        value={filterDistrict}
                        onChange={(e) => setFilterDistrict(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white"
                      >
                        <option value="All">All Districts (No Filter)</option>
                        {districtsAvailable.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>

                    {/* Clear buttons */}
                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('All');
                          setPriceRange(80);
                          setFilterState('All');
                          setFilterDistrict('All');
                        }}
                        className="w-full py-2.5 bg-slate-950 text-slate-400 hover:text-white border border-slate-850 rounded-xl font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Clear Filters</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Total display list */}
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Showing <strong>{displayCrops.length}</strong> matching item offers</span>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {displayCrops.map(product => {
                    const isWishlisted = wishlistProductIds.includes(product.id);
                    return (
                      <div key={product.id} className="bg-slate-905/60 rounded-2xl border border-slate-800/80 overflow-hidden flex flex-col justify-between group shadow-xl">
                        <div className="relative aspect-video bg-slate-950 overflow-hidden">
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            referreypolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <button
                            onClick={() => onToggleWishlist(product.id)}
                            className="absolute top-2.5 right-2.5 p-2 bg-slate-950/80 hover:bg-slate-900 rounded-full border border-slate-800 transition-colors"
                          >
                            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-slate-300'}`} />
                          </button>
                          {product.quantity && product.quantity > 0 ? (
                            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-emerald-950/90 border border-emerald-500/30 text-[9px] font-mono text-emerald-400 font-bold rounded">
                              IN STOCK
                            </span>
                          ) : (
                            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-rose-950/90 border border-rose-500/30 text-[9px] font-mono text-rose-400 font-bold rounded animate-pulse">
                              OUT OF STOCK
                            </span>
                          )}
                        </div>

                        <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                          <div>
                            <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-[9px] font-mono rounded text-slate-500 uppercase font-black">{product.category}</span>
                            <h4 className="font-bold text-white text-sm mt-1 sm:line-clamp-1">{product.name}</h4>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{product.description}</p>
                          </div>

                          <div className="pt-2 border-t border-slate-900 space-y-1.5 font-mono text-xs">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500">Price tag</span>
                              <strong className="text-white">₹{product.price} / {product.unit}</strong>
                            </div>
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="text-slate-500 font-bold">Available Stock</span>
                              <span className={product.quantity && product.quantity > 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                {product.quantity && product.quantity > 0 ? `${product.quantity} ${product.unit} available` : 'OUT OF STOCK'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[11.5px] pt-1">
                              <span className="text-slate-500">Grown by</span>
                              <button
                                onClick={() => {
                                  const fm = farmers.find(f => f.id === product.farmerId);
                                  if (fm) setViewFarmer(fm);
                                }}
                                className="text-emerald-400 hover:underline font-bold text-left truncate max-w-[120px]"
                              >
                                {product.farmName}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="px-4 pb-4">
                          <button
                            onClick={() => handleAddToCart(product)}
                            disabled={product.quantity <= 0}
                            className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer transition-all ${product.quantity > 0 ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-lg shadow-sky-500/5' : 'bg-slate-900 text-slate-500 cursor-not-allowed'}`}
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>{product.quantity > 0 ? 'Secure To Cart' : 'Sold Out'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {displayCrops.length === 0 && (
                  <div className="text-center py-16 bg-slate-900/10 rounded-3xl border border-slate-900">
                    <Sliders className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h4 className="font-bold text-white">No Offers Found</h4>
                    <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">Try clearing search parameters, raising budget boundaries, or examining state filters.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ORDERS LOG VIEW */}
            {activeTab === 'orders' && (
              <motion.div
                key="orders-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 text-left"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-white">Purchase History logs</h2>
                    <p className="text-slate-400 text-xs mt-0.5">Your open delivery bookings and historical farm receipts.</p>
                  </div>
                </div>

                {ordersLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="bg-slate-900/30 rounded-2xl border border-slate-800/60 p-5 space-y-4 animate-pulse">
                        <div className="flex justify-between items-center pb-4 border-b border-slate-900">
                          <div className="h-4 bg-slate-800 rounded w-1/4" />
                          <div className="h-4 bg-slate-800 rounded w-1/6" />
                        </div>
                        <div className="space-y-3 pt-2">
                          <div className="h-3 bg-slate-800 rounded w-1/2" />
                          <div className="h-3 bg-slate-800 rounded w-1/3" />
                        </div>
                        <div className="h-8 bg-slate-800/50 rounded w-full mt-4" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {buyerOrders.map(order => (
                      <div key={order.id} className="bg-slate-900/50 rounded-2xl border border-slate-800 p-5 space-y-4">
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center pb-4 border-b border-slate-950 font-mono text-xs">
                          <div>
                            <span className="text-slate-500 uppercase font-black tracking-widest block text-[9.5px]">Harvest booking ID</span>
                            <strong className="text-white mt-1 block">{order.id}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 uppercase font-black tracking-widest block text-[9.5px]">Receipt Date</span>
                            <span className="text-slate-300 block">{new Date(order.date).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 uppercase font-black tracking-widest block text-[9.5px]">Status Tracker</span>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-block mt-1 ${
                              order.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              order.status === 'Accepted' || order.status === 'Ready for Pickup' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                              order.status === 'Completed' || order.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3 font-mono text-xs">
                          <div className="flex justify-between font-bold text-slate-500 tracking-wider">
                            <span>Items Purchased</span>
                            <span>Amount Subtotal</span>
                          </div>
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-slate-300">
                              <span>{item.productName} (x{item.quantity} {item.unit}) <span className="text-emerald-400">@{item.farmName}</span></span>
                              <span>₹{(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-4 border-t border-slate-950 flex flex-col md:flex-row gap-4 justify-between font-mono text-xs text-slate-400">
                          <div>
                            <span className="text-slate-500 font-bold block text-[10px]">Delivery/Collector Location</span>
                            <span className="text-slate-300 mt-0.5 block">{order.deliveryAddress}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 font-bold block text-[10px]">Collector pickup Slot</span>
                            <span className="text-slate-300 mt-0.5 block">{order.pickupTime}</span>
                          </div>
                          <div className="self-end pt-2 md:pt-0">
                            <span className="text-slate-500 block font-bold text-right text-[10px]">Paid Grand Total</span>
                            <strong className="text-lg text-emerald-400 font-black block mt-0.5">₹{order.total}</strong>
                          </div>
                        </div>

                        {/* Feedback Rating and reviews form direct */}
                        {(order.status === 'Completed' || order.status === 'Delivered') && (
                          <div className="mt-4 pt-4 border-t border-slate-950 flex flex-col space-y-3">
                            <h4 className="text-xs font-bold font-mono text-white flex items-center space-x-1.5">
                              <span>⭐ Direct Farm feedback loops</span>
                            </h4>
                            {order.feedbackText ? (
                              <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 italic text-xs text-slate-400">
                                " {order.feedbackText} " — {order.rating} / 5 Rating stars
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-2 items-center">
                                <span className="text-[11px] text-slate-500 font-mono">Select a product to review:</span>
                                {order.items.map(item => (
                                  <button
                                    key={item.productId}
                                    onClick={() => {
                                      setRatingOrder(order);
                                      setActiveFeedbackProduct(item);
                                    }}
                                    className="px-2.5 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-lg text-[10px] font-bold hover:bg-sky-500 hover:text-slate-950 transition-colors cursor-pointer"
                                  >
                                    Review {item.productName}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    {buyerOrders.length === 0 && (
                      <div className="text-center py-16 bg-slate-900/10 rounded-3xl border border-slate-900">
                        <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <h4 className="font-bold text-white">Your order history is empty.</h4>
                        <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">Purchase fresh vegetables, grains, or dairy from the marketplace to list transactions here!</p>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {/* SAVED WISHLIST VIEW */}
            {activeTab === 'wishlist' && (
              <motion.div
                key="wishlist-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 text-left"
              >
                <div>
                  <h2 className="text-xl font-bold text-white">Saved Wishlist</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Quickly access and add your favorite local crops to your cart.</p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {wishlistProducts.map(product => (
                    <div key={product.id} className="bg-slate-900/40 rounded-2xl border border-slate-800 p-4 space-y-4 flex flex-col justify-between">
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950">
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-full h-full object-cover" 
                        />
                        <button
                          onClick={() => onToggleWishlist(product.id)}
                          className="absolute top-2.5 right-2.5 p-1.5 bg-slate-950/80 hover:bg-slate-900 text-rose-500 rounded-full border border-slate-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-[9px] font-mono rounded text-slate-500 uppercase tracking-widest">{product.category}</span>
                        <h4 className="font-bold text-white text-sm">{product.name}</h4>
                        <div className="flex justify-between items-center text-xs font-mono">
                          <span className="text-slate-500">Price</span>
                          <strong className="text-white">₹{product.price} / {product.unit}</strong>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddToCart(product)}
                        className="w-full py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center space-x-1"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Move to Cart</span>
                      </button>
                    </div>
                  ))}
                </div>

                {wishlistProducts.length === 0 && (
                  <div className="text-center py-16 bg-slate-900/10 rounded-3xl border border-slate-900">
                    <Heart className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h4 className="font-bold text-white">Your Wishlist is Empty</h4>
                    <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">Browse the marketplace and click the heart icons to bookmark your seasonal favorites.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* NOTIFICATIONS DRAWER VIEW */}
            {activeTab === 'notifications' && (
              <motion.div
                key="notifications-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 text-left"
              >
                <div>
                  <h2 className="text-xl font-bold text-white">Alert Notifications</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Real-time alerts, order confirmations, and farmer status adjustments.</p>
                </div>

                <div className="space-y-3 font-mono">
                  {notifications.map(n => (
                    <div 
                      key={n.id} 
                      className={`p-4 rounded-xl border flex gap-4 transition-all ${n.read ? 'bg-slate-950/40 border-slate-900 text-slate-400' : 'bg-slate-900/60 border-slate-800 text-slate-100'}`}
                    >
                      <div className={`p-2 rounded-lg self-start ${n.read ? 'bg-slate-900 text-slate-500' : 'bg-sky-500/10 text-sky-400'}`}>
                        <Bell className="w-4 h-4" />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <h4 className="font-extrabold text-white">{n.title}</h4>
                          <span className="text-[10px] text-slate-500">{new Date(n.date).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-xs leading-relaxed">{n.message}</p>
                        {!n.read && (
                          <button
                            onClick={() => onMarkNotificationRead(n.id)}
                            className="text-[10px] font-bold text-sky-400 hover:underline inline-block mt-1 cursor-pointer"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {notifications.length === 0 && (
                  <div className="text-center py-16 bg-slate-900/10 rounded-3xl border border-slate-900">
                    <Bell className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h4 className="font-bold text-white">Perfect Silence</h4>
                    <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">You do not have any alerts yet.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* DIRECT PROFILE VIEW */}
            {activeTab === 'profile' && (
              <motion.div
                key="profile-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 text-left"
              >
                <div>
                  <h2 className="text-xl font-bold text-white">Direct Profile Coordinates</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Control your delivery addresses and direct checkout configuration.</p>
                </div>

                {profileSuccessMsg && (
                  <div className="p-3 bg-emerald-950/40 text-emerald-405 border border-emerald-900/50 rounded-xl text-xs font-mono">
                    ✅ {profileSuccessMsg}
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4 text-xs font-mono">
                    <div>
                      <label className="block text-slate-400 mb-1.5 font-bold">Your Full Name</label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1.5 font-bold">Your Email Coordinate</label>
                      <input
                        type="email"
                        required
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white"
                      />
                    </div>
                  </div>

                  <div className="text-xs font-mono">
                    <label className="block text-slate-400 mb-1.5 font-bold">Static Delivery Address</label>
                    <input
                      type="text"
                      required
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-xs font-mono">
                    <div>
                      <label className="block text-slate-400 mb-1.5 font-bold">Direct Mobile Number</label>
                      <input
                        type="text"
                        required
                        value={buyerContact}
                        onChange={(e) => setBuyerContact(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1.5 font-bold">Preferred Pick Time Slot</label>
                      <input
                        type="text"
                        required
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs font-mono cursor-pointer transition-colors"
                  >
                    Save Changes
                  </button>
                </form>
              </motion.div>
            )}

            {/* UTILITY SETTINGS VIEW */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 text-left"
              >
                <div>
                  <h2 className="text-xl font-bold text-white">Utility Settings</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Control preferences, interface themes, and security keys.</p>
                </div>

                <div className="bg-slate-900/40 divide-y divide-slate-800 text-xs rounded-2xl border border-slate-800 overflow-hidden font-mono">
                  <div className="p-4 flex justify-between items-center">
                    <div>
                      <strong className="text-white block">Email Alert Syncing</strong>
                      <span className="text-slate-500 text-[11px] mt-0.5 block">Sync order accepted and delivered status to email inbox.</span>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold">ENABLED</span>
                  </div>

                  <div className="p-4 flex justify-between items-center">
                    <div>
                      <strong className="text-white block">Visual Theme Interface</strong>
                      <span className="text-slate-500 text-[11px] mt-0.5 block">Marketplace interface styles. Always Premium Light or Dark cosmic slate theme.</span>
                    </div>
                    <span className="px-2.5 py-1 bg-slate-950 text-slate-405 border border-slate-800 rounded font-bold">DARK COSMIC SLATE</span>
                  </div>

                  <div className="p-4 flex justify-between items-center">
                    <div>
                      <strong className="text-white block">Direct Wallet</strong>
                      <span className="text-slate-500 text-[11px] mt-0.5 block">Auto-authorized card tokens. Secured direct to escrow bank.</span>
                    </div>
                    <span className="px-2 px-1.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded font-bold text-[11px]">💳 ACTIVE TOKEN</span>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* --- CART DRAWER OVERLAY --- */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-slate-950 z-40 cursor-pointer"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-slate-900 border-l border-slate-800 p-6 z-50 flex flex-col justify-between font-mono text-xs text-left"
            >
              <div className="space-y-6 flex-1 overflow-y-auto">
                <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                  <h3 className="font-extrabold text-white text-base flex items-center space-x-2">
                    <ShoppingCart className="w-5 h-5 text-sky-400" />
                    <span>Selected Basket</span>
                  </h3>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="p-1.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {cartItems.map((item, idx) => (
                    <div key={idx} className="flex gap-4 p-3 bg-slate-950/60 rounded-xl border border-slate-850">
                      <img src={item.product.image} alt={item.product.name} className="w-16 h-16 object-cover rounded-md" />
                      <div className="flex-1 space-y-1.5">
                        <h4 className="font-bold text-white leading-tight">{item.product.name}</h4>
                        <span className="text-[10px] text-slate-500">Grown by {item.product.farmName}</span>
                        <div className="flex justify-between items-center pt-2">
                          <strong className="text-emerald-400">₹{(item.product.price * item.qty)}</strong>
                          <div className="flex items-center space-x-2.5">
                            <button 
                              onClick={() => handleUpdateCartQty(item.product.id, -1)}
                              className="w-6 h-6 rounded-md bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:bg-slate-855"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-bold text-white text-xs">{item.qty}</span>
                            <button 
                              onClick={() => handleUpdateCartQty(item.product.id, 1)}
                              className="w-6 h-6 rounded-md bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:bg-slate-855"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {cartItems.length === 0 && (
                    <div className="text-center py-16 text-slate-500">
                      <ShoppingCart className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                      <p>Your basket remains unharvested.</p>
                    </div>
                  )}
                </div>
              </div>

              {cartItems.length > 0 && (
                <div className="pt-6 border-t border-slate-800 space-y-4 bg-slate-900">
                  <div className="flex justify-between font-bold text-white text-sm">
                    <span>Grand Total</span>
                    <strong className="text-emerald-400">₹{cartTotal}</strong>
                  </div>

                  {isCheckoutOpen ? (
                    <form onSubmit={handleOrderSubmission} className="space-y-4 border-t border-slate-80s pt-4">
                      <h4 className="text-white font-bold uppercase tracking-wider text-[11px]">Direct Delivery Dispatch</h4>
                      <div className="space-y-2.5 font-mono text-[11px]">
                        <div>
                          <label className="text-slate-400 block mb-1">Receipt delivery Address</label>
                          <input
                            type="text"
                            required
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-white"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-1">Collector Slot Time</label>
                          <input
                            type="text"
                            required
                            value={pickupTime}
                            onChange={(e) => setPickupTime(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-white"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-1">Emergency phone callback</label>
                          <input
                            type="tel"
                            required
                            value={buyerContact}
                            onChange={(e) => setBuyerContact(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-white"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setIsCheckoutOpen(false)}
                          className="flex-1 py-3 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded-xl font-bold font-mono text-xs text-slate-400 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs rounded-xl transition-colors"
                        >
                          Confirm Order
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setIsCheckoutOpen(true)}
                      className="w-full py-3.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center space-x-1 cursor-pointer shadow-lg shadow-sky-500/10"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Proceed To Checkout</span>
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- FARMER DEEPLINK PROFILE MODAL --- */}
      <AnimatePresence>
        {viewFarmer && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewFarmer(null)}
              className="fixed inset-0 bg-slate-950 z-50 cursor-pointer"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 z-50 shadow-2xl overflow-y-auto max-h-[85vh] text-left"
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <img src={viewFarmer.photo} alt={viewFarmer.farmName} className="w-16 h-16 rounded-2xl object-cover border border-slate-800" />
                  <div>
                    <h3 className="font-extrabold text-white text-base leading-tight">{viewFarmer.farmName}</h3>
                    <span className="text-xs text-emerald-400 font-mono mt-1 block">Tended by {viewFarmer.name}</span>
                    <div className="flex items-center space-x-1 text-[11px] text-slate-500 mt-1 font-mono">
                      <MapPin className="w-3 h-3" />
                      <span>{viewFarmer.village}, {viewFarmer.district}, {viewFarmer.state}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setViewFarmer(null)}
                  className="p-1.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-xl"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <h4 className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">About the grower</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mt-1.5">{viewFarmer.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-950 font-mono text-xs">
                  <h4 className="text-slate-400 font-bold uppercase tracking-wider mb-2">Grower feedback loops</h4>
                  <div className="space-y-3">
                    {feedbacks.filter(f => f.farmerId === viewFarmer.id).map(f => (
                      <div key={f.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-850">
                        <div className="flex justify-between text-[11px]">
                          <strong className="text-white">{f.buyerName}</strong>
                          <span className="text-amber-400">{'★'.repeat(f.rating)}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 italic mt-1">" {f.comment} "</p>
                        <span className="text-[9.5px] text-slate-500 mt-1.5 block">Item: {f.cropName}</span>
                      </div>
                    ))}
                    {feedbacks.filter(f => f.farmerId === viewFarmer.id).length === 0 && (
                      <p className="text-slate-500 text-[11px]">No feedback has been recorded for this agricultural grower yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- ADD RATINGS / REVIEWS MODAL --- */}
      <AnimatePresence>
        {ratingOrder && activeFeedbackProduct && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setRatingOrder(null)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 cursor-pointer"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 z-50 shadow-2xl text-left"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-950">
                <h4 className="font-bold text-white text-sm">Review Product Harvest</h4>
                <button 
                  onClick={() => { setRatingOrder(null); setActiveFeedbackProduct(null); }}
                  className="p-1.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={submitFeedbackRating} className="space-y-4 pt-4 font-mono text-xs">
                <div>
                  <span className="text-slate-500">Product Name</span>
                  <strong className="text-white block mt-1">{activeFeedbackProduct.productName}</strong>
                  <span className="text-[10px] text-emerald-400 mt-0.5 block">Grown by {activeFeedbackProduct.farmName}</span>
                </div>

                <div>
                  <span className="text-slate-500 block mb-1.5">Rating Rating</span>
                  <div className="flex space-x-2 text-lg text-amber-500">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingValue(star)}
                        className="hover:scale-110 transition-transform"
                      >
                        {star <= ratingValue ? '★' : '☆'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block mb-1.5">Written Review</span>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe direct quality, crispness of shipping, or freshness flavor flavor..."
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-white"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => { setRatingOrder(null); setActiveFeedbackProduct(null); }}
                    className="px-4 py-2 bg-slate-950 border border-slate-850 hover:bg-slate-900 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-sky-500 hover:bg-sky-450 text-slate-950 font-bold rounded-xl"
                  >
                    Post Review
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
