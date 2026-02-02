import { ShoppingCart, Smartphone, Shirt, Home, Wrench, Heart, Car, Book } from 'lucide-react';
import { BusinessCategory } from '@/types/enhanced-signup';

export const BUSINESS_CATEGORIES: BusinessCategory[] = [
  {
    id: 'groceries',
    name: 'Groceries',
    description: 'Fresh food & pantry essentials',
    icon: 'ShoppingCart',
    subcategories: [
      { id: 'fresh-produce', name: 'Fresh Produce', selected: false },
      { id: 'dairy', name: 'Dairy Products', selected: false },
      { id: 'beverages', name: 'Beverages', selected: false },
      { id: 'bakery', name: 'Bakery Items', selected: false },
      { id: 'frozen-foods', name: 'Frozen Foods', selected: false },
      { id: 'canned-goods', name: 'Canned Goods', selected: false },
      { id: 'meat-poultry', name: 'Meat & Poultry', selected: false },
      { id: 'snacks', name: 'Snacks & Confectionery', selected: false },
    ]
  },
  {
    id: 'electronics',
    name: 'Electronics',
    description: 'Gadgets, devices & appliances',
    icon: 'Smartphone',
    subcategories: [
      { id: 'mobile-phones', name: 'Mobile Phones', selected: false },
      { id: 'computers', name: 'Computers & Laptops', selected: false },
      { id: 'home-appliances', name: 'Home Appliances', selected: false },
      { id: 'accessories', name: 'Electronics Accessories', selected: false },
      { id: 'audio-video', name: 'Audio & Video', selected: false },
      { id: 'gaming', name: 'Gaming Equipment', selected: false },
    ]
  },
  {
    id: 'apparel-fashion',
    name: 'Apparel & Fashion',
    description: 'Clothing, shoes & accessories',
    icon: 'Shirt',
    subcategories: [
      { id: 'mens-clothing', name: "Men's Clothing", selected: false },
      { id: 'womens-clothing', name: "Women's Clothing", selected: false },
      { id: 'kids-clothing', name: "Kids' Clothing", selected: false },
      { id: 'shoes', name: 'Footwear', selected: false },
      { id: 'accessories', name: 'Fashion Accessories', selected: false },
      { id: 'bags', name: 'Bags & Luggage', selected: false },
    ]
  },
  {
    id: 'home-garden',
    name: 'Home & Garden',
    description: 'Furniture, decor & garden supplies',
    icon: 'Home',
    subcategories: [
      { id: 'furniture', name: 'Furniture', selected: false },
      { id: 'home-decor', name: 'Home Decor', selected: false },
      { id: 'garden-tools', name: 'Garden Tools', selected: false },
      { id: 'plants', name: 'Plants & Seeds', selected: false },
      { id: 'kitchen', name: 'Kitchen & Dining', selected: false },
      { id: 'bedding', name: 'Bedding & Bath', selected: false },
    ]
  },
  {
    id: 'hardware-tools',
    name: 'Hardware & Tools',
    description: 'Construction, repair & maintenance',
    icon: 'Wrench',
    subcategories: [
      { id: 'hand-tools', name: 'Hand Tools', selected: false },
      { id: 'power-tools', name: 'Power Tools', selected: false },
      { id: 'hardware', name: 'Hardware & Fasteners', selected: false },
      { id: 'electrical', name: 'Electrical Supplies', selected: false },
      { id: 'plumbing', name: 'Plumbing Supplies', selected: false },
      { id: 'paint', name: 'Paint & Supplies', selected: false },
    ]
  },
  {
    id: 'health-beauty',
    name: 'Health & Beauty',
    description: 'Personal care & wellness products',
    icon: 'Heart',
    subcategories: [
      { id: 'skincare', name: 'Skincare', selected: false },
      { id: 'cosmetics', name: 'Cosmetics', selected: false },
      { id: 'hair-care', name: 'Hair Care', selected: false },
      { id: 'health-supplements', name: 'Health Supplements', selected: false },
      { id: 'personal-care', name: 'Personal Care', selected: false },
      { id: 'medical-supplies', name: 'Medical Supplies', selected: false },
    ]
  },
  {
    id: 'automotive',
    name: 'Automotive',
    description: 'Vehicle parts & accessories',
    icon: 'Car',
    subcategories: [
      { id: 'car-parts', name: 'Car Parts', selected: false },
      { id: 'accessories', name: 'Car Accessories', selected: false },
      { id: 'oils-fluids', name: 'Oils & Fluids', selected: false },
      { id: 'tires', name: 'Tires & Wheels', selected: false },
      { id: 'tools', name: 'Automotive Tools', selected: false },
    ]
  },
  {
    id: 'books-stationery',
    name: 'Books & Stationery',
    description: 'Books, office & school supplies',
    icon: 'Book',
    subcategories: [
      { id: 'books', name: 'Books', selected: false },
      { id: 'office-supplies', name: 'Office Supplies', selected: false },
      { id: 'school-supplies', name: 'School Supplies', selected: false },
      { id: 'art-supplies', name: 'Art & Craft Supplies', selected: false },
      { id: 'stationery', name: 'Stationery', selected: false },
    ]
  },
];

// Helper function to get icon component by name
export const getIconComponent = (iconName: string) => {
  const iconMap: { [key: string]: any } = {
    ShoppingCart,
    Smartphone,
    Shirt,
    Home,
    Wrench,
    Heart,
    Car,
    Book,
  };
  
  return iconMap[iconName] || ShoppingCart;
};