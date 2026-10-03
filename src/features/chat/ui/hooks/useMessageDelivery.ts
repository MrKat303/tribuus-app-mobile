import { useCallback, useEffect, useRef } from 'react';

import type { Message } from '@/features/chat/domain/message';

type DeliveryPatch = Pick<Message, 'deliveryStatus' | 'uploadProgress'>;

export function useMessageDelivery(onUpdate: (messageId: string, patch: DeliveryPatch) => void) {
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
  }, []);

  return useCallback((messageId: string, includesImage: boolean) => {
    const schedule = (delay: number, patch: DeliveryPatch) => {
      const timer = setTimeout(() => {
        timers.current.delete(timer);
        onUpdate(messageId, patch);
      }, delay);
      timers.current.add(timer);
    };

    if (includesImage) {
      schedule(180, { deliveryStatus: 'sending', uploadProgress: 0.28 });
      schedule(420, { deliveryStatus: 'sending', uploadProgress: 0.56 });
      schedule(700, { deliveryStatus: 'sending', uploadProgress: 0.82 });
      schedule(980, { deliveryStatus: 'sent', uploadProgress: 1 });
      schedule(1480, { deliveryStatus: 'delivered', uploadProgress: 1 });
      schedule(2280, { deliveryStatus: 'read', uploadProgress: 1 });
      return;
    }

    schedule(260, { deliveryStatus: 'sent' });
    schedule(720, { deliveryStatus: 'delivered' });
    schedule(1380, { deliveryStatus: 'read' });
  }, [onUpdate]);
}
