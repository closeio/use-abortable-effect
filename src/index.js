import { useRef, useEffect } from 'react';

const noop = () => {};

function createAbortController() {
  // Use the mock abort controller for envs that do not support the
  // AbortController API. This results in noop on attempts to abort.
  const mockAbortController = {
    abort: noop,
    signal: {
      aborted: false,
      onabort: noop,
      addEventListener: noop,
      removeEventListener: noop,
      dispatchEvent: noop,
    },
  };

  return typeof AbortController !== 'undefined'
    ? new AbortController()
    : mockAbortController;
}

/**
 * Runs an abortable effect.
 *
 * By default it auto-aborts whenever the effect is re-run.
 *
 * @example Abortable `fetch` requests.
 * const abortControllerRef = useAbortableEffect(abortSignal =>
 *   fetch(url, { signal: abortSignal })
 *     .then(…)
 *     .catch(rejection => {
 *       if (rejection.name !== 'AbortError') {
 *         // Re-throw or handle non-abort rejection in another way.
 *         return Promise.reject(rejection);
 *       }
 *     }),
 * );
 *
 * @example Arbitrary computation that can be aborted
 * const abortControllerRef = useAbortableEffect(abortSignal => {
 *   new Promise((resolve, reject) => {
 *     const abortRejection = new DOMException(
 *       'Calculation aborted by the user',
 *       'AbortError',
 *     );
 *
 *     // Handle when abort was requested before starting the computation.
 *     if (abortSignal.aborted) {
 *       return reject(abortRejection);
 *     }
 *
 *     // This simulates an expensive computation.
 *     const timeout = setTimeout(() => resolve(1), 5000);
 *
 *     // Listen for abort request.
 *     abortSignal.addEventListener('abort', () => {
 *       clearTimeout(timeout);
 *       reject(abortRejection);
 *     });
 *   })
 *     .then(…)
 *     .catch(rejection => {
 *       if (rejection.name !== 'AbortError') {
 *         // Re-throw or handle non-abort rejection in another way.
 *         return Promise.reject(rejection);
 *       }
 *     }),
 * });
 *
 * @example Custom cleanup function
 * const [gotAborted, setGotAborted] = useState(false);
 *
 * const abortControllerRef = useAbortableEffect(abortSignal => {
 *   fetch(url, { signal: abortSignal })
 *     .then(…)
 *     .catch(rejection => {
 *       if (rejection.name !== 'AbortError') {
 *         // Re-throw or handle non-abort rejection in another way.
 *         return Promise.reject(rejection);
 *       }
 *     });
 *
 *   return controller => {
 *     controller.abort();
 *     setGotAborted(true);
 *   }
 * });
 *
 * @param effect Imperative function that accepts a `signal: AbortSignal` as a
 *               param and it *can* return a cleanup function, which takes the
 *               abort controller as a param. If there is no cleanup function
 *               returned, the default cleanup which aborts the effect is run.
 * @param deps If present, effect will only activate if the values in the list change.
 * @return {RefObject<AbortController>}
 */
export default function useAbortableEffect(effect, deps) {
  const firstRun = useRef(true);
  const controllerRef = useRef();

  // Create an abort controller for the very first run.
  if (!controllerRef.current) {
    controllerRef.current = createAbortController();
  }

  useEffect(
    () => {
      // The first run already has a controller, create a new one only for
      // subsequent effect runs.
      if (firstRun.current === false) {
        controllerRef.current = createAbortController();
      } else {
        firstRun.current = false;
      }

      const controller = controllerRef.current;
      const cleanupFn = effect(controller.signal);

      if (typeof cleanupFn === 'function') {
        return () => cleanupFn.call(null, controller);
      }

      return () => controller.abort();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps,
  );

  return controllerRef;
}
