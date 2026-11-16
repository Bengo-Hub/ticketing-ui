// Mirrors ticketing-api internal/modules/sla/domain.go. Field names are the wire names.
import type { PageResponse, TicketPriority } from "@/types/tickets";

export interface SLAPolicy {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  priority: TicketPriority;
  category_id?: string;
  first_response_minutes: number;
  first_response_business_hours: boolean;
  resolution_minutes: number;
  resolution_business_hours: boolean;
  is_active: boolean;
  sort_order: number;
  business_hours?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateSLAPolicyData {
  name: string;
  description?: string;
  priority: TicketPriority;
  category_id?: string;
  first_response_minutes: number;
  first_response_business_hours: boolean;
  resolution_minutes: number;
  resolution_business_hours: boolean;
  sort_order?: number;
}

export interface UpdateSLAPolicyData {
  name?: string;
  description?: string;
  priority?: TicketPriority;
  category_id?: string;
  first_response_minutes?: number;
  first_response_business_hours?: boolean;
  resolution_minutes?: number;
  resolution_business_hours?: boolean;
  is_active?: boolean;
  sort_order?: number;
}

/** Query parameters of GET /{tenant}/sla/policies, named as the API reads them. */
export interface SLAPolicyListParams {
  tenantSlug: string;
  page?: number;
  limit?: number;
  priority?: TicketPriority;
  is_active?: boolean;
}

export type SLAPolicyListResponse = PageResponse<SLAPolicy>;
