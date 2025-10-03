import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface OrderItem {
  productName: string;
  quantity: number;
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
export class DashboardComponent implements OnInit {
  userEmail: string | null = 'admin@teste.com';

  orders: Order[] = [];
  filteredOrders: Order[] = [];
  startDate: string = '';
  endDate: string = '';
  statusFilter: string = 'all';

  isLoadingOrders = true;
  showOrderModal = false;
  selectedOrder: Order | null = null;

  stats = {
    totalOrders: 0,
    totalProducts: 0,
    totalRevenue: 0,
    pendingOrders: 0
  };

  constructor(private readonly router: Router) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders() {
    this.isLoadingOrders = true;
    setTimeout(() => {
      this.orders = this.mockOrders();
      this.updateStats();
      this.filteredOrders = [...this.orders];
      this.isLoadingOrders = false;
    }, 800);
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
          { productName: 'Laptop Dell XPS 15', quantity: 1 },
          { productName: 'Wireless Mouse Logitech MX', quantity: 2 }
        ]
      },
      {
        id: 2,
        createdAt: new Date('2025-10-02T14:20:00').toISOString(),
        total: 998.90,
        status: 'completed',
        items: [
          { productName: 'Mechanical Keyboard RGB', quantity: 2 }
        ]
      },
      {
        id: 3,
        createdAt: new Date('2025-10-02T16:45:00').toISOString(),
        total: 2687.90,
        status: 'processing',
        items: [
          { productName: 'Monitor LG UltraWide 29"', quantity: 1 },
          { productName: 'USB-C Hub 7-in-1', quantity: 2 },
          { productName: 'Webcam Full HD 1080p', quantity: 2 }
        ]
      },
      {
        id: 4,
        createdAt: new Date('2025-10-03T09:15:00').toISOString(),
        total: 1449.80,
        status: 'completed',
        items: [
          { productName: 'Headset Gamer HyperX', quantity: 1 },
          { productName: 'External SSD 1TB Samsung', quantity: 1 }
        ]
      },
      {
        id: 5,
        createdAt: new Date('2025-10-03T11:00:00').toISOString(),
        total: 349.90,
        status: 'canceled',
        items: [
          { productName: 'Wireless Mouse Logitech MX', quantity: 1 }
        ]
      }
    ];
  }
}
