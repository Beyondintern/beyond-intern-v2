// Minimal useToast hook — routes into the shared toast store used by <Toaster/>,
// so `toast()` from any component renders through the single global Toaster.
import { useEffect, useState } from "react";
import { subscribeToToasts, toast, type Toast as UiToast } from "@/components/ui/toaster";

export type Toast = UiToast;
type ToastState = Toast[];

export function useToast() {
  const [state, setState] = useState<ToastState>([]);

  useEffect(() => {
    const unsubscribe = subscribeToToasts((t) => setState([...t]));
    return unsubscribe;
  }, []);

  return { toasts: state, toast };
}
