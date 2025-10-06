export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface OrderItemRequest {
  productId: number;
  quantity: number;
}

export interface OrderItemResponse {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  price: number;
}

export interface OrderRequest {
  items: OrderItemRequest[];
}

export interface OrderResponse {
  id: number;
  createdAt: string;
  status: OrderStatus;
  items: OrderItemResponse[];
  total: number;
}

// Legacy interface for backward compatibility
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
