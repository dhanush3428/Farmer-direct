export type CropCategory = 'Vegetables' | 'Fruits' | 'Grains' | 'Dairy' | 'Poultry' | 'Honey & Preserves' | 'Herbs & Flowers' | 'Organic Products' | 'Spices';

export interface FarmerProfile {
  id: string;
  name: string;
  farmName: string;
  description: string;
  photo: string;
  pin: string; // 6-digit PIN

  // Made optional for mock data.ts compatibility, fallback-safe
  mobileNumber?: string;
  village?: string;
  district?: string;
  state?: string;
  createdAt?: string;
  
  // Legacy compatibility fields
  contact?: string; 
  location?: string;

  selectedCrops?: string[]; // Multiple choice selected crops during registration
}

export interface BuyerProfile {
  id: string;
  name: string;
  pin: string; // 6-digit PIN
  email?: string;
  deliveryAddress?: string;
  contact?: string;
  createdAt?: string;

  // Legacy compatibility fields
  billingDetails?: string;
  preferredPickupTime?: string;
  preferredPickupLocation?: string;
}

// Support ConsumerProfile alias for complete compatibility
export type ConsumerProfile = BuyerProfile;

export interface CropProduct {
  id: string;
  farmerId: string;
  farmerName: string;
  farmName: string;
  name: string;
  category: CropCategory;
  price: number;
  stock: number; // Backing field
  unit: string; 
  status: 'Draft' | 'Live' | 'Sold Out';
  image: string;
  description: string;
  rating?: number;

  // Made optional for mock data.ts compatibility
  quantity?: number; 
  harvestDate?: string; 
}

export type OrderStatus = 'Pending' | 'Accepted' | 'Completed' | 'Ready for Pickup' | 'Delivered' | 'Declined' | 'Harvesting';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  unit: string;
  farmerId: string;
  farmName: string;
}

export interface Order {
  id: string;
  date: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  deliveryAddress: string;
  pickupTime: string;
  feedbackText?: string;
  rating?: number; // 1-5 stars

  // Made optional for mock data.ts compatibility
  buyerId?: string;
  buyerName?: string;
  buyerContact?: string;

  // Legacy compatibility fields
  consumerId?: string;
  consumerName?: string;
  consumerContact?: string;
}

export interface FarmerFeedback {
  id: string;
  farmerId: string;
  rating: number;
  comment: string;
  date: string;
  cropName: string;

  // Made optional for mock data.ts compatibility
  buyerName?: string;

  // Legacy compatibility fields
  consumerName?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
}
export type AppNotificationType = AppNotification;
