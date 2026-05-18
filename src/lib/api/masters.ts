import { client } from './client';
import type { ApiResponse } from './auth';

// ---------- Types ----------
export interface Part {
  id: string;
  companyId: string;
  locationId?: string;
  partNumber: string;
  name: string;
  engineeringPartNo?: string;
  categoryId?: string;
  category?: { id: string; name: string };
  productModelId?: string;
  productModel?: { id: string; name: string };
  uomId?: string;
  uom?: { id: string; name: string; abbreviation: string };
  partType: string;
  revision?: string;
  drawingReference?: string;
  hsnCode?: string;
  weight?: number;
  dimensions?: string;
  isBatchTracked: boolean;
  isSerialTracked: boolean;
  isBomEnabled: boolean;
  isQcRequired: boolean;
  isInventoryItem: boolean;
  preferredVendorId?: string;
  status: string;
  componentTypeId?: string;
  componentType?: { id: string; name: string; code?: string };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PartCategory {
  id: string;
  companyId: string;
  name: string;
  code?: string;
  isActive: boolean;
}

export interface ProductModel {
  id: string;
  companyId: string;
  name: string;
  code?: string;
  isActive: boolean;
}

export interface UnitOfMeasure {
  id: string;
  companyId: string;
  name: string;
  abbreviation: string;
  isActive: boolean;
}

export interface PartComponentType {
  id: string;
  companyId: string;
  name: string;
  isActive: boolean;
}

export interface Machine {
  id: string;
  companyId: string;
  locationId?: string;
  assetCode: string;
  assetName: string;
  machineCode?: string;
  serialNumber?: string;
  categoryId?: string;
  category?: { id: string; name: string };
  typeId?: string;
  type?: { id: string; name: string };
  zoneId?: string;
  zone?: { id: string; name: string };
  departmentId?: string;
  lineWorkCenter?: string;
  priority: string;
  capacity?: string;
  make?: string;
  model?: string;
  powerRating?: string;
  yearOfManufacture?: number;
  status: string;
  idleReason?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MachineCategory {
  id: string;
  companyId: string;
  name: string;
  isActive: boolean;
}

export interface MachineType {
  id: string;
  companyId: string;
  name: string;
  isActive: boolean;
}

export interface MachineZone {
  id: string;
  companyId: string;
  name: string;
  code?: string;
  locationId?: string;
  isActive: boolean;
}

// ---------- Part API ----------

async function listParts(params?: Record<string, unknown>): Promise<ApiResponse<Part[]>> {
    const response = await client.get('/masters/parts', { params });
    return response.data;
}

async function getPart(id: string): Promise<ApiResponse<Part>> {
    const response = await client.get(`/masters/parts/${id}`);
    return response.data;
}

async function createPart(data: Record<string, unknown>): Promise<ApiResponse<Part>> {
    const response = await client.post('/masters/parts', data);
    return response.data;
}

async function updatePart(id: string, data: Record<string, unknown>): Promise<ApiResponse<Part>> {
    const response = await client.patch(`/masters/parts/${id}`, data);
    return response.data;
}

async function deletePart(id: string): Promise<ApiResponse<void>> {
    const response = await client.delete(`/masters/parts/${id}`);
    return response.data;
}

async function listPartCategories(): Promise<ApiResponse<PartCategory[]>> {
    const response = await client.get('/masters/parts/categories/list');
    return response.data;
}

async function createPartCategory(data: Record<string, unknown>): Promise<ApiResponse<PartCategory>> {
    const response = await client.post('/masters/parts/categories', data);
    return response.data;
}

async function updatePartCategory(id: string, data: Record<string, unknown>): Promise<ApiResponse<PartCategory>> {
    const response = await client.patch(`/masters/parts/categories/${id}`, data);
    return response.data;
}

async function deletePartCategory(id: string): Promise<ApiResponse<void>> {
    const response = await client.delete(`/masters/parts/categories/${id}`);
    return response.data;
}

async function listProductModels(): Promise<ApiResponse<ProductModel[]>> {
    const response = await client.get('/masters/parts/product-models/list');
    return response.data;
}

async function createProductModel(data: Record<string, unknown>): Promise<ApiResponse<ProductModel>> {
    const response = await client.post('/masters/parts/product-models', data);
    return response.data;
}

async function updateProductModel(id: string, data: Record<string, unknown>): Promise<ApiResponse<ProductModel>> {
    const response = await client.patch(`/masters/parts/product-models/${id}`, data);
    return response.data;
}

async function deleteProductModel(id: string): Promise<ApiResponse<void>> {
    const response = await client.delete(`/masters/parts/product-models/${id}`);
    return response.data;
}

async function listUoms(): Promise<ApiResponse<UnitOfMeasure[]>> {
    const response = await client.get('/masters/parts/uoms/list');
    return response.data;
}

async function createUom(data: Record<string, unknown>): Promise<ApiResponse<UnitOfMeasure>> {
    const response = await client.post('/masters/parts/uoms', data);
    return response.data;
}

async function updateUom(id: string, data: Record<string, unknown>): Promise<ApiResponse<UnitOfMeasure>> {
    const response = await client.patch(`/masters/parts/uoms/${id}`, data);
    return response.data;
}

async function deleteUom(id: string): Promise<ApiResponse<void>> {
    const response = await client.delete(`/masters/parts/uoms/${id}`);
    return response.data;
}

async function listComponentTypes(): Promise<ApiResponse<PartComponentType[]>> {
    const response = await client.get('/masters/parts/component-types/list');
    return response.data;
}

async function createComponentType(data: Record<string, unknown>): Promise<ApiResponse<PartComponentType>> {
    const response = await client.post('/masters/parts/component-types', data);
    return response.data;
}

async function updateComponentType(id: string, data: Record<string, unknown>): Promise<ApiResponse<PartComponentType>> {
    const response = await client.patch(`/masters/parts/component-types/${id}`, data);
    return response.data;
}

async function deleteComponentType(id: string): Promise<ApiResponse<void>> {
    const response = await client.delete(`/masters/parts/component-types/${id}`);
    return response.data;
}

export const partApi = {
    listParts,
    getPart,
    createPart,
    updatePart,
    deletePart,
    listCategories: listPartCategories,
    createCategory: createPartCategory,
    updateCategory: updatePartCategory,
    deleteCategory: deletePartCategory,
    listProductModels,
    createProductModel,
    updateProductModel,
    deleteProductModel,
    listUoms,
    createUom,
    updateUom,
    deleteUom,
    listComponentTypes,
    createComponentType,
    updateComponentType,
    deleteComponentType,
};

// ---------- Machine API ----------

async function listMachines(params?: Record<string, unknown>): Promise<ApiResponse<Machine[]>> {
    const response = await client.get('/masters/machines', { params });
    return response.data;
}

async function getMachine(id: string): Promise<ApiResponse<Machine>> {
    const response = await client.get(`/masters/machines/${id}`);
    return response.data;
}

async function createMachine(data: Record<string, unknown>): Promise<ApiResponse<Machine>> {
    const response = await client.post('/masters/machines', data);
    return response.data;
}

async function updateMachine(id: string, data: Record<string, unknown>): Promise<ApiResponse<Machine>> {
    const response = await client.patch(`/masters/machines/${id}`, data);
    return response.data;
}

async function deleteMachine(id: string): Promise<ApiResponse<void>> {
    const response = await client.delete(`/masters/machines/${id}`);
    return response.data;
}

async function listMachineCategories(): Promise<ApiResponse<MachineCategory[]>> {
    const response = await client.get('/masters/machines/categories/list');
    return response.data;
}

async function createMachineCategory(data: Record<string, unknown>): Promise<ApiResponse<MachineCategory>> {
    const response = await client.post('/masters/machines/categories', data);
    return response.data;
}

async function updateMachineCategory(id: string, data: Record<string, unknown>): Promise<ApiResponse<MachineCategory>> {
    const response = await client.patch(`/masters/machines/categories/${id}`, data);
    return response.data;
}

async function deleteMachineCategory(id: string): Promise<ApiResponse<void>> {
    const response = await client.delete(`/masters/machines/categories/${id}`);
    return response.data;
}

async function listMachineTypes(): Promise<ApiResponse<MachineType[]>> {
    const response = await client.get('/masters/machines/types/list');
    return response.data;
}

async function createMachineType(data: Record<string, unknown>): Promise<ApiResponse<MachineType>> {
    const response = await client.post('/masters/machines/types', data);
    return response.data;
}

async function updateMachineType(id: string, data: Record<string, unknown>): Promise<ApiResponse<MachineType>> {
    const response = await client.patch(`/masters/machines/types/${id}`, data);
    return response.data;
}

async function deleteMachineType(id: string): Promise<ApiResponse<void>> {
    const response = await client.delete(`/masters/machines/types/${id}`);
    return response.data;
}

async function listMachineZones(params?: Record<string, unknown>): Promise<ApiResponse<MachineZone[]>> {
    const response = await client.get('/masters/machines/zones/list', { params });
    return response.data;
}

async function createMachineZone(data: Record<string, unknown>): Promise<ApiResponse<MachineZone>> {
    const response = await client.post('/masters/machines/zones', data);
    return response.data;
}

async function updateMachineZone(id: string, data: Record<string, unknown>): Promise<ApiResponse<MachineZone>> {
    const response = await client.patch(`/masters/machines/zones/${id}`, data);
    return response.data;
}

async function deleteMachineZone(id: string): Promise<ApiResponse<void>> {
    const response = await client.delete(`/masters/machines/zones/${id}`);
    return response.data;
}

export const machineApi = {
    listMachines,
    getMachine,
    createMachine,
    updateMachine,
    deleteMachine,
    listCategories: listMachineCategories,
    createCategory: createMachineCategory,
    updateCategory: updateMachineCategory,
    deleteCategory: deleteMachineCategory,
    listTypes: listMachineTypes,
    createType: createMachineType,
    updateType: updateMachineType,
    deleteType: deleteMachineType,
    listZones: listMachineZones,
    createZone: createMachineZone,
    updateZone: updateMachineZone,
    deleteZone: deleteMachineZone,
};
