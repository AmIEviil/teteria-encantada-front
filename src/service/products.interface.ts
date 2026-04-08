export interface ProductFilters {
  tipoId?: string;
  nombre?: string;
}

export interface ITypeProduct {
  id: string;
  nombre: string;
}

export interface IProducto {
  id?: string;
  nombre: string;
  valor_unitario: number;
  cant_disponible: number;
  tipo: ITypeProduct;
  historial: IHistoricalProduct[];
}

export interface IMetricsProduct {
  tipo: string;
  disponibles: number;
  usados: number;
  porcentaje_utilizado: number;
}

export interface ICreateProductPayload {
  tipo: string;
  nombre: string;
  valor_unitario: number;
  cant_disponible: number;
}

export interface ICreateTypeProductPayload {
  nombre: string;
}

export interface IHistoricalProduct {
  id: string;
  precio_anterior: number;
  precio_nuevo: number;
  fecha_cambio: string;
}
