import { CropProduct, FarmerProfile, ConsumerProfile, Order, FarmerFeedback } from './types';

// High quality Indian agriculture and nature Unsplash images
export const PREMIUM_IMAGES = {
  farm1: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=600', // Lush fields
  farm2: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&q=80&w=600', // Protected farm structure
  farm3: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&q=80&w=600', // Farmer working
  farm4: 'https://images.unsplash.com/photo-1534017264815-a4e723c21a41?auto=format&fit=crop&q=80&w=600', // Natural orchard
  
  // Products
  tomato: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600',
  onion: 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&q=80&w=600',
  potato: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=600',
  brinjal: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=600',
  okra: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?auto=format&fit=crop&q=80&w=600',
  cauliflower: 'https://images.unsplash.com/photo-1568584711271-6c929fb49b60?auto=format&fit=crop&q=80&w=600',
  carrot: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&q=80&w=600',
  mango: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&q=80&w=600',
  banana: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&q=80&w=600',
  coconut: 'https://images.unsplash.com/photo-1525203135335-74d272fc8d9c?auto=format&fit=crop&q=80&w=600',
  rice: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600',
  wheat: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=600',
  cowMilk: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=600',
  curd: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=80&w=600',
  paneer: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=600',
  ghee: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&q=80&w=600',
  eggs: 'https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?auto=format&fit=crop&q=80&w=600',
  countryChicken: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&q=80&w=600'
};

// All available product presets grouped strictly by Indian categories as requested
export const CROP_PRESETS = [
  // Vegetables
  { name: 'Tomato', category: 'Vegetables' as const, image: PREMIUM_IMAGES.tomato, defaultUnit: 'kg', defaultPrice: 30, description: 'Fresh farm ripened red tomatoes. Firm, juicy and completely pesticide-free.' },
  { name: 'Onion', category: 'Vegetables' as const, image: PREMIUM_IMAGES.onion, defaultUnit: 'kg', defaultPrice: 25, description: 'High quality pink onions sourced directly from the fields.' },
  { name: 'Potato', category: 'Vegetables' as const, image: PREMIUM_IMAGES.potato, defaultUnit: 'kg', defaultPrice: 22, description: 'Freshly harvested soil potatoes, ideal for home cooking.' },
  { name: 'Brinjal', category: 'Vegetables' as const, image: PREMIUM_IMAGES.brinjal, defaultUnit: 'kg', defaultPrice: 28, description: 'Fresh purple brinjals with a glossy skin and rich texture.' },
  { name: 'Okra', category: 'Vegetables' as const, image: PREMIUM_IMAGES.okra, defaultUnit: 'kg', defaultPrice: 35, description: 'Tender ladyfinger/bhindi plucked at the ideal time.' },
  { name: 'Cabbage', category: 'Vegetables' as const, image: PREMIUM_IMAGES.cauliflower, defaultUnit: 'kg', defaultPrice: 24, description: 'Solid leafed fresh green cabbages.' },
  { name: 'Cauliflower', category: 'Vegetables' as const, image: PREMIUM_IMAGES.cauliflower, defaultUnit: 'piece', defaultPrice: 30, description: 'Crispy, cream-colored cauliflower heads.' },
  { name: 'Carrot', category: 'Vegetables' as const, image: PREMIUM_IMAGES.carrot, defaultUnit: 'kg', defaultPrice: 40, description: 'Sweet, orange, locally-grown nutritious carrots.' },
  { name: 'Beans', category: 'Vegetables' as const, image: PREMIUM_IMAGES.okra, defaultUnit: 'kg', defaultPrice: 45, description: 'Fresh, stringless green beans packed with flavor.' },
  { name: 'Green Chilli', category: 'Vegetables' as const, image: PREMIUM_IMAGES.tomato, defaultUnit: 'kg', defaultPrice: 50, description: 'Super spicy green chillies perfect for everyday cooking.' },
  { name: 'Bottle Gourd', category: 'Vegetables' as const, image: PREMIUM_IMAGES.farm3, defaultUnit: 'piece', defaultPrice: 20, description: 'Hydrating, fresh lauki grown on organic trellises.' },
  { name: 'Bitter Gourd', category: 'Vegetables' as const, image: PREMIUM_IMAGES.farm3, defaultUnit: 'kg', defaultPrice: 35, description: 'Healthy and natural, nutrient-dense fresh bitter gourds.' },
  { name: 'Pumpkin', category: 'Vegetables' as const, image: PREMIUM_IMAGES.farm1, defaultUnit: 'piece', defaultPrice: 40, description: 'Rich, golden organic pumpkins grown in sunlit fields.' },

  // Fruits
  { name: 'Mango', category: 'Fruits' as const, image: PREMIUM_IMAGES.mango, defaultUnit: 'kg', defaultPrice: 120, description: 'Vibrant and extremely sweet local Banganapalli/Alphonso mangoes.' },
  { name: 'Banana', category: 'Fruits' as const, image: PREMIUM_IMAGES.banana, defaultUnit: 'dozen', defaultPrice: 50, description: 'Rich, sun-ripened sweet yellow bananas.' },
  { name: 'Papaya', category: 'Fruits' as const, image: PREMIUM_IMAGES.mango, defaultUnit: 'piece', defaultPrice: 45, description: 'Fresh sweet local papaya with deep-orange flesh.' },
  { name: 'Guava', category: 'Fruits' as const, image: PREMIUM_IMAGES.banana, defaultUnit: 'kg', defaultPrice: 60, description: 'Crisp green guavas with delicious pink/white sweet pulp.' },
  { name: 'Orange', category: 'Fruits' as const, image: PREMIUM_IMAGES.tomato, defaultUnit: 'kg', defaultPrice: 90, description: 'Vibrant Nagpur oranges packed with juicy tangy citrus.' },
  { name: 'Pomegranate', category: 'Fruits' as const, image: PREMIUM_IMAGES.mango, defaultUnit: 'kg', defaultPrice: 140, description: 'Ruby red arils filled with sweet nutrient-dense juices.' },
  { name: 'Watermelon', category: 'Fruits' as const, image: PREMIUM_IMAGES.coconut, defaultUnit: 'piece', defaultPrice: 60, description: 'Refreshing, giant sweet red-fleshed watermelons.' },
  { name: 'Coconut', category: 'Fruits' as const, image: PREMIUM_IMAGES.coconut, defaultUnit: 'piece', defaultPrice: 25, description: 'Fresh green tender coconut with nutritious sweet water.' },

  // Grains
  { name: 'Rice', category: 'Grains' as const, image: PREMIUM_IMAGES.rice, defaultUnit: 'quintal', defaultPrice: 3800, description: 'Vilasams, premium quality double-polished raw sona masoori rice.' },
  { name: 'Corn', category: 'Grains' as const, image: PREMIUM_IMAGES.wheat, defaultUnit: 'quintal', defaultPrice: 2200, description: 'Sun-dried high-quality corn kernels.' },
  { name: 'Wheat', category: 'Grains' as const, image: PREMIUM_IMAGES.wheat, defaultUnit: 'kg', defaultPrice: 28, description: 'Harvested organic whole wheat grains, perfect for high-fiber atta.' },
  { name: 'Ragi', category: 'Grains' as const, image: PREMIUM_IMAGES.wheat, defaultUnit: 'kg', defaultPrice: 45, description: 'Nutrient-rich finger millet grains sourced directly.' },
  { name: 'Jowar', category: 'Grains' as const, image: PREMIUM_IMAGES.rice, defaultUnit: 'kg', defaultPrice: 52, description: 'Organic white sorghum grains for healthy traditional bhakri.' },
  { name: 'Bajra', category: 'Grains' as const, image: PREMIUM_IMAGES.rice, defaultUnit: 'kg', defaultPrice: 38, description: 'Farmed pearl millet grains, high in dietary fiber and protein.' },

  // Dairy
  { name: 'Cow Milk', category: 'Dairy' as const, image: PREMIUM_IMAGES.cowMilk, defaultUnit: 'litre', defaultPrice: 55, description: 'Pure, grass-fed fresh cow milk pasteurized with love.' },
  { name: 'Buffalo Milk', category: 'Dairy' as const, image: PREMIUM_IMAGES.cowMilk, defaultUnit: 'litre', defaultPrice: 68, description: 'Rich, high-fat fresh buffalo milk perfect for homemade ghee and curd.' },
  { name: 'Curd', category: 'Dairy' as const, image: PREMIUM_IMAGES.curd, defaultUnit: 'litre', defaultPrice: 65, description: 'Thick, creamy, set curd prepared fresh on our dairy farm.' },
  { name: 'Paneer', category: 'Dairy' as const, image: PREMIUM_IMAGES.paneer, defaultUnit: 'kg', defaultPrice: 340, description: 'Fresh, soft cottage cheese processed hygienically using pure cow milk.' },
  { name: 'Ghee', category: 'Dairy' as const, image: PREMIUM_IMAGES.ghee, defaultUnit: 'litre', defaultPrice: 650, description: 'Aromatic traditional bilona cow ghee made by melting hand-churned butter.' },
  { name: 'Butter', category: 'Dairy' as const, image: PREMIUM_IMAGES.paneer, defaultUnit: 'kg', defaultPrice: 450, description: 'Fresh, creamy unsalted white farm butter.' },

  // Poultry
  { name: 'Eggs', category: 'Poultry' as const, image: PREMIUM_IMAGES.eggs, defaultUnit: 'dozen', defaultPrice: 72, description: 'Farm fresh high-protein poultry eggs collected every morning.' },
  { name: 'Country Chicken', category: 'Poultry' as const, image: PREMIUM_IMAGES.countryChicken, defaultUnit: 'kg', defaultPrice: 280, description: 'Healthy free-range country chicken reared organically.' },
  { name: 'Broiler Chicken', category: 'Poultry' as const, image: PREMIUM_IMAGES.countryChicken, defaultUnit: 'kg', defaultPrice: 160, description: 'Fresh processed broiler chicken meat cleaned thoroughly.' }
];

