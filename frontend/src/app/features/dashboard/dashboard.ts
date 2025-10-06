import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OrderService } from '../../core/order.service';
import { ProductService } from '../../core/product.service';
import { OrderResponse, OrderStatus } from '../../shared/models/order.model';
import { Page } from '../../shared/models/page.model';

interface OrderItem {
  productName: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  createdAt: string;
  total: number;
  status: string;
  items: OrderItem[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  userEmail: string | null = 'admin@teste.com';

  orders: Order[] = [];
  filteredOrders: Order[] = [];
  startDate: string = '';
  endDate: string = '';
  statusFilter: string = 'all';
  idFilter: string = '';

  isLoadingOrders = true;
  showOrderModal = false;
  selectedOrder: Order | null = null;

  // Auto-refresh
  autoRefreshEnabled = true;
  autoRefreshInterval: any = null;
  countdownInterval: any = null;
  refreshIntervalSeconds = 30;
  lastRefreshTime: Date | null = null;
  nextRefreshIn = 0;

  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;
  pageSizeOptions = [5, 10, 25, 50];
  sortBy = 'id';
  sortDirection = 'desc';

  // Expose Math to template
  Math = Math;

  stats = {
    totalOrders: 0,
    totalProducts: 0,
    totalRevenue: 0,
    pendingOrders: 0
  };

  constructor(
    private readonly router: Router,
    private readonly orderService: OrderService,
    private readonly productService: ProductService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    this.loadProductsCount();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  startAutoRefresh(): void {
    // Clear any existing intervals first
    this.stopAutoRefresh();

    if (this.autoRefreshEnabled) {
      this.nextRefreshIn = this.refreshIntervalSeconds;

      // Countdown timer (updates every second)
      this.countdownInterval = setInterval(() => {
        if (this.nextRefreshIn > 0) {
          this.nextRefreshIn--;
        }
      }, 1000);

      // Refresh interval (updates data every 30 seconds)
      this.autoRefreshInterval = setInterval(() => {
        this.refreshOrders();
        this.nextRefreshIn = this.refreshIntervalSeconds;
      }, this.refreshIntervalSeconds * 1000);
    }
  }

  stopAutoRefresh(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
    }
    this.nextRefreshIn = 0;
  }

  toggleAutoRefresh(): void {
    this.autoRefreshEnabled = !this.autoRefreshEnabled;
    if (this.autoRefreshEnabled) {
      this.startAutoRefresh();
    } else {
      this.stopAutoRefresh();
    }
  }

  refreshOrders(): void {
    // Silent refresh without loading spinner
    this.orderService.getAllPaginated(this.currentPage, this.pageSize, this.sortBy, this.sortDirection).subscribe({
      next: (data: Page<OrderResponse>) => {
        this.orders = data.content.map(order => this.mapOrderResponseToOrder(order));
        this.totalPages = data.totalPages;
        this.totalElements = data.totalElements;
        this.updateStats();
        this.applyFilters();
        this.lastRefreshTime = new Date();
      },
      error: (err) => {
        console.error('Error refreshing orders:', err);
      }
    });
  }

  manualRefresh(): void {
    this.loadOrders();
    // Restart auto-refresh timer if enabled
    if (this.autoRefreshEnabled) {
      this.startAutoRefresh();
    }
  }

  loadOrders() {
    this.isLoadingOrders = true;
    this.orderService.getAllPaginated(this.currentPage, this.pageSize, this.sortBy, this.sortDirection).subscribe({
      next: (data: Page<OrderResponse>) => {
        setTimeout(() => {
          this.orders = data.content.map(order => this.mapOrderResponseToOrder(order));
          this.totalPages = data.totalPages;
          this.totalElements = data.totalElements;
          this.updateStats();
          this.applyFilters();
          this.isLoadingOrders = false;
        }, 800);
      },
      error: (err) => {
        console.error('Error loading orders from API:', err);
        setTimeout(() => {
          this.orders = this.mockOrders();
          this.updateStats();
          this.filteredOrders = [...this.orders];
          this.isLoadingOrders = false;
        }, 800);
      }
    });
  }

  loadProductsCount() {
    this.productService.getAll().subscribe({
      next: (products) => {
        this.stats.totalProducts = products.length;
      },
      error: (err) => {
        console.error('Error loading products count:', err);
        this.stats.totalProducts = 0;
      }
    });
  }

  mapOrderResponseToOrder(orderResponse: OrderResponse): Order {
    return {
      id: orderResponse.id,
      createdAt: orderResponse.createdAt,
      total: orderResponse.total,
      status: this.mapStatusToDisplay(orderResponse.status),
      items: orderResponse.items.map(item => ({
        productName: item.productName,
        quantity: item.quantity,
        price: item.price
      }))
    };
  }

  mapStatusToDisplay(status: OrderStatus): string {
    const statusMap: { [key in OrderStatus]: string } = {
      [OrderStatus.PENDING]: 'pending',
      [OrderStatus.PROCESSING]: 'processing',
      [OrderStatus.COMPLETED]: 'completed',
      [OrderStatus.CANCELLED]: 'canceled'
    };
    return statusMap[status] || 'pending';
  }  updateStats() {
    const completedOrders = this.orders.filter(o => o.status === 'completed');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);

    this.stats = {
      totalOrders: this.orders.length,
      totalProducts: 12,
      totalRevenue,
      pendingOrders: this.orders.filter(o => o.status === 'pending').length
    };
  }

