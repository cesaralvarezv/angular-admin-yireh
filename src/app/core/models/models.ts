export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  roles: string[];
  balance: number;
}

export interface LoginResponse {
  token: string;
  email: string;
  roles: string[];
  name?: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  categoryId: number;
  categoryName: string;
  active: boolean;
  order: number;
  quantity: number;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
  active: boolean;
}

export interface CashClosure {
  id: number;
  cashierId: number;
  cashierEmail: string;
  openingAmount: number;
  openingTime: string;
  closingTime?: string;
  cashSalesSystem: number;
  virtualWalletSales: number;
  cardSales: number;
  totalSalesSystem: number;
  declaredCash?: number;
  discrepancy?: number;
  status: 'OPEN' | 'CLOSED';
  notes?: string;
}

export interface OrderItem {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  userEmail: string;
  items: OrderItem[];
  total: number;
  status: string;
  paymentMethod: string;
  deliveryLocation?: string;
  notes?: string;
  orderType: string;
  cashierId?: number;
  closureId?: number;
  cashReceived?: number;
  changeReturned?: number;
  createdAt: string;
}

export interface PhysicalAsset {
  id: number;
  assetCode: string;
  name: string;
  category: string;
  location: string;
  purchasePrice: number;
  purchaseDate: string;
  usefulLifeMonths: number;
  depreciationAccumulated: number;
  maintenanceSchedule?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  status: 'OPERATIONAL' | 'IN_MAINTENANCE' | 'DECOMMISSIONED';
  notes?: string;
}

export interface SatisfactionSurvey {
  id: number;
  orderId: number;
  userEmail: string;
  rating: number;
  quickTags?: string;
  comment?: string;
  createdAt: string;
}

export interface SalesReport {
  startDate: string;
  endDate: string;
  totalOrders: number;
  totalSales: number;
  averageTicket: number;
  salesByPaymentMethod: { [key: string]: number };
  topSellingProducts: { [key: string]: number };
  salesByDate: { [key: string]: number };
}

export interface ProjectionReport {
  period: string;
  projectedTotalRevenue: number;
  projectedTotalOrders: number;
  dailyProjections: { [key: string]: number };
  suggestedPurchases: {
    productName: string;
    estimatedWeeklyDemand: number;
    recommendedReorderAction: string;
  }[];
}