// High-quality local Indian farmers with proper local profiles and selected crops
export const INITIAL_FARMERS: FarmerProfile[] = [
  {
    id: 'farmer-1',
    name: 'Ramesh Naidu',
    farmName: 'Ramesh Family Agro Farm',
    location: 'Aganampudi, Andhra Pradesh',
    description: 'We grow premium Sona Masoori Rice, fresh vine Tomatoes, and organic Potatoes. Practicing natural and eco-friendly farming for over 22 years.',
    photo: PREMIUM_IMAGES.farm1,
    contact: '+91 98480 22334',
    pin: '123456',
    selectedCrops: ['Tomato', 'Onion', 'Potato', 'Rice', 'Wheat']
  },
  {
    id: 'farmer-2',
    name: 'Srinivasa Rao',
    farmName: 'Sri Venkateswara Dairy & Poultry',
    location: 'Pendurthi, Andhra Pradesh',
    description: 'Fresh cow milk, buffalo milk, fresh country eggs, and pure artisanal curd processed right in our facility in Pendurthi.',
    photo: PREMIUM_IMAGES.farm4,
    contact: '+91 94401 55667',
    pin: '654321',
    selectedCrops: ['Cow Milk', 'Buffalo Milk', 'Curd', 'Paneer', 'Eggs', 'Country Chicken']
  }
];

export const INITIAL_CONSUMERS: ConsumerProfile[] = [
  {
    id: 'consumer-1',
    name: 'Kiran Kumar',
    contact: '+91 88970 33441',
    deliveryAddress: 'Flat 402, Sai Residency, Gajuwaka, Andhra Pradesh 530026',
    billingDetails: 'UPI / NetBanking payment details linked',
    pin: '111111',
    preferredPickupTime: 'Morning Delivery (7:00 AM - 10:00 AM)',
    preferredPickupLocation: 'Gajuwaka Local Direct Center'
  }
];

