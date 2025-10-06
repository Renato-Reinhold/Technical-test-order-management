import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OrderService } from '../../core/order.service';
import { ProductService } from '../../core/product.service';
import { Product } from '../../shared/models/product.model';
import { OrderRequest } from '../../shared/models/order.model';

interface CartItem {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
}

@Component({
  selector: 'app-create-order',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-order.html',
  styleUrl: './create-order.scss'
})
export class CreateOrderComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  cartItems: CartItem[] = [];
  productQuantities: { [key: number]: number } = {};

  searchTerm: string = '';
  isLoadingProducts = false;
  isCreatingOrder = false;
  showSuccessMessage = false;
  errorMessage = '';
  createdOrderId: number | null = null;

  constructor(
    private readonly router: Router,
    private readonly orderService: OrderService,
    private readonly productService: ProductService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts() {
    this.isLoadingProducts = true;
    this.productService.getAll().subscribe({
      next: (products) => {
        this.products = products;
        this.filteredProducts = [...this.products];
        this.isLoadingProducts = false;
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.errorMessage = 'Failed to load products. Please try again.';
        this.isLoadingProducts = false;
      }
    });
  }

  filterProducts() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredProducts = [...this.products];
      return;
    }

    this.filteredProducts = this.products.filter(p =>
      p.name.toLowerCase().includes(term) ||
      (p.description && p.description.toLowerCase().includes(term))
    );
  }

  isProductInCart(productId: number): boolean {
    return this.cartItems.some(item => item.productId === productId);
  }

  addToCart(product: Product) {
    if (!product.id) return;

    const cartItem: CartItem = {
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity: 1
    };

    this.cartItems.push(cartItem);
    this.productQuantities[product.id] = 1;
  }

  removeFromCart(productId: number) {
    this.cartItems = this.cartItems.filter(item => item.productId !== productId);
    delete this.productQuantities[productId];
  }

  updateQuantity(productId: number) {
    const quantity = this.productQuantities[productId];

    if (quantity === undefined) return;

    // Validate quantity
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    // Update cart item quantity
    const cartItem = this.cartItems.find(item => item.productId === productId);
    if (cartItem) {
      cartItem.quantity = quantity;
    }
  }

  calculateTotal(): number {
    return this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  clearCart() {
    if (confirm('Are you sure you want to clear the cart?')) {
      this.cartItems = [];
      this.productQuantities = {};
    }
  }

  createOrder() {
    if (this.cartItems.length === 0) {
      this.errorMessage = 'Please add at least one product to the order';
      return;
    }

    this.isCreatingOrder = true;
    this.errorMessage = '';

    const orderRequest: OrderRequest = {
      items: this.cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }))
    };

    this.orderService.create(orderRequest).subscribe({
      next: (response) => {
        this.isCreatingOrder = false;
        this.showSuccessMessage = true;
        this.createdOrderId = response.id;

        // Clear cart
        this.cartItems = [];
        this.productQuantities = {};

        // Reload products to update stock
        this.loadProducts();

        // Hide success message and redirect after 3 seconds
        setTimeout(() => {
          this.showSuccessMessage = false;
          this.router.navigate(['/dashboard']);
        }, 3000);
      },
      error: (err) => {
        console.error('Error creating order:', err);
        this.isCreatingOrder = false;

        if (err.status === 400) {
          this.errorMessage = 'Invalid order data. Please check the quantities.';
        } else if (err.status === 404) {
          this.errorMessage = 'One or more products not found.';
        } else {
          this.errorMessage = 'Failed to create order. Please try again.';
        }
      }
    });
  }

  goBack() {
    if (this.cartItems.length > 0) {
      if (confirm('You have items in your cart. Are you sure you want to leave?')) {
        this.router.navigate(['/dashboard']);
      }
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
