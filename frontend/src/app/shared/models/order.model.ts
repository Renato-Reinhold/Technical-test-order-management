export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELED = 'CANCELED'
}

export interface OrderItem {
  productId: number;
  quantity: number;
}

export interface Order {
  id?: number;
  createdAt?: string;
  status: OrderStatus;
  items: OrderItem[];
}