export const INITIAL_CROPS: CropProduct[] = [
  {
    id: 'crop-1',
    farmerId: 'farmer-1',
    farmerName: 'Ramesh Naidu',
    farmName: 'Ramesh Family Agro Farm',
    name: 'Tomato',
    category: 'Vegetables',
    price: 30,
    unit: 'kg',
    stock: 120,
    status: 'Live',
    image: PREMIUM_IMAGES.tomato,
    description: 'Fresh farm ripened red tomatoes. Firm, juicy and completely pesticide-free.',
    rating: 4.9
  },
  {
    id: 'crop-2',
    farmerId: 'farmer-1',
    farmerName: 'Ramesh Naidu',
    farmName: 'Ramesh Family Agro Farm',
    name: 'Rice',
    category: 'Grains',
    price: 3800,
    unit: 'quintal',
    stock: 50,
    status: 'Live',
    image: PREMIUM_IMAGES.rice,
    description: 'Vilasams, premium quality double-polished raw sona masoori rice.',
    rating: 4.8
  },
  {
    id: 'crop-3',
    farmerId: 'farmer-1',
    farmerName: 'Ramesh Naidu',
    farmName: 'Ramesh Family Agro Farm',
    name: 'Onion',
    category: 'Vegetables',
    price: 25,
    unit: 'kg',
    stock: 200,
    status: 'Live',
    image: PREMIUM_IMAGES.onion,
    description: 'High quality pink onions sourced directly from the fields.',
    rating: 4.7
  },
  {
    id: 'crop-4',
    farmerId: 'farmer-2',
    farmerName: 'Srinivasa Rao',
    farmName: 'Sri Venkateswara Dairy & Poultry',
    name: 'Cow Milk',
    category: 'Dairy',
    price: 55,
    unit: 'litre',
    stock: 80,
    status: 'Live',
    image: PREMIUM_IMAGES.cowMilk,
    description: 'Pure, grass-fed fresh cow milk pasteurized with love.',
    rating: 4.9
  },
  {
    id: 'crop-5',
    farmerId: 'farmer-2',
    farmerName: 'Srinivasa Rao',
    farmName: 'Sri Venkateswara Dairy & Poultry',
    name: 'Eggs',
    category: 'Poultry',
    price: 72,
    unit: 'dozen',
    stock: 30,
    status: 'Live',
    image: PREMIUM_IMAGES.eggs,
    description: 'Farm fresh high-protein poultry eggs collected every morning.',
    rating: 4.8
  },
  {
    id: 'crop-6',
    farmerId: 'farmer-2',
    farmerName: 'Srinivasa Rao',
    farmName: 'Sri Venkateswara Dairy & Poultry',
    name: 'Curd',
    category: 'Dairy',
    price: 65,
    unit: 'litre',
    stock: 45,
    status: 'Live',
    image: PREMIUM_IMAGES.curd,
    description: 'Thick, creamy, set curd prepared fresh on our dairy farm.',
    rating: 4.7
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'order-101',
    consumerId: 'consumer-1',
    consumerName: 'Kiran Kumar',
    consumerContact: '+91 88970 33441',
    date: '2026-06-12T10:30:00.000Z',
    items: [
      {
        productId: 'crop-1',
        productName: 'Tomato',
        quantity: 5,
        price: 30,
        unit: 'kg',
        farmerId: 'farmer-1',
        farmName: 'Ramesh Family Agro Farm'
      },
      {
        productId: 'crop-3',
        productName: 'Onion',
        quantity: 10,
        price: 25,
        unit: 'kg',
        farmerId: 'farmer-1',
        farmName: 'Ramesh Family Agro Farm'
      }
    ],
    total: 400,
    status: 'Ready for Pickup',
    deliveryAddress: 'Flat 402, Sai Residency, Gajuwaka, Andhra Pradesh 530026',
    pickupTime: 'Morning Delivery (7:00 AM - 10:00 AM)'
  },
  {
    id: 'order-102',
    consumerId: 'consumer-1',
    consumerName: 'Kiran Kumar',
    consumerContact: '+91 88970 33441',
    date: '2026-06-14T14:20:00.000Z',
    items: [
      {
        productId: 'crop-4',
        productName: 'Cow Milk',
        quantity: 4,
        price: 55,
        unit: 'litre',
        farmerId: 'farmer-2',
        farmName: 'Sri Venkateswara Dairy & Poultry'
      }
    ],
    total: 220,
    status: 'Pending',
    deliveryAddress: 'Flat 402, Sai Residency, Gajuwaka, Andhra Pradesh 530026',
    pickupTime: 'Morning Delivery (7:00 AM - 10:00 AM)'
  }
];

export const INITIAL_FEEDBACKS: FarmerFeedback[] = [
  {
    id: 'feed-1',
    farmerId: 'farmer-1',
    consumerName: 'Kiran Kumar',
    rating: 5,
    comment: 'The tomatoes are incredibly fresh and completely natural! Best quality in Visakhapatnam.',
    date: '2026-06-10T11:00:00.000Z',
    cropName: 'Tomato'
  },
  {
    id: 'feed-2',
    farmerId: 'farmer-2',
    consumerName: 'Kiran Kumar',
    rating: 5,
    comment: 'Pure cream cow milk of excellent taste. Highly recommended for children!',
    date: '2026-06-11T16:45:00.000Z',
    cropName: 'Cow Milk'
  }
];
