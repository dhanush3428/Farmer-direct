import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sprout, 
  ShoppingBag, 
  Check, 
  Star, 
  ArrowRight, 
  User, 
  Shield, 
  Truck, 
  CreditCard, 
  Store, 
  Menu, 
  X, 
  Heart, 
  Award, 
  Sparkles, 
  MapPin, 
  Phone, 
  Sliders,
  CheckCircle,
  Clock,
  Briefcase,
  Layers,
  Leaf,
  ChevronRight,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import { FarmerProfile, BuyerProfile, CropProduct, Order, FarmerFeedback, AppNotification } from './types';
import { 
  INITIAL_FARMERS, 
  INITIAL_CONSUMERS, 
  INITIAL_CROPS, 
  INITIAL_ORDERS, 
  INITIAL_FEEDBACKS,
  PREMIUM_IMAGES
} from './data';
import Auth from './components/Auth';
import FarmerDashboard from './components/FarmerDashboard';
import BuyerDashboard from './components/BuyerDashboard';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocFromServer, query, where } from 'firebase/firestore';

export default function App() {
  // 1. Core States (Synchronized via LocalStorage fallback and extensible to Firebase Firestore)
  const [farmers, setFarmers] = useState<FarmerProfile[]>([]);
  const [buyers, setBuyers] = useState<BuyerProfile[]>([]);
  const [crops, setCrops] = useState<CropProduct[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [feedbacks, setFeedbacks] = useState<FarmerFeedback[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]); // Array of cropProduct IDs

  // Session state
  const [currentUser, setCurrentUser] = useState<{ role: 'farmer' | 'buyer'; profileId: string } | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);

  // UI state managers
  const [isLoading, setIsLoading] = useState(true);
  const [authView, setAuthView] = useState<'none' | 'active'>('none');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');

  // Categories list
  const homepageCategories = [
    { name: 'Vegetables', desc: 'Freshly harvested roots and greens', count: '12+ Products', icon: Leaf },
    { name: 'Fruits', desc: 'Sweet, tree-ripened organic selections', count: '8+ Products', icon: Sparkles },
    { name: 'Grains', desc: 'Whole stone-milled organic grains', count: '5+ Products', icon: Layers },
    { name: 'Dairy', desc: 'Raw milk, artisanal goat milk cheeses', count: '6+ Products', icon: TrophyIcon },
    { name: 'Organic Products', desc: 'Curated pesticide-free bundles', count: '9+ Products', icon: Sprout },
    { name: 'Spices', desc: 'Handground state herbs and powders', count: '4+ Products', icon: Award }
  ];

  function TrophyIcon(props: any) {
    return <Award {...props} />;
  }

  // 2. Load LocalStorage fallbacks on mount
  useEffect(() => {
    try {
      const storedFarmers = localStorage.getItem('fd_farmers');
      const storedBuyers = localStorage.getItem('fd_buyers');
      const storedCrops = localStorage.getItem('fd_crops');
      const storedOrders = localStorage.getItem('fd_orders');
      const storedFeedbacks = localStorage.getItem('fd_feedbacks');
      const storedAuth = localStorage.getItem('fd_auth_session');
      const storedWishlist = localStorage.getItem('fd_wishlist');
      const storedNotifications = localStorage.getItem('fd_notifications');

      // Farmers
      if (storedFarmers) {
        setFarmers(JSON.parse(storedFarmers));
      } else {
        const preseededFarmers = INITIAL_FARMERS.map(f => ({
          ...f,
          village: f.location.split(',')[0].trim(),
          district: 'Visakhapatnam',
          state: f.location.split(',')[1]?.trim() || 'Andhra Pradesh',
          mobileNumber: f.contact || '+91 98480 22334'
        }));
        setFarmers(preseededFarmers);
        localStorage.setItem('fd_farmers', JSON.stringify(preseededFarmers));
      }

      // Buyers
      if (storedBuyers) {
        setBuyers(JSON.parse(storedBuyers));
      } else {
        const preseededBuyers = INITIAL_CONSUMERS.map(c => ({
          id: c.id,
          name: c.name,
          email: 'buyer@example.com',
          pin: c.pin,
          deliveryAddress: c.deliveryAddress,
          contact: c.contact
        }));
        setBuyers(preseededBuyers);
        localStorage.setItem('fd_buyers', JSON.stringify(preseededBuyers));
      }

      // Crops (Add quantity from stock synonym for perfect resilience)
      if (storedCrops) {
        setCrops(JSON.parse(storedCrops));
      } else {
        const mappedCrops = INITIAL_CROPS.map(c => ({
          ...c,
          quantity: c.stock || 50,
          stock: c.stock || 50,
          harvestDate: '2026-06-12'
        }));
        setCrops(mappedCrops);
        localStorage.setItem('fd_crops', JSON.stringify(mappedCrops));
      }

      // Orders
      if (storedOrders) {
        setOrders(JSON.parse(storedOrders));
      } else {
        setOrders(INITIAL_ORDERS);
        localStorage.setItem('fd_orders', JSON.stringify(INITIAL_ORDERS));
      }

      // Feedbacks
      if (storedFeedbacks) {
        setFeedbacks(JSON.parse(storedFeedbacks));
      } else {
        setFeedbacks(INITIAL_FEEDBACKS);
        localStorage.setItem('fd_feedbacks', JSON.stringify(INITIAL_FEEDBACKS));
      }

      // Session and wishlist
      if (storedAuth) setCurrentUser(JSON.parse(storedAuth));
      if (storedWishlist) setWishlist(JSON.parse(storedWishlist));

      // Notifications
      if (storedNotifications) {
        setNotifications(JSON.parse(storedNotifications));
      } else {
        const defaultNotifications: AppNotification[] = [
          {
            id: 'n-1',
            userId: 'consumer-1',
            title: 'Welcome to Farmer Direct Market!',
            message: 'Connect directly with certified farmers, receive tracking alerts, and manage orders with absolute security.',
            date: new Date().toISOString(),
            read: false
          }
        ];
        setNotifications(defaultNotifications);
        localStorage.setItem('fd_notifications', JSON.stringify(defaultNotifications));
      }

    } catch (e) {
      console.error('Error loading fallback storage:', e);
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  }, []);

  // Validate Connection & Setup real-time subscribers with empty collection auto-seeding
  useEffect(() => {
    if (!firebaseUser) {
      // If the user isn't authenticated yet, do NOT attach listeners to avoid triggering
      // permission-denied errors on startup!
      return;
    }

    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (err) {
        if (err instanceof Error && err.message.includes('offline')) {
          console.warn("Firestore client appears offline or block-listed. Falling back to local state.");
        }
      }
    };
    testConnection();

    // 1. Farmers live-listener (can read all farmers once logged in)
    const unsubFarmers = onSnapshot(collection(db, 'farmers'), async (snapshot) => {
      if (snapshot.empty) {
        const preseededFarmers = INITIAL_FARMERS.map(f => ({
          ...f,
          village: f.location?.split(',')[0].trim() || 'Aganampudi',
          district: 'Visakhapatnam',
          state: f.location?.split(',')[1]?.trim() || 'Andhra Pradesh',
          mobileNumber: f.contact || '+91 98480 22334'
        }));
        for (const f of preseededFarmers) {
          try {
            await setDoc(doc(db, 'farmers', f.id), f);
          } catch (e) {
            console.error('Seeding farmer error:', e);
          }
        }
      } else {
        const list: FarmerProfile[] = [];
        snapshot.forEach(doc => {
          list.push(doc.data() as FarmerProfile);
        });
        setFarmers(list);
        localStorage.setItem('fd_farmers', JSON.stringify(list));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'farmers');
    });

    // 2. Buyers live-listener (Can only read own profile document, so we subscribe directly to it!)
    const unsubBuyers = onSnapshot(doc(db, 'buyers', firebaseUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        const profile = docSnap.data() as BuyerProfile;
        setBuyers([profile]);
        localStorage.setItem('fd_buyers', JSON.stringify([profile]));
      }
    }, (error) => {
      console.warn("Skipping global buyer subscriber or handling limits gracefully:", error);
    });

    // 3. Crops live-listener (authenticated users can read all crops/products)
    const unsubCrops = onSnapshot(collection(db, 'crops'), async (snapshot) => {
      if (snapshot.empty) {
        const mappedCrops = INITIAL_CROPS.map(c => ({
          ...c,
          quantity: c.stock || 50,
          stock: c.stock || 50,
          harvestDate: '2026-06-12'
        }));
        for (const crop of mappedCrops) {
          try {
            await setDoc(doc(db, 'crops', crop.id), crop);
          } catch (e) {
            console.error('Seeding crops error:', e);
          }
        }
      } else {
        const list: CropProduct[] = [];
        snapshot.forEach(doc => {
          list.push(doc.data() as CropProduct);
        });
        setCrops(list);
        localStorage.setItem('fd_crops', JSON.stringify(list));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'crops');
    });

    // 4. Orders live-listener (Only fetch orders of the logged-in buyer or farmer)
    const isFarmerUser = currentUser?.role === 'farmer';
    const profileId = currentUser?.profileId || firebaseUser.uid;
    const ordersQuery = isFarmerUser 
      ? query(collection(db, 'orders'), where('farmerId', '==', profileId))
      : query(collection(db, 'orders'), where('buyerId', '==', profileId));

    const unsubOrders = onSnapshot(ordersQuery, async (snapshot) => {
      if (snapshot.empty) {
        for (const o of INITIAL_ORDERS) {
          try {
            const seededOrder = {
              ...o,
              buyerId: !isFarmerUser ? profileId : o.buyerId || 'consumer-1',
              farmerId: isFarmerUser ? profileId : o.items[0]?.farmerId || 'farmer-1'
            };
            await setDoc(doc(db, 'orders', o.id), seededOrder);
          } catch (e) {
            // Ignored/skipped
          }
        }
      } else {
        const list: Order[] = [];
        snapshot.forEach(doc => {
          list.push(doc.data() as Order);
        });
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setOrders(list);
        localStorage.setItem('fd_orders', JSON.stringify(list));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    // 5. Feedbacks live-listener (can read all feedbacks once logged in)
    const unsubFeedbacks = onSnapshot(collection(db, 'feedbacks'), async (snapshot) => {
      if (snapshot.empty) {
        for (const f of INITIAL_FEEDBACKS) {
          try {
            await setDoc(doc(db, 'feedbacks', f.id), f);
          } catch (e) {
            console.error('Seeding feedback error:', e);
          }
        }
      } else {
        const list: FarmerFeedback[] = [];
        snapshot.forEach(doc => {
          list.push(doc.data() as FarmerFeedback);
        });
        setFeedbacks(list);
        localStorage.setItem('fd_feedbacks', JSON.stringify(list));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'feedbacks');
    });

    // 6. Notifications live-listener (Securely read only own notifications)
    const notifQuery = query(collection(db, 'notifications'), where('userId', '==', firebaseUser.uid));
    const unsubNotifications = onSnapshot(notifQuery, async (snapshot) => {
      if (snapshot.empty) {
        const defaultNotifications: AppNotification[] = [
          {
            id: `n-${Date.now()}`,
            userId: firebaseUser.uid,
            title: 'Welcome to Farmer Direct Market!',
            message: 'Connect directly with certified farmers, receive tracking alerts, and manage orders with absolute security.',
            date: new Date().toISOString(),
            read: false
          }
        ];
        for (const n of defaultNotifications) {
          try {
            await setDoc(doc(db, 'notifications', n.id), n);
          } catch (e) {
            console.error('Seeding notifications error:', e);
          }
        }
      } else {
        const list: AppNotification[] = [];
        snapshot.forEach(doc => {
          list.push(doc.data() as AppNotification);
        });
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setNotifications(list);
        localStorage.setItem('fd_notifications', JSON.stringify(list));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notifications');
    });

    return () => {
      unsubFarmers();
      unsubBuyers();
      unsubCrops();
      unsubOrders();
      unsubFeedbacks();
      unsubNotifications();
    };
  }, [firebaseUser, currentUser]);

  // Sync Firebase Auth states with local session
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user) {
        if (currentUser) {
          setCurrentUser(null);
          localStorage.removeItem('fd_auth_session');
        }
      }
    });
    return () => unsubscribe();
  }, [currentUser]);

  // 3. User operations & Sync callbacks
  const handleLoginSuccess = (role: 'farmer' | 'buyer', profile: FarmerProfile | BuyerProfile) => {
    const session = { role, profileId: profile.id };
    setCurrentUser(session);
    localStorage.setItem('fd_auth_session', JSON.stringify(session));
    setAuthView('none');
  };

  const handleLogout = () => {
    signOut(auth).catch(err => console.error("Firebase Auth signout error:", err));
    setCurrentUser(null);
    localStorage.removeItem('fd_auth_session');
    setAuthView('none');
  };

  // Farmer updates crops listing
  const handleUpdateCrops = async (updatedCrops: CropProduct[]) => {
    // Optimistic state
    setCrops(updatedCrops);
    localStorage.setItem('fd_crops', JSON.stringify(updatedCrops));

    // Sync additions and edits to Firestore
    for (const crop of updatedCrops) {
      const existingCrop = crops.find(c => c.id === crop.id);
      if (!existingCrop || JSON.stringify(existingCrop) !== JSON.stringify(crop)) {
        try {
          await setDoc(doc(db, 'crops', crop.id), crop);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `crops/${crop.id}`);
        }
      }
    }
    // Sync deletions to Firestore
    const deletedCrops = crops.filter(oldCrop => !updatedCrops.some(newCrop => newCrop.id === oldCrop.id));
    for (const crop of deletedCrops) {
      try {
        await deleteDoc(doc(db, 'crops', crop.id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `crops/${crop.id}`);
      }
    }
  };

  // Farmer / Buyer updates orders status
  const handleUpdateOrders = async (updatedOrders: Order[]) => {
    // Optimistic state
    setOrders(updatedOrders);
    localStorage.setItem('fd_orders', JSON.stringify(updatedOrders));

    // Sync to Firestore
    for (const o of updatedOrders) {
      const existingOrder = orders.find(x => x.id === o.id);
      if (!existingOrder || JSON.stringify(existingOrder) !== JSON.stringify(o)) {
        try {
          await setDoc(doc(db, 'orders', o.id), o);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `orders/${o.id}`);
        }
      }
    }

    const deletedOrders = orders.filter(oldOrder => !updatedOrders.some(newOrder => newOrder.id === oldOrder.id));
    for (const o of deletedOrders) {
      try {
        await deleteDoc(doc(db, 'orders', o.id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `orders/${o.id}`);
      }
    }

    // Send visual reactive notification updates to buyer/farmer on status changes
    const lastOrder = updatedOrders[0];
    if (lastOrder) {
      const newNotif: AppNotification = {
        id: `n-${Date.now()}`,
        userId: lastOrder.buyerId || lastOrder.consumerId || '',
        title: `Order Status Update: ${lastOrder.status}`,
        message: `Your direct order #${lastOrder.id} status was changed to ${lastOrder.status} by the farmer.`,
        date: new Date().toISOString(),
        read: false
      };
      try {
        await setDoc(doc(db, 'notifications', newNotif.id), newNotif);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `notifications/${newNotif.id}`);
      }
    }
  };

  // Buyer toggles wishlist bookmarks
  const handleToggleWishlist = (productId: string) => {
    let updated;
    if (wishlist.includes(productId)) {
      updated = wishlist.filter(id => id !== productId);
    } else {
      updated = [...wishlist, productId];
    }
    setWishlist(updated);
    localStorage.setItem('fd_wishlist', JSON.stringify(updated));
  };

  // Buyer places new purchase order
  const handlePlaceOrder = async (items: any[], total: number, address: string, time: string) => {
    if (!currentUser) throw new Error('Must be signed in to purchase.');

    const newOrder: Order = {
      id: `order-${Math.floor(1000 + Math.random() * 9000)}`,
      buyerId: currentUser.profileId,
      buyerName: buyers.find(b => b.id === currentUser.profileId)?.name || 'Anonymous Buyer',
      buyerContact: buyers.find(b => b.id === currentUser.profileId)?.contact || '+1 (555) 123-4567',
      date: new Date().toISOString(),
      items,
      total,
      status: 'Pending',
      deliveryAddress: address,
      pickupTime: time
    };

    // Decrement quantities from products state synonymously
    const updatedCrops = crops.map(c => {
      const orderQuantity = items.find(it => it.productId === c.id)?.quantity || 0;
      if (orderQuantity > 0) {
        const nextStock = Math.max(0, c.stock - orderQuantity);
        return {
          ...c,
          stock: nextStock,
          quantity: nextStock,
          status: (nextStock === 0 ? 'Sold Out' as const : c.status)
        };
      }
      return c;
    });

    // Optimistic update
    setCrops(updatedCrops);
    localStorage.setItem('fd_crops', JSON.stringify(updatedCrops));

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    localStorage.setItem('fd_orders', JSON.stringify(updatedOrders));

    // Push notification alerts
    const newNotif: AppNotification = {
      id: `n-${Date.now()}`,
      userId: currentUser.profileId,
      title: 'Order Booked Directly!',
      message: `Your booking #${newOrder.id} has been registered at the farm. Check updates in My Orders.`,
      date: new Date().toISOString(),
      read: false
    };
    const pushNotificationFarmer: AppNotification = {
      id: `n-farm-${Date.now()}`,
      userId: items[0]?.farmerId || '',
      title: 'New Crop Order Received!',
      message: `A buyer placed a booking for ${items.length} crops. Total billing value is ₹${total.toFixed(2)}.`,
      date: new Date().toISOString(),
      read: false
    };

    const newNotifs = [newNotif, pushNotificationFarmer, ...notifications];
    setNotifications(newNotifs);
    localStorage.setItem('fd_notifications', JSON.stringify(newNotifs));

    // Write new order to Firestore
    try {
      await setDoc(doc(db, 'orders', newOrder.id), newOrder);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `orders/${newOrder.id}`);
    }

    // Write updated crops back to Firestore
    for (const c of updatedCrops) {
      const isOrdered = items.some(it => it.productId === c.id);
      if (isOrdered) {
        try {
          await setDoc(doc(db, 'crops', c.id), c);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `crops/${c.id}`);
        }
      }
    }

    // Write notifications to Firestore
    try {
      await setDoc(doc(db, 'notifications', newNotif.id), newNotif);
      await setDoc(doc(db, 'notifications', pushNotificationFarmer.id), pushNotificationFarmer);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'notifications');
    }

    return newOrder;
  };

  // Buyer updates profile fields
  const handleUpdateBuyerProfile = async (updatedBuyer: BuyerProfile) => {
    const nextBuyers = buyers.map(b => b.id === updatedBuyer.id ? updatedBuyer : b);
    setBuyers(nextBuyers);
    localStorage.setItem('fd_buyers', JSON.stringify(nextBuyers));

    try {
      await setDoc(doc(db, 'buyers', updatedBuyer.id), updatedBuyer);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `buyers/${updatedBuyer.id}`);
    }
  };

  // Buyer posts rating reviews
  const handleAddFeedback = async (fData: any) => {
    const feedbackRecord: FarmerFeedback = {
      id: `review-${Date.now()}`,
      ...fData,
      date: new Date().toISOString()
    };
    
    // Add to list optimistically
    const updatedFeedbacks = [feedbackRecord, ...feedbacks];
    setFeedbacks(updatedFeedbacks);
    localStorage.setItem('fd_feedbacks', JSON.stringify(updatedFeedbacks));

    try {
      await setDoc(doc(db, 'feedbacks', feedbackRecord.id), feedbackRecord);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `feedbacks/${feedbackRecord.id}`);
    }

    // Update order reference text to verify rating is completed
    const matchedOrderId = orders.find(o => o.buyerId === currentUser?.profileId && o.items.some(it => it.productId === fData.productId))?.id;
    if (matchedOrderId) {
      const nextOrders = orders.map(o => o.id === matchedOrderId ? { ...o, feedbackText: fData.comment, rating: fData.rating } : o);
      setOrders(nextOrders);
      localStorage.setItem('fd_orders', JSON.stringify(nextOrders));

      const updatedOrder = nextOrders.find(o => o.id === matchedOrderId);
      if (updatedOrder) {
        try {
          await setDoc(doc(db, 'orders', matchedOrderId), updatedOrder);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `orders/${matchedOrderId}`);
        }
      }
    }
  };

  // Mark notification read
  const handleMarkNotificationRead = async (id: string) => {
    const matchedNotif = notifications.find(n => n.id === id);
    if (matchedNotif) {
      const updated = { ...matchedNotif, read: true };
      const nextNotifs = notifications.map(n => n.id === id ? updated : n);
      setNotifications(nextNotifs);
      localStorage.setItem('fd_notifications', JSON.stringify(nextNotifs));

      try {
        await setDoc(doc(db, 'notifications', id), updated);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `notifications/${id}`);
      }
    }
  };

  // Register farmer from Auth callback
  const handleRegisterFarmer = async (farmerData: any): Promise<FarmerProfile> => {
    const newFarmer: FarmerProfile = {
      id: `farmer-${Date.now().toString().slice(-4)}`,
      ...farmerData,
      createdAt: new Date().toISOString()
    };
    const nextFarmers = [...farmers, newFarmer];
    setFarmers(nextFarmers);
    localStorage.setItem('fd_farmers', JSON.stringify(nextFarmers));

    try {
      await setDoc(doc(db, 'farmers', newFarmer.id), newFarmer);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `farmers/${newFarmer.id}`);
    }
    return newFarmer;
  };

  // Register buyer from Auth callback
  const handleRegisterBuyer = async (buyerData: any): Promise<BuyerProfile> => {
    const newBuyer: BuyerProfile = {
      id: `buyer-${Date.now().toString().slice(-4)}`,
      ...buyerData,
      createdAt: new Date().toISOString()
    };
    const nextBuyers = [...buyers, newBuyer];
    setBuyers(nextBuyers);
    localStorage.setItem('fd_buyers', JSON.stringify(nextBuyers));

    try {
      await setDoc(doc(db, 'buyers', newBuyer.id), newBuyer);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `buyers/${newBuyer.id}`);
    }
    return newBuyer;
  };

  // Scroll handler helper
  const scrollToAnchor = (id: string) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  // Get active profiles
  const activeBuyerObj = useMemo(() => {
    if (currentUser?.role === 'buyer') {
      return buyers.find(b => b.id === currentUser.profileId);
    }
    return null;
  }, [currentUser, buyers]);

  const activeFarmerObj = useMemo(() => {
    if (currentUser?.role === 'farmer') {
      return farmers.find(f => f.id === currentUser.profileId);
    }
    return null;
  }, [currentUser, farmers]);

  // Filters featured products based on Category Selection
  const displayFeaturedProducts = useMemo(() => {
    return crops.filter(c => {
      if (c.status === 'Draft') return false;
      return selectedCategoryFilter === 'All' || c.category === selectedCategoryFilter;
    }).slice(0, 8);
  }, [crops, selectedCategoryFilter]);

  // Loading skeleton rendering
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <Sprout className="w-12 h-12 text-emerald-400 animate-spin" />
        <span className="text-xs font-mono tracking-widest text-slate-500">GROWING MARKET SPACE...</span>
      </div>
    );
  }

  // Auth gate viewing
  if (authView === 'active') {
    return (
      <Auth 
        onLoginSuccess={handleLoginSuccess}
        onRegisterFarmer={handleRegisterFarmer}
        onRegisterBuyer={handleRegisterBuyer}
        farmers={farmers}
        buyers={buyers}
      />
    );
  }

  // Session routed dashboards
  if (currentUser) {
    if (currentUser.role === 'farmer' && activeFarmerObj) {
      return (
        <FarmerDashboard 
          currentFarmer={activeFarmerObj}
          crops={crops}
          orders={orders}
          feedbacks={feedbacks}
          onUpdateCrops={handleUpdateCrops}
          onUpdateOrders={handleUpdateOrders}
          onLogout={handleLogout}
        />
      );
    }

    if (currentUser.role === 'buyer' && activeBuyerObj) {
      return (
        <BuyerDashboard 
          currentBuyer={activeBuyerObj}
          crops={crops}
          orders={orders}
          farmers={farmers}
          feedbacks={feedbacks}
          notifications={notifications}
          wishlistProductIds={wishlist}
          onToggleWishlist={handleToggleWishlist}
          onPlaceOrder={handlePlaceOrder}
          onUpdateBuyerProfile={handleUpdateBuyerProfile}
          onAddFeedback={handleAddFeedback}
          onMarkNotificationRead={handleMarkNotificationRead}
          onLogout={handleLogout}
        />
      );
    }
  }

  // --- LANDING PAGE FRONTEND ---
  return (
    <div id="landing-body" className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* 1. STICKY STYLIFIED NAVBAR */}
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
              <Sprout className="w-6 h-6" />
            </div>
            <span className="text-xl font-black tracking-tight text-white font-sans">Farmer Direct</span>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center space-x-8 text-slate-400 text-xs font-semibold">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-emerald-400 transition-colors cursor-pointer">Home</button>
            <button onClick={() => scrollToAnchor('categories')} className="hover:text-emerald-400 transition-colors cursor-pointer">Categories</button>
            <button onClick={() => setAuthView('active')} className="hover:text-emerald-400 transition-colors cursor-pointer">Become a Farmer</button>
            <button onClick={() => scrollToAnchor('how-it-works')} className="hover:text-emerald-400 transition-colors cursor-pointer">About Us</button>
          </div>

          <div className="hidden md:flex items-center space-x-3.5">
            <button 
              onClick={() => setAuthView('active')}
              className="text-xs font-bold text-slate-300 hover:text-white px-4 py-2 hover:bg-slate-900 rounded-xl transition-all"
            >
              Log In
            </button>
            <button 
              onClick={() => setAuthView('active')}
              className="text-xs font-bold bg-emerald-500 hover:bg-emerald-450 active:bg-emerald-600 text-slate-950 px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
            >
              Become a Buyer
            </button>
          </div>

          {/* Mobile toggle */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile menu panel */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-slate-950 border-t border-slate-900 overflow-hidden px-4 py-4 space-y-3 font-mono text-xs text-left"
            >
              <button onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setMobileMenuOpen(false); }} className="block w-full py-2 text-slate-400">Home</button>
              <button onClick={() => scrollToAnchor('categories')} className="block w-full py-2 text-slate-400">Categories</button>
              <button onClick={() => { setAuthView('active'); setMobileMenuOpen(false); }} className="block w-full py-2 text-slate-400">Become a Farmer</button>
              <button onClick={() => scrollToAnchor('how-it-works')} className="block w-full py-2 text-slate-400">How It Works</button>
              <button onClick={() => { setAuthView('active'); setMobileMenuOpen(false); }} className="block w-full py-2 text-slate-400 font-bold text-emerald-400">Sign In Portal</button>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* 2. PREMIUM HERO SECTION */}
      <section className="relative py-20 lg:py-28 overflow-hidden max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Ambient glow nodes */}
        <div className="absolute top-1/3 left-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute right-10 bottom-1/3 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-3.5 py-1.5 rounded-full font-sans shadow-sm">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Direct Farm-to-Table Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
              Fresh From Farmers.<br />
              <span className="bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">Direct To Your Home.</span>
            </h1>

            <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-lg">
              Buy directly from verified local growers. Support agricultural communities with 100% fair trade values on pesticide-free vegetables, raw milk, and whole grains.
            </p>

            <div className="flex flex-wrap gap-4 pt-3">
              <button 
                onClick={() => setAuthView('active')}
                className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-450 active:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/10 flex items-center space-x-2 cursor-pointer"
              >
                <span>Register as Buyer</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <button 
                onClick={() => setAuthView('active')}
                className="px-6 py-3.5 bg-slate-900 hover:bg-slate-850 text-white font-extrabold text-xs rounded-xl transition-all border border-slate-800 hover:border-slate-700 flex items-center space-x-2 cursor-pointer"
              >
                <span>Register as Farmer</span>
              </button>
            </div>

            <div className="flex items-center space-x-6 pt-6 mt-4 border-t border-slate-900 font-sans text-xs">
              <div>
                <strong className="text-white text-lg block font-extrabold">120+</strong>
                <span className="text-slate-500 text-[11px] block mt-0.5">Verified Farms</span>
              </div>
              <div className="w-px h-8 bg-slate-900" />
              <div>
                <strong className="text-white text-lg block font-extrabold">2.4k+</strong>
                <span className="text-slate-500 text-[11px] block mt-0.5">Satisfied Buyers</span>
              </div>
              <div className="w-px h-8 bg-slate-900" />
              <div>
                <strong className="text-white text-lg block font-extrabold">0%</strong>
                <span className="text-slate-500 text-[11px] block mt-0.5">Middlemen Fees</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 relative">
            <div className="aspect-square bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative group">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent z-10" />
              <img 
                src="https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&q=80&w=800" 
                alt="Direct vegetable farming" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              />
              
              {/* Dynamic info widget inside image */}
              <div className="absolute bottom-6 left-6 right-6 z-20 bg-slate-950/80 backdrop-blur-md p-4 rounded-2xl border border-slate-800 flex items-center justify-between font-sans">
                <div className="flex items-center space-x-3 text-xs">
                  <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 block font-bold leading-none">Guaranteed Quality</span>
                    <strong className="text-white block mt-1">100% Bio-Organic Growers</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. PRODUCT CATEGORIES GRID */}
      <section id="categories" className="py-20 bg-slate-900/20 border-t border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-emerald-400 font-mono text-[10px] uppercase tracking-widest font-bold">Nature Catalogs</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">Product Categories</h2>
            <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">Choose categories to filter crops directly at premium local farms.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {homepageCategories.map((c, i) => {
              const IconComp = c.icon;
              return (
                <div 
                  key={i} 
                  onClick={() => { setSelectedCategoryFilter(c.name); scrollToAnchor('featured-products'); }}
                  className="p-6 bg-slate-900/40 rounded-2xl border border-slate-850 hover:border-emerald-500/40 hover:bg-slate-900 transition-all duration-300 group cursor-pointer"
                >
                  <div className="p-3 bg-slate-950 text-emerald-400 rounded-xl border border-slate-900 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors self-start inline-block mb-6">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1.5">{c.name}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{c.desc}</p>
                  <div className="flex justify-between items-center pt-4 mt-6 border-t border-slate-950 font-mono text-[10px] text-slate-400 group-hover:text-emerald-400 transition-colors">
                    <span>{c.count}</span>
                    <span className="font-extrabold uppercase">Filter Crops →</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 4. FEATURED PRODUCTS SECTION */}
      <section id="featured-products" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 text-left">
          <div>
            <span className="text-emerald-400 font-mono text-[10px] uppercase tracking-widest font-bold">Direct Deliveries</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">Seasonal Featured Products</h2>
          </div>
          
          {/* Filtering buttons */}
          <div className="flex flex-wrap items-center gap-1.5 mt-4 md:mt-0 font-mono text-[10.5px]">
            <button
              onClick={() => setSelectedCategoryFilter('All')}
              className={`px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer ${selectedCategoryFilter === 'All' ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'}`}
            >
              All Crops
            </button>
            {['Vegetables', 'Fruits', 'Grains', 'Dairy', 'Spices'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer ${selectedCategoryFilter === cat ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-emerald-800'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayFeaturedProducts.map(product => (
            <div key={product.id} className="bg-slate-900/40 rounded-2xl border border-slate-850/80 overflow-hidden flex flex-col justify-between group text-left">
              <div className="relative aspect-video rounded-t-xl bg-slate-950 overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  referreypolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 bg-slate-950 text-[8px] font-mono text-emerald-400 font-black rounded border border-slate-850 uppercase">
                  {product.category}
                </span>
              </div>

              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-white text-xs sm:text-sm line-clamp-1 group-hover:text-emerald-400 transition-colors">{product.name}</h3>
                  <p className="text-[11.5px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">{product.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-950 space-y-1 font-mono text-[11px] text-slate-400">
                  <div className="flex justify-between">
                    <span>Rate</span>
                    <strong className="text-white">₹{product.price} / {product.unit}</strong>
                  </div>
                  <div className="flex justify-between items-center pt-0.5">
                    <span>Farm Owner</span>
                    <span className="text-slate-300 font-bold truncate max-w-[125px]">{product.farmName}</span>
                  </div>
                </div>
              </div>

              <div className="px-4 pb-4">
                <button
                  onClick={() => setAuthView('active')}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-450 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Go to Checkout</span>
                </button>
              </div>
            </div>
          ))}
        </div>

      </section>

      {/* 5. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-20 bg-slate-900/10 border-t border-slate-900 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-xl mb-16">
            <span className="text-emerald-400 font-mono text-[10px] uppercase tracking-widest font-bold">Secure Pipelines</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Direct Trade. Four Simple Steps.</h2>
            <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">No warehouse storage, no broker cuts, completely localized checkout.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 font-mono text-xs">
            
            <div className="p-6 bg-slate-900/40 rounded-2xl border border-slate-850 relative">
              <div className="w-8 h-8 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-lg flex items-center justify-center border border-emerald-500/20 mb-6">
                01
              </div>
              <h3 className="text-sm font-bold text-white mb-2 font-sans">Account Verification</h3>
              <p className="text-slate-500 leading-relaxed">Farmers verify using mobile OTP and secure 6-digit PIN identifiers, Buyers enter with key email routes.</p>
            </div>

            <div className="p-6 bg-slate-900/40 rounded-2xl border border-slate-850 relative">
              <div className="w-8 h-8 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-lg flex items-center justify-center border border-emerald-500/20 mb-6 font-mono">
                02
              </div>
              <h3 className="text-sm font-bold text-white mb-2 font-sans">Organic Cataloging</h3>
              <p className="text-slate-500 leading-relaxed">Growers catalog seasonal crop availability, unit-pricing, description models, and upload premium assets.</p>
            </div>

            <div className="p-6 bg-slate-900/40 rounded-2xl border border-slate-850 relative">
              <div className="w-8 h-8 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-lg flex items-center justify-center border border-emerald-500/20 mb-6 font-mono">
                03
              </div>
              <h3 className="text-sm font-bold text-white mb-2 font-sans">Transparent Buying</h3>
              <p className="text-slate-500 leading-relaxed">Buyers apply district, state, and price range parameters to secure their baskets without brokerage commission markups.</p>
            </div>

            <div className="p-6 bg-slate-900/40 rounded-2xl border border-slate-850 relative">
              <div className="w-8 h-8 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-lg flex items-center justify-center border border-emerald-500/20 mb-6 font-mono">
                04
              </div>
              <h3 className="text-sm font-bold text-white mb-2 font-sans">Cooperative Fulfillment</h3>
              <p className="text-slate-500 leading-relaxed">Growers accept bookings and bundle crisp fresh dispatch, and Buyers collect directly or schedule delivery drops safely.</p>
            </div>

          </div>

        </div>
      </section>

      {/* 6. BENEFITS SECTION */}
      <section className="py-20 bg-slate-950 border-t border-slate-900 text-left max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6">
            <span className="text-emerald-400 font-mono text-[10px] uppercase tracking-widest font-bold">Why Direct Trade?</span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Earning Fair Trade For Generations</h2>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Standard agricultural sales pipelines funnel up to 60% of margins to shipping networks, warehouse storages, and wholesale corporate brokers. In our ecosystem, the farmer sets their prize and collects 100% of the value.
            </p>

            <div className="space-y-4 pt-4 text-xs font-mono">
              <div className="flex items-start space-x-3">
                <div className="p-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-400 shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <strong className="text-white block font-sans">Instant Regional Tracking</strong>
                  <span className="text-slate-500 text-[11px] block mt-0.5">Locate crops instantly using custom state and district dashboard queries.</span>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="p-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-400 shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <strong className="text-white block font-sans">Biodynamic Verification</strong>
                  <span className="text-slate-500 text-[11px] block mt-0.5">Connect with family-run farms practising certified organic, spray-free methods.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-slate-900/20 border border-slate-900 rounded-3xl space-y-2">
              <Shield className="w-8 h-8 text-emerald-400" />
              <h4 className="font-bold text-white text-xs font-sans">100% Escrow Protection</h4>
              <p className="text-slate-500 text-[11px] leading-relaxed">Funds are securely tokenized and released only when buyer receives the crisp fresh harvest.</p>
            </div>

            <div className="p-6 bg-slate-900/20 border border-slate-900 rounded-3xl space-y-2">
              <Truck className="w-8 h-8 text-emerald-400" />
              <h4 className="font-bold text-white text-xs font-sans">No Storage Depots</h4>
              <p className="text-slate-500 text-[11px] leading-relaxed">Crops are packed within hours of harvesting, fully preserving enzymes and crisp delicious taste.</p>
            </div>

            <div className="p-6 bg-slate-900/20 border border-slate-900 rounded-3xl space-y-2">
              <CreditCard className="w-8 h-8 text-emerald-400" />
              <h4 className="font-bold text-white text-xs font-sans">Direct Farm-Gate Fees</h4>
              <p className="text-slate-500 text-[11px] leading-relaxed">Buyers access straight wholesale farm prices, entirely cutting out modern chain markups.</p>
            </div>

            <div className="p-6 bg-slate-900/20 border border-slate-900 rounded-3xl space-y-2">
              <Store className="w-8 h-8 text-emerald-400" />
              <h4 className="font-bold text-white text-xs font-sans">Regional Farmer Autonomy</h4>
              <p className="text-slate-500 text-[11px] leading-relaxed">Farmers edit crop structures, manage custom quantities, and configure harvest timings instantly.</p>
            </div>
          </div>

        </div>
      </section>

      {/* 7. VISUALLY ELEGANT FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6 font-mono text-[11px] text-slate-500">
          <div className="flex items-center space-x-2 text-slate-400 font-sans">
            <Sprout className="w-5 h-5 text-emerald-400" />
            <strong className="text-white font-extrabold text-sm">Farmer Direct Market</strong>
          </div>
          <div>
            <span>© 2026 Farmer Direct alliance. Practising clean, fair-trade agricultural commerce.</span>
          </div>
          <div className="flex space-x-6">
            <span className="hover:text-white cursor-pointer" onClick={() => setAuthView('active')}>Farmer Login</span>
            <span className="hover:text-white cursor-pointer" onClick={() => setAuthView('active')}>Buyer Login</span>
            <span className="hover:text-white cursor-pointer" onClick={() => scrollToAnchor('how-it-works')}>Security Protocol</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
