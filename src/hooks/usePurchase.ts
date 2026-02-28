import { useState, useCallback } from 'react';

const AI_ANALYSIS_SKU = 'ai_analysis_ticket';

interface PurchaseCallbacks {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

export function usePurchase() {
  const [loading, setLoading] = useState(false);

  const purchaseAiTicket = useCallback(async ({ onSuccess, onError }: PurchaseCallbacks) => {
    if (loading) return;
    setLoading(true);

    try {
      const { IAP } = require('@apps-in-toss/web-framework');

      IAP.createOneTimePurchaseOrder({
        options: {
          sku: AI_ANALYSIS_SKU,
          processProductGrant: ({ orderId }: { orderId: string }) => {
            console.log('AI 분석권 지급:', orderId);
            return true;
          },
        },
        onEvent: (event: { type: string }) => {
          if (event.type === 'success') {
            onSuccess?.();
          }
        },
        onError: (error: unknown) => {
          console.error('구매 실패:', error);
          onError?.(error);
        },
      });
    } catch {
      // SDK not available — simulate purchase for web preview
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const checkPendingOrders = useCallback(async (onRecover: (count: number) => void) => {
    try {
      const { IAP } = require('@apps-in-toss/web-framework');
      const result = await IAP.getPendingOrders();

      if (result?.orders && result.orders.length > 0) {
        let recovered = 0;
        for (const order of result.orders) {
          if (order.sku === AI_ANALYSIS_SKU) {
            await IAP.completeProductGrant({ params: { orderId: order.orderId } });
            recovered++;
          }
        }
        if (recovered > 0) onRecover(recovered);
      }
    } catch {
      // SDK not available
    }
  }, []);

  return { loading, purchaseAiTicket, checkPendingOrders };
}
