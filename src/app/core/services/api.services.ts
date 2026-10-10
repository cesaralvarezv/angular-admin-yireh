import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Product,
  Category,
  CashClosure,
  Order,
  PhysicalAsset,
  SatisfactionSurvey,
  SalesReport,
  ProjectionReport
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class PosService {
  private readonly baseUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/products`);
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/categories`);
  }

  checkout(payload: {
    customerEmail?: string;
    items: { productId: number; quantity: number }[];
    paymentMethod: string;
    cashReceived?: number;
    walletAmount?: number;
    notes?: string;
  }): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/pos/checkout`, payload);
  }
}

@Injectable({ providedIn: 'root' })
export class CashClosureService {
  private readonly baseUrl = 'http://localhost:8080/api/cash-closures';

  constructor(private http: HttpClient) {}

  getCurrentClosure(): Observable<CashClosure | null> {
    return this.http.get<CashClosure | null>(`${this.baseUrl}/current`);
  }

  openClosure(openingAmount: number, notes?: string): Observable<CashClosure> {
    return this.http.post<CashClosure>(`${this.baseUrl}/open`, { openingAmount, notes });
  }

  closeClosure(declaredCash: number, notes?: string): Observable<CashClosure> {
    return this.http.post<CashClosure>(`${this.baseUrl}/close`, { declaredCash, notes });
  }

  getAllClosures(): Observable<CashClosure[]> {
    return this.http.get<CashClosure[]>(this.baseUrl);
  }
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly baseUrl = 'http://localhost:8080/api/reports';

  constructor(private http: HttpClient) {}

  getSalesReport(startDate?: string, endDate?: string): Observable<SalesReport> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<SalesReport>(`${this.baseUrl}/sales`, { params });
  }

  getProjections(): Observable<ProjectionReport> {
    return this.http.get<ProjectionReport>(`${this.baseUrl}/projections`);
  }
}

@Injectable({ providedIn: 'root' })
export class AssetService {
  private readonly baseUrl = 'http://localhost:8080/api/assets';

  constructor(private http: HttpClient) {}

  getAllAssets(): Observable<PhysicalAsset[]> {
    return this.http.get<PhysicalAsset[]>(this.baseUrl);
  }

  createAsset(asset: Partial<PhysicalAsset>): Observable<PhysicalAsset> {
    return this.http.post<PhysicalAsset>(this.baseUrl, asset);
  }

  updateAsset(id: number, asset: Partial<PhysicalAsset>): Observable<PhysicalAsset> {
    return this.http.put<PhysicalAsset>(`${this.baseUrl}/${id}`, asset);
  }

  deleteAsset(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class SurveyService {
  private readonly baseUrl = 'http://localhost:8080/api/satisfaction/surveys';

  constructor(private http: HttpClient) {}

  getAllSurveys(): Observable<SatisfactionSurvey[]> {
    return this.http.get<SatisfactionSurvey[]>(this.baseUrl);
  }
}
