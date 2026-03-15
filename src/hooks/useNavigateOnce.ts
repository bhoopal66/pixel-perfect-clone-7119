import { useRef, useCallback } from 'react';
import { useNavigate, NavigateOptions, To } from 'react-router-dom';

/**
 * A navigate wrapper that prevents duplicate rapid navigations.
 * After a navigation fires, further calls are ignored for `lockMs` milliseconds.
 */
export function useNavigateOnce(lockMs = 2000) {
  const navigate = useNavigate();
  const lockRef = useRef(false);

  const safeNavigate = useCallback(
    (to: To, options?: NavigateOptions) => {
      if (lockRef.current) return;
      lockRef.current = true;
      navigate(to, options);
      setTimeout(() => {
        lockRef.current = false;
      }, lockMs);
    },
    [navigate, lockMs]
  );

  return safeNavigate;
}