  applyFilters() {
    let filtered = [...this.orders];

    if (this.idFilter) {
      const id = parseInt(this.idFilter, 10);
      if (!isNaN(id)) {
        filtered = filtered.filter(o => o.id === id);
      }
    }

    if (this.startDate) {
      filtered = filtered.filter(o => new Date(o.createdAt) >= new Date(this.startDate));
    }

    if (this.endDate) {
      filtered = filtered.filter(o => new Date(o.createdAt) <= new Date(this.endDate + 'T23:59:59'));
    }

    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(o => o.status === this.statusFilter);
    }

    this.filteredOrders = filtered;
  }

  logout() {
    this.userEmail = null;
    this.router.navigate(['/login']);
  }

  goToProducts() {
    this.router.navigate(['/products']);
  }

  goToCreateOrder() {
    this.router.navigate(['/orders/create']);
  }

  viewOrderDetails(order: Order) {
    this.selectedOrder = order;
    this.showOrderModal = true;
  }

  closeOrderModal() {
    this.showOrderModal = false;
    this.selectedOrder = null;
  }

  mockOrders(): Order[] {
    return [
      {
        id: 1,
        createdAt: new Date('2025-10-01T10:30:00').toISOString(),
        total: 7849.89,
        status: 'pending',
        items: [
          { productName: 'Laptop Dell XPS 15', quantity: 1, price: 6999.99 },
          { productName: 'Wireless Mouse Logitech MX', quantity: 2, price: 349.90 }
        ]
      },
      {
        id: 2,
        createdAt: new Date('2025-10-02T14:20:00').toISOString(),
        total: 998.90,
        status: 'completed',
        items: [
          { productName: 'Mechanical Keyboard RGB', quantity: 2, price: 499.00 }
        ]
      },
      {
        id: 3,
        createdAt: new Date('2025-10-02T16:45:00').toISOString(),
        total: 2687.90,
        status: 'processing',
        items: [
          { productName: 'Monitor LG UltraWide 29"', quantity: 1, price: 1899.00 },
          { productName: 'USB-C Hub 7-in-1', quantity: 2, price: 189.90 },
          { productName: 'Webcam Full HD 1080p', quantity: 2, price: 299.00 }
        ]
      },
      {
        id: 4,
        createdAt: new Date('2025-10-03T09:15:00').toISOString(),
        total: 1449.80,
        status: 'completed',
        items: [
          { productName: 'Headset Gamer HyperX', quantity: 1, price: 549.90 },
          { productName: 'External SSD 1TB Samsung', quantity: 1, price: 899.00 }
        ]
      },
      {
        id: 5,
        createdAt: new Date('2025-10-03T11:00:00').toISOString(),
        total: 349.90,
        status: 'canceled',
        items: [
          { productName: 'Wireless Mouse Logitech MX', quantity: 1, price: 349.90 }
        ]
      }
    ];
  }

  // Pagination methods
  onPageChange(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadOrders();
    }
  }

  onPageSizeChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.pageSize = parseInt(select.value, 10);
    this.currentPage = 0; // Reset to first page
    this.loadOrders();
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  get visiblePages(): number[] {
    const maxVisible = 5;
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(0, this.currentPage - half);
    let end = Math.min(this.totalPages, start + maxVisible);

    if (end - start < maxVisible) {
      start = Math.max(0, end - maxVisible);
    }

    return Array.from({ length: end - start }, (_, i) => start + i);
  }
}
