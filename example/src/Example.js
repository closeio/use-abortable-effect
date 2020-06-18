import React, { useState } from 'react';

import useAbortableEffect from '@closeio/use-abortable-effect';

const URL = `//run.mocky.io/v3/fb2943b6-ef22-4037-b067-9b22e47f3326?mocky-delay=5000ms`;

export default function Example() {
  const [counter, setCounter] = useState(0);
  const [status, setStatus] = useState(new Map());

  const abortControllerRef = useAbortableEffect(
    (signal) => {
      (async () => {
        setStatus((status) => ({ ...status, [counter]: 'fetching' }));
        try {
          await fetch(URL, { signal });
          setStatus((status) => ({ ...status, [counter]: 'done' }));
        } catch (e) {
          if (e.name === 'AbortError') {
            setStatus((status) => ({ ...status, [counter]: 'aborted' }));
          } else {
            throw e;
          }
        }
      })();
    },
    [counter],
  );

  return (
    <>
      <div>Fetch issues a request that responds after 5 seconds.</div>
      <br />
      <div>
        <button onClick={() => setCounter((count) => count + 1)}>
          {status[counter] === 'fetching' && 'refetch'}
          {status[counter] !== 'fetching' && 'fetch'}
        </button>{' '}
        |{' '}
        <button
          onClick={() => abortControllerRef.current.abort()}
          disabled={status[counter] !== 'fetching'}
        >
          Abort fetch
        </button>
      </div>
      <br />
      <div>
        Fetch status: <strong>{status[counter]}</strong>
        {status[counter - 1] && (
          <>
            <br />
            Previous fetch status: <strong>{status[counter - 1]}</strong>
          </>
        )}
      </div>
    </>
  );
}
