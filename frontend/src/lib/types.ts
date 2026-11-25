export interface Product {
  product_id: number;
  product_name: string;
  aisle_id: number | null;
  department_id: number | null;
  aisle: string | null;
  department: string | null;
}

export interface ProductListResponse {
  total: number;
  page: number;
  page_size: number;
  products: Product[];
}

export interface DepartmentsResponse {
  departments: string[];
}

export interface PopularProduct {
  product_id: number;
  product_name: string;
  basket_count: number;
}

export interface PopularProductsResponse {
  total_baskets: number;
  products: PopularProduct[];
}

export interface RecommendedProduct {
  product_id: number;
  product_name: string;
  confidence: number | null;
  lift: number | null;
  support: number | null;
  source: string;
  explanation: string;
  triggered_by: string[];
}

export interface RecommendationResponse {
  recommendations: RecommendedProduct[];
}
