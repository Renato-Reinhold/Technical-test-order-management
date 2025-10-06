import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../core/product.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Product } from '../../shared/models/product.model';
import { Page } from '../../shared/models/page.model';

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

  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;
  pageSizeOptions = [5, 10, 25, 50];
  sortBy = 'id';
  sortDirection = 'asc';

  // Expose Math to template
  Math = Math;

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
    this.productService.getAllPaginated(this.currentPage, this.pageSize, this.sortBy, this.sortDirection).subscribe({
      next: (data: Page<Product>) => {
        setTimeout(() => {
          this.products = data.content;
          this.totalPages = data.totalPages;
          this.totalElements = data.totalElements;
          this.isLoadingProducts = false;
        }, 800);
      },
      error: (err) => {
        console.error('Error loading products from API:', err);
        setTimeout(() => {
          this.products = [];
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

  // Pagination methods
  onPageChange(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadProducts();
    }
  }

  onPageSizeChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.pageSize = parseInt(select.value, 10);
    this.currentPage = 0; // Reset to first page
    this.loadProducts();
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
