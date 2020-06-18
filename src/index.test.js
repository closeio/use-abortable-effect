import { renderHook } from '@testing-library/react-hooks';

import useAbortableEffect from './';

beforeEach(() => {
  jest.useFakeTimers();
});

test('returns an abort controller', () => {
  const { result } = renderHook(() => useAbortableEffect(() => {}));
  const abortController = result.current.current;

  expect(abortController).toEqual(expect.any(AbortController));
});

test('calls effect function with abort signal as param', () => {
  const effect = jest.fn();
  renderHook(() => useAbortableEffect(effect));

  expect(effect).toHaveBeenCalledWith(expect.any(AbortSignal));
});

test('supports custom cleanup function', () => {
  let fillMeOnCleanup;

  const { rerender } = renderHook(() =>
    useAbortableEffect(() => (abortController) => {
      abortController.abort();
      fillMeOnCleanup = 'cleaned up!';
    }),
  );

  expect(fillMeOnCleanup).toBeUndefined();

  rerender();

  expect(fillMeOnCleanup).toBe('cleaned up!');
});

test('supports custom async operation aborting', () => {
  const abortRejection = new DOMException(
    'Calculation aborted by the user',
    'AbortError',
  );

  let promise;
  const { result } = renderHook(() =>
    useAbortableEffect((abortSignal) => {
      promise = new Promise((resolve, reject) => {
        // Handle when abort was requested before starting the computation.
        if (abortSignal.aborted) {
          return reject(abortRejection);
        }

        // This simulates an expensive computation.
        const timeout = setTimeout(() => resolve(1), 5000);

        // Listen for abort request.
        abortSignal.addEventListener('abort', () => {
          clearTimeout(timeout);
          reject(abortRejection);
        });
      });
    }),
  );

  const abortController = result.current.current;

  abortController.abort();

  expect(promise).rejects.toBe(abortRejection);
});

test('by default aborts on cleanup', () => {
  const { result, rerender } = renderHook(() => useAbortableEffect(() => {}));

  const abortController = result.current.current;

  expect(abortController.signal.aborted).toBe(false);

  rerender();

  expect(abortController.signal.aborted).toBe(true);
});

test('re-runs on deps change', () => {
  let runs = 0;
  let dependency = 'someValue';
  const effect = () => runs++;
  const { rerender } = renderHook(() =>
    useAbortableEffect(effect, [dependency]),
  );

  expect(runs).toBe(1);

  rerender();

  expect(runs).toBe(1);

  dependency = 'newValue';
  rerender();

  expect(runs).toBe(2);
});

test('creates new abort controller for each effect run', async () => {
  let currentSignal;
  let dependency = 'someValue';
  const effect = (signal) => {
    currentSignal = signal;
  };
  const { result, rerender } = renderHook(() =>
    useAbortableEffect(effect, [dependency]),
  );

  const prevAbortController = result.current.current;

  expect(result.current.current.signal).toBe(currentSignal);

  dependency = 'newValue';
  rerender();

  expect(result.current.current).not.toBe(prevAbortController);
  expect(result.current.current.signal).toBe(currentSignal);
});
