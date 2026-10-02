import { useCallback, useState } from 'react';

type RetryAction = () => void | Promise<void>;
type ResetSessionAction = () => void;

export function useErrorRecovery(resetSessionAction: ResetSessionAction) {
  const [hasRetried, setHasRetried] = useState(false);

  const retry = useCallback((action: RetryAction) => {
    setHasRetried(true);
    void action();
  }, []);

  const markRecovered = useCallback(() => {
    setHasRetried(false);
  }, []);

  const resetSession = useCallback(() => {
    resetSessionAction();
  }, [resetSessionAction]);

  return {
    hasRetried,
    retry,
    markRecovered,
    resetSession,
  };
}
