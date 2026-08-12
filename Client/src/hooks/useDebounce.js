import { useEffect, useState } from "react";

// Delays updating the returned value until `value` stops changing for
// `delay` ms — used so a search input doesn't fire a network request on
// every keystroke, only once the user pauses typing.
export const useDebounce = (value, delay = 400) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};
