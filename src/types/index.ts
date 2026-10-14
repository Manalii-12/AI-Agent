export type AgentState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface Order {
  orderId: string;
  customer: string;
  product: string;
  value: number; // in INR
  status: 'Processing' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  notes: string;
  courier?: string;
  trackingNumber?: string;
  expectedDelivery?: string;
  deliveredDaysAgo?: number;
  orderPlacedHoursAgo?: number;
}

export interface TranscriptMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  timestamp: string;
  toolCall?: {
    name: string;
    args: Record<string, any>;
    result: any;
  };
}

export interface CallSummaryOutcome {
  customer_intent: 
    | 'ORDER_TRACKING' 
    | 'RETURN_REQUEST' 
    | 'CANCELLATION' 
    | 'SHIPPING_INQUIRY' 
    | 'PAYMENT_COD_INQUIRY' 
    | 'PRODUCT_INQUIRY' 
    | 'OUT_OF_SCOPE' 
    | 'GENERAL_QUERY';
  order_id: string | null;
  resolution_status: 'RESOLVED' | 'POLICY_DENIED' | 'NEEDS_FOLLOW_UP' | 'UNRESOLVED';
  call_summary: string;
  key_points?: string[];
  customer_sentiment?: 'Positive' | 'Neutral' | 'Frustrated';
}
