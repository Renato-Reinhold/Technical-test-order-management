import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../core/product.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Product } from '../../shared/models/product.model';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './products.html',
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  showModal = false;
  isEditing = false;
  currentProductId?: number;
  productForm: FormGroup;
  isLoadingProducts = true;

  // Mock data for demonstration
  private readonly mockProducts: Product[] = [
    {
      id: 1,
      name: 'Laptop Dell XPS 15',
      description: 'High-performance laptop with Intel i7 processor and 16GB RAM',
      price: 6999.99,
      stockQuantity: 15
    },
    {
      id: 2,
      name: 'Wireless Mouse Logitech MX',
      description: 'Ergonomic wireless mouse with precision tracking',
      price: 349.90,
      stockQuantity: 50
    },
    {
      id: 3,
      name: 'Mechanical Keyboard RGB',
      description: 'Gaming mechanical keyboard with RGB backlight and blue switches',
      price: 499.00,
      stockQuantity: 30
    },
    {
      id: 4,
      name: 'Monitor LG UltraWide 29"',
      description: '29-inch ultrawide monitor with IPS panel and Full HD resolution',
      price: 1899.00,
      stockQuantity: 8
    },
    {
      id: 5,
      name: 'USB-C Hub 7-in-1',
      description: 'Multiport adapter with HDMI, USB 3.0, SD card reader and USB-C PD',
      price: 189.90,
      stockQuantity: 100
    },
    {
      id: 6,
      name: 'Webcam Full HD 1080p',
      description: 'HD webcam with auto focus and built-in microphone',
      price: 299.00,
      stockQuantity: 25
    },
    {
      id: 7,
      name: 'Headset Gamer HyperX',
      description: 'Professional gaming headset with 7.1 surround sound',
      price: 549.90,
      stockQuantity: 20
    },
    {
      id: 8,
      name: 'External SSD 1TB Samsung',
      description: 'Portable SSD with ultra-fast read/write speeds',
      price: 899.00,
      stockQuantity: 12
    }
  ];

  constructor(
    private readonly productService: ProductService,
    private readonly fb: FormBuilder,
    private readonly router: Router
  ) {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      priceFormatted: [''],
      stockQuantity: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  loadProducts() {
    this.isLoadingProducts = true;
    this.productService.getAll().subscribe({
      next: (data) => {
        setTimeout(() => {
          this.products = data && data.length > 0 ? data : this.mockProducts;
          this.isLoadingProducts = false;
        }, 800);
      },
      error: (err) => {
        console.error('Error loading products from API, using mock data:', err);
        setTimeout(() => {
          this.products = this.mockProducts;
          this.isLoadingProducts = false;
        }, 800);
      },
    });
  }

  openModal() {
    this.showModal = true;
    this.isEditing = false;
    this.productForm.reset({
      name: '',
      description: '',
      price: 0,
      priceFormatted: '0,00',
      stockQuantity: 0
    });
  }

  editProduct(product: Product) {
    this.showModal = true;
    this.isEditing = true;
    this.currentProductId = product.id;
    this.productForm.patchValue({
      name: product.name,
      description: product.description || '',
      price: product.price,
      priceFormatted: this.formatPrice(product.price),
      stockQuantity: product.stockQuantity
    });
  }

  closeModal() {
    this.showModal = false;
    this.isEditing = false;
    this.currentProductId = undefined;
    this.productForm.reset();
  }

  saveProduct() {
    if (this.productForm.invalid) {
      return;
    }

    const productData: Product = this.productForm.value;

    if (this.isEditing && this.currentProductId) {
      this.productService.update(this.currentProductId, productData).subscribe({
        next: () => {
          this.loadProducts();
          this.closeModal();
        },
        error: (err) => console.error('Error updating product:', err)
      });
    } else {
      this.productService.create(productData).subscribe({
        next: () => {
          this.loadProducts();
          this.closeModal();
        },
        error: (err) => console.error('Error creating product:', err)
      });
    }
  }

  deleteProduct(id: number) {
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.delete(id).subscribe({
        next: () => this.loadProducts(),
        error: (err) => console.error('Error deleting product:', err)
      });
    }
  }

  onPriceInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;
    value = value.replace(/\D/g, '');

    const numValue = parseInt(value || '0', 10);
    const formatted = this.formatCurrency(numValue);
    this.productForm.patchValue({ priceFormatted: formatted }, { emitEvent: false });
    const realValue = numValue / 100;
    this.productForm.patchValue({ price: realValue }, { emitEvent: false });

    input.value = formatted;
  }

  onPriceBlur(): void {
    const price = this.productForm.get('price')?.value;
    if (price === null || price === undefined || price === 0) {
      this.productForm.patchValue({ priceFormatted: '0,00' }, { emitEvent: false });
    }
  }

  formatCurrency(value: number): string {
    const reais = (value / 100).toFixed(2);
    const [inteiro, decimal] = reais.split('.');

    const inteiroFormatado = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return `${inteiroFormatado},${decimal}`;
  }

  formatPrice(value: number): string {
    const centavos = Math.round(value * 100);
    return this.formatCurrency(centavos);
  }
}
