import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

export function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
