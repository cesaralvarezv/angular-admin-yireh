import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PosService, CashClosureService } from '../../core/services/api.services';
import { Product, Category, CashClosure, Order } from '../../core/models/models';

interface CartLine {
  product: Product;
  quantity: number;
  subtotal: number;
}

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pos-layout">
      <!-- Panel Izquierdo: Catálogo y Búsqueda -->
      <div class="pos-catalog-panel">
        <div class="catalog-header">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input
              type="text"
              class="form-input search-input"
              placeholder="Buscar producto por nombre o código de barras (F2)..."
              [(ngModel)]="searchQuery"
            />
          </div>

          <div class="category-pills">
            <button
              class="category-btn"
              [class.active]="selectedCategory() === 0"
              (click)="selectedCategory.set(0)"
            >
              Todos ({{ products().length }})
            </button>
            <button
              *ngFor="let cat of categories()"
              class="category-btn"
              [class.active]="selectedCategory() === cat.id"
              (click)="selectedCategory.set(cat.id)"
            >
              {{ cat.icon || '☕' }} {{ cat.name }}
            </button>
          </div>
        </div>

        <div class="products-grid">
          <div
            *ngFor="let p of filteredProducts()"
            class="product-card"
            [class.out-of-stock]="p.quantity <= 0"
            (click)="addToCart(p)"
          >
            <div class="product-img-wrapper">
              <img [src]="p.imageUrl || 'https://images.unsplash.com/photo-1509785307050-d4066910ec1e?w=200'" [alt]="p.name" />
              <span class="stock-badge" [class.low]="p.quantity < 5">
                Stock: {{ p.quantity }}
              </span>
            </div>
            <div class="product-details">
              <h4>{{ p.name }}</h4>
              <div class="price-row">
                <span class="price">\${{ p.price | number:'1.0-0' }} COP</span>
                <button class="btn-add-mini" [disabled]="p.quantity <= 0">+</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Panel Derecho: Ticket de Venta & Cobro -->
      <div class="pos-ticket-panel">
        <div class="ticket-header">
          <h3>Ticket de Venta</h3>
          <button (click)="clearCart()" class="btn-clear" [disabled]="cart().length === 0">
            Vaciar
          </button>
        </div>

        <!-- Alerta si caja cerrada -->
        <div *ngIf="activeClosure()?.status !== 'OPEN'" class="cash-closed-banner">
          ⚠️ <strong>Caja Cerrada:</strong> Debe abrir un turno en el módulo de Cierre de Caja para procesar ventas.
        </div>

        <div class="ticket-items-list">
          <div *ngIf="cart().length === 0" class="empty-cart-state">
            <span class="empty-icon">🛒</span>
            <p>No hay productos en el ticket.</p>
            <small>Haz clic en los productos para agregarlos al cobro.</small>
          </div>

          <div *ngFor="let item of cart(); let idx = index" class="ticket-item-row">
            <div class="item-info">
              <span class="item-name">{{ item.product.name }}</span>
              <span class="item-unit-price">\${{ item.product.price | number:'1.0-0' }} c/u</span>
            </div>
            <div class="quantity-stepper">
              <button (click)="decrementQty(idx)">-</button>
              <span>{{ item.quantity }}</span>
              <button (click)="incrementQty(idx)" [disabled]="item.quantity >= item.product.quantity">+</button>
            </div>
            <div class="item-subtotal">
              \${{ item.subtotal | number:'1.0-0' }}
            </div>
            <button (click)="removeItem(idx)" class="btn-remove-item">✕</button>
          </div>
        </div>

        <div class="ticket-summary">
          <div class="summary-line">
            <span>Subtotal:</span>
            <span>\${{ cartTotal() | number:'1.0-0' }} COP</span>
          </div>
          <div class="summary-line total-highlight">
            <span>TOTAL A COBRAR:</span>
            <span class="total-amount">\${{ cartTotal() | number:'1.0-0' }} COP</span>
          </div>

          <!-- Selección de Método de Pago -->
          <div class="payment-method-selector">
            <label class="section-label">Método de Pago:</label>
            <div class="method-options">
              <button
                type="button"
                class="method-btn"
                [class.selected]="paymentMethod === 'CASH'"
                (click)="paymentMethod = 'CASH'"
              >
                💵 Efectivo
              </button>
              <button
                type="button"
                class="method-btn"
                [class.selected]="paymentMethod === 'WALLET'"
                (click)="paymentMethod = 'WALLET'"
              >
                📱 Billetera
              </button>
              <button
                type="button"
                class="method-btn"
                [class.selected]="paymentMethod === 'CARD'"
                (click)="paymentMethod = 'CARD'"
              >
                💳 Datáfono
              </button>
              <button
                type="button"
                class="method-btn"
                [class.selected]="paymentMethod === 'MIXED'"
                (click)="paymentMethod = 'MIXED'"
              >
                ⚖️ Mixto
              </button>
            </div>
          </div>

          <!-- Campos dinámicos según pago -->
          <div class="payment-details-box">
            <!-- Efectivo -->
            <div *ngIf="paymentMethod === 'CASH' || paymentMethod === 'MIXED'" class="form-group-pos">
              <label>Efectivo recibido del cliente:</label>
              <input
                type="number"
                class="form-input"
                [(ngModel)]="cashReceived"
                placeholder="Ej: 20000"
              />
              <div *ngIf="cashChange() >= 0 && cashReceived > 0" class="change-display">
                Cambio / Vueltos: <strong>\${{ cashChange() | number:'1.0-0' }} COP</strong>
              </div>
            </div>

            <!-- Billetera institucional -->
            <div *ngIf="paymentMethod === 'WALLET' || paymentMethod === 'MIXED'" class="form-group-pos">
              <label>Correo o QR Estudiante (Billetera):</label>
              <input
                type="email"
                class="form-input"
                [(ngModel)]="customerEmail"
                placeholder="estudiante@yirehstore.com"
              />
            </div>

            <div *ngIf="paymentMethod === 'MIXED'" class="form-group-pos">
              <label>Monto a debitar de la billetera:</label>
              <input
                type="number"
                class="form-input"
                [(ngModel)]="walletAmount"
                placeholder="Ej: 5000"
              />
            </div>
          </div>

          <button
            (click)="processCheckout()"
            class="btn btn-primary btn-checkout"
            [disabled]="cart().length === 0 || processing() || activeClosure()?.status !== 'OPEN'"
          >
            <span *ngIf="!processing()">✅ Cobrar e Imprimir Ticket (F9)</span>
            <span *ngIf="processing()">Procesando Venta...</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Recibo / Factura POS -->
    <div *ngIf="completedOrder()" class="modal-backdrop">
      <div class="receipt-modal">
        <div class="receipt-header">
          <h2>☕ YIREH STORE</h2>
          <p>Comprobante de Venta en Mostrador</p>
          <span class="consecutive">Doc. Fiscal: #{{ completedOrder()?.orderNumber }}</span>
        </div>

        <div class="receipt-body">
          <p><strong>Fecha:</strong> {{ completedOrder()?.createdAt | date:'medium' }}</p>
          <p><strong>Cajero:</strong> Mostrador Principal (ID #{{ completedOrder()?.cashierId }})</p>
          <p><strong>Cliente:</strong> {{ completedOrder()?.userEmail }}</p>
          <p><strong>Método de Pago:</strong> {{ completedOrder()?.paymentMethod }}</p>
          
          <hr class="receipt-divider" />

          <div *ngFor="let it of completedOrder()?.items" class="receipt-item">
            <span>{{ it.quantity }}x {{ it.productName }}</span>
            <span>\${{ it.subtotal | number:'1.0-0' }}</span>
          </div>

          <hr class="receipt-divider" />

          <div class="receipt-total-line">
            <span>TOTAL:</span>
            <span>\${{ completedOrder()?.total | number:'1.0-0' }} COP</span>
          </div>

          <div *ngIf="completedOrder()?.changeReturned" class="receipt-change">
            <span>Cambio entregado:</span>
            <span>\${{ completedOrder()?.changeReturned | number:'1.0-0' }} COP</span>
          </div>
        </div>

        <div class="receipt-footer">
          <button (click)="closeReceiptModal()" class="btn btn-primary">
            Aceptar y Nueva Venta
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pos-layout {
      display: grid;
      grid-template-columns: 1fr 420px;
      gap: 1.5rem;
      height: calc(100vh - 120px);
    }
    .pos-catalog-panel {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      overflow-y: auto;
      padding-right: 0.5rem;
    }
    .catalog-header {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .search-box {
      position: relative;
    }
    .search-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
    }
    .search-input {
      padding-left: 2.75rem;
      font-size: 0.95rem;
    }
    .category-pills {
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      padding-bottom: 0.25rem;
    }
    .category-btn {
      padding: 0.45rem 1rem;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-full);
      color: var(--text-secondary);
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: var(--transition);
    }
    .category-btn.active {
      background: var(--primary);
      color: #fff;
      border-color: var(--primary);
      box-shadow: 0 2px 10px var(--primary-glow);
    }
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 1rem;
    }
    .product-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      overflow: hidden;
      cursor: pointer;
      transition: var(--transition);
      display: flex;
      flex-direction: column;
    }
    .product-card:hover {
      transform: translateY(-2px);
      border-color: var(--primary);
      box-shadow: var(--shadow-md);
    }
    .product-card.out-of-stock {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .product-img-wrapper {
      position: relative;
      height: 120px;
      overflow: hidden;
    }
    .product-img-wrapper img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .stock-badge {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      color: #10b981;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 700;
    }
    .stock-badge.low {
      color: #ef4444;
    }
    .product-details {
      padding: 0.85rem;
      display: flex;
      flex-direction: column;
      flex: 1;
      justify-content: space-between;
    }
    .product-details h4 {
      font-size: 0.875rem;
      color: #fff;
      margin-bottom: 0.5rem;
      line-height: 1.3;
    }
    .price-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .price {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--primary-light);
    }
    .btn-add-mini {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--primary);
      color: white;
      border: none;
      font-weight: 700;
      cursor: pointer;
    }

    /* Ticket Panel */
    .pos-ticket-panel {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .ticket-header {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .ticket-header h3 {
      font-size: 1.1rem;
      color: #fff;
    }
    .btn-clear {
      background: none;
      border: none;
      color: #ef4444;
      font-size: 0.8125rem;
      cursor: pointer;
      font-weight: 600;
    }
    .cash-closed-banner {
      background: rgba(245, 158, 11, 0.15);
      border-bottom: 1px solid rgba(245, 158, 11, 0.3);
      color: #fbbf24;
      padding: 0.75rem 1.25rem;
      font-size: 0.8125rem;
    }
    .ticket-items-list {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .empty-cart-state {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      text-align: center;
      gap: 0.5rem;
    }
    .empty-icon {
      font-size: 2.5rem;
    }
    .ticket-item-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.65rem;
      background: rgba(11, 15, 25, 0.4);
      border-radius: var(--radius-md);
      gap: 0.5rem;
    }
    .item-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .item-name {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #fff;
    }
    .item-unit-price {
      font-size: 0.7rem;
      color: var(--text-muted);
    }
    .quantity-stepper {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .quantity-stepper button {
      width: 22px;
      height: 22px;
      border-radius: 4px;
      border: 1px solid var(--border-subtle);
      background: #1e293b;
      color: #fff;
      cursor: pointer;
    }
    .quantity-stepper span {
      font-size: 0.8125rem;
      font-weight: 700;
      min-width: 16px;
      text-align: center;
    }
    .item-subtotal {
      font-size: 0.85rem;
      font-weight: 700;
      color: #cbd5e1;
      min-width: 70px;
      text-align: right;
    }
    .btn-remove-item {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 0.75rem;
    }
    .btn-remove-item:hover {
      color: #ef4444;
    }
    .ticket-summary {
      padding: 1.25rem;
      border-top: 1px solid var(--border-subtle);
      background: rgba(15, 23, 42, 0.6);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .summary-line {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }
    .total-highlight {
      font-size: 1.15rem;
      font-weight: 800;
      color: #fff;
      border-top: 1px solid var(--border-subtle);
      padding-top: 0.5rem;
    }
    .total-amount {
      color: var(--success);
    }
    .payment-method-selector {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .section-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
    }
    .method-options {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.35rem;
    }
    .method-btn {
      padding: 0.5rem 0.25rem;
      background: #1e293b;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
      text-align: center;
    }
    .method-btn.selected {
      background: var(--primary);
      border-color: var(--primary);
      color: white;
    }
    .form-group-pos label {
      display: block;
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-bottom: 0.25rem;
    }
    .change-display {
      margin-top: 0.4rem;
      font-size: 0.85rem;
      color: var(--success);
    }
    .btn-checkout {
      width: 100%;
      padding: 0.85rem;
      font-size: 1rem;
      margin-top: 0.5rem;
    }

    /* Modal Recibo */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
    }
    .receipt-modal {
      background: #fff;
      color: #111;
      width: 360px;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
      font-family: 'Courier New', Courier, monospace;
    }
    .receipt-header {
      text-align: center;
      margin-bottom: 1rem;
    }
    .consecutive {
      font-weight: 700;
      font-size: 0.85rem;
    }
    .receipt-body {
      font-size: 0.8rem;
    }
    .receipt-divider {
      border: 0;
      border-top: 1px dashed #444;
      margin: 0.75rem 0;
    }
    .receipt-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.25rem;
    }
    .receipt-total-line {
      display: flex;
      justify-content: space-between;
      font-size: 1rem;
      font-weight: bold;
    }
    .receipt-change {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      margin-top: 0.25rem;
      color: #059669;
    }
    .receipt-footer {
      margin-top: 1.25rem;
      text-align: center;
    }
  `]
})
export class PosComponent implements OnInit {
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  activeClosure = signal<CashClosure | null>(null);

  searchQuery = '';
  selectedCategory = signal<number>(0);

  cart = signal<CartLine[]>([]);
  paymentMethod: 'CASH' | 'WALLET' | 'CARD' | 'MIXED' = 'CASH';
  cashReceived: number = 0;
  walletAmount: number = 0;
  customerEmail: string = '';

  processing = signal(false);
  completedOrder = signal<Order | null>(null);

  cartTotal = computed(() => {
    return this.cart().reduce((acc, item) => acc + item.subtotal, 0);
  });

  cashChange = computed(() => {
    if (this.paymentMethod === 'MIXED') {
      const remainingCash = this.cartTotal() - (this.walletAmount || 0);
      return (this.cashReceived || 0) - remainingCash;
    }
    return (this.cashReceived || 0) - this.cartTotal();
  });

  filteredProducts = computed(() => {
    let list = this.products();
    if (this.selectedCategory() !== 0) {
      list = list.filter(p => p.categoryId === this.selectedCategory());
    }
    if (this.searchQuery && this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(p => p.name.toLowerCase().includes(q));
    }
    return list;
  });

  constructor(
    private posService: PosService,
    private cashService: CashClosureService
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.posService.getProducts().subscribe({
      next: (prods) => this.products.set(prods),
      error: (e) => console.error(e)
    });

    this.posService.getCategories().subscribe({
      next: (cats) => this.categories.set(cats),
      error: (e) => console.error(e)
    });

    this.cashService.getCurrentClosure().subscribe({
      next: (c) => this.activeClosure.set(c),
      error: () => this.activeClosure.set(null)
    });
  }

  addToCart(product: Product): void {
    if (product.quantity <= 0) return;

    const currentCart = [...this.cart()];
    const existingIndex = currentCart.findIndex(item => item.product.id === product.id);

    if (existingIndex > -1) {
      if (currentCart[existingIndex].quantity < product.quantity) {
        currentCart[existingIndex].quantity += 1;
        currentCart[existingIndex].subtotal = currentCart[existingIndex].quantity * product.price;
        this.cart.set(currentCart);
      }
    } else {
      currentCart.push({
        product,
        quantity: 1,
        subtotal: product.price
      });
      this.cart.set(currentCart);
    }
  }

  incrementQty(idx: number): void {
    const list = [...this.cart()];
    if (list[idx].quantity < list[idx].product.quantity) {
      list[idx].quantity += 1;
      list[idx].subtotal = list[idx].quantity * list[idx].product.price;
      this.cart.set(list);
    }
  }

  decrementQty(idx: number): void {
    const list = [...this.cart()];
    if (list[idx].quantity > 1) {
      list[idx].quantity -= 1;
      list[idx].subtotal = list[idx].quantity * list[idx].product.price;
      this.cart.set(list);
    } else {
      this.removeItem(idx);
    }
  }

  removeItem(idx: number): void {
    const list = [...this.cart()];
    list.splice(idx, 1);
    this.cart.set(list);
  }

  clearCart(): void {
    this.cart.set([]);
    this.cashReceived = 0;
    this.walletAmount = 0;
  }

  processCheckout(): void {
    if (this.cart().length === 0) return;

    this.processing.set(true);

    const payload = {
      customerEmail: this.customerEmail || undefined,
      items: this.cart().map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      })),
      paymentMethod: this.paymentMethod,
      cashReceived: this.cashReceived || undefined,
      walletAmount: this.paymentMethod === 'MIXED' ? this.walletAmount : undefined,
      notes: 'Cobro mostrador POS'
    };

    this.posService.checkout(payload).subscribe({
      next: (order) => {
        this.processing.set(false);
        this.completedOrder.set(order);
        this.clearCart();
        // Recargar inventario para actualizar stocks
        this.loadInitialData();
      },
      error: (err) => {
        this.processing.set(false);
        alert(err.error?.message || 'Error procesando la venta en caja.');
      }
    });
  }

  closeReceiptModal(): void {
    this.completedOrder.set(null);
  }
}
