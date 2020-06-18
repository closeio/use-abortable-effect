# use-abortable-effect

[![NPM](https://img.shields.io/npm/v/@closeio/use-abortable-effect.svg)](https://www.npmjs.com/package/@closeio/use-abortable-effect) [![JavaScript Style Guide](https://img.shields.io/badge/code%20style-prettier-success)](https://prettier.io)

Super simple React hook for running abortable effects based on the [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) API.

[Check the live DEMO](https://closeio.github.io/use-abortable-effect/).

### <img height="40px" src="./close.svg" />

Interested in working on projects like this? [Close](https://close.com) is looking for [great engineers](https://jobs.close.com) to join our team!

## Install

```bash
yarn add @closeio/use-abortable-effect
```

## Benefits

- Extremely lightweight (less than 500B minzipped).
- It uses the [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) API and it is compatible with the [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) API.
- If a browser does not support the [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) API then the hook behaves exactly like a regular [`useEffect`](https://reactjs.org/docs/hooks-effect.html) hook. See [Can I Use](https://caniuse.com/#search=abortcontroller) for browser support overview.
- No other 3rd-party dependencies.

## API differences over [`useEffect`](https://reactjs.org/docs/hooks-effect.html)

- API is compatible with [`useEffect`](https://reactjs.org/docs/hooks-effect.html),
  where the effect function you pass-in accepts an [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) instance as a param and you
  can return a cleanup function that accepts an [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) instance.
- Supports abortable [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) requests.
- Supports running custom operations/computations that can be easily aborted.
- Auto-aborts effects on re-run (or component unmount), unless you provide
  a custom cleanup function.

```jsx
useEffect(() => {
  // do something

  return () => {
    /* cleanup */
  };
}, [deps]);

const abortControllerRef = useAbortableEffect(
  (abortSignal) => {
    // do something

    return (abortController) => {
      /* do cleanup, you should probably abort */
    };
  },
  [deps],
);
```

## Usage

### Abortable [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) requests

```jsx
import React from 'react';
import useAbortableEffect from '@closeio/use-abortable-effect';

export default function MyAbortableFetchComponent() {
  const abortControllerRef = useAbortableEffect((abortSignal) =>
    fetch(url, { signal: abortSignal })
      .then(/* … */)
      .catch((rejection) => {
        if (rejection.name !== 'AbortError') {
          // Re-throw or handle non-abort rejection in another way.
          return Promise.reject(rejection);
        }
      }),
  );

  const handleManualAbort = () => abortControllerRef.current.abort();

  // …
}
```

### Arbitrary computation that can be aborted

```jsx
import React from 'react';
import useAbortableEffect from '@closeio/use-abortable-effect';

export default function MyAbortableComputationComponent() {
  const abortControllerRef = useAbortableEffect(abortSignal => {
    new Promise((resolve, reject) => {
      // Should be a DOMException per spec.
      const abortRejection = new DOMException(
        'Calculation aborted by the user',
        'AbortError',
      );

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
    })
      .then(/* … */)
      .catch(rejection => {
        if (rejection.name !== 'AbortError') {
          // Re-throw or handle non-abort rejection in another way.
          return Promise.reject(rejection);
        }
      }),
  });

  const handleManualAbort = () => abortControllerRef.current.abort();

  // …
}
```

### Custom cleanup function

```jsx
import React from 'react';
import useAbortableEffect from '@closeio/use-abortable-effect';

export default function MyCustomCleanupComponent() {
  const [gotAborted, setGotAborted] = useState(false);

  const abortControllerRef = useAbortableEffect((abortSignal) => {
    fetch(url, { signal: abortSignal })
      .then(/* … */)
      .catch((rejection) => {
        if (rejection.name !== 'AbortError') {
          // Re-throw or handle non-abort rejection in another way.
          return Promise.reject(rejection);
        }
      });

    // Just return a function like in `useEffect`, with the difference that you
    // get the abort controller (not a ref) as a param.
    return (controller) => {
      controller.abort();
      setGotAborted(true);
    };
  });

  const handleManualAbort = () => abortControllerRef.current.abort();

  // …
}
```

## License

MIT © [Close](https://github.com/closeio)
