/**
 * Create a minimal observable state container.
 * @param {object} initial
 * @returns {{getState: () => object, setState: (patch: object) => void, subscribe: (fn: Function) => () => void}}
 */
export function createStore(initial) {
  let state = { ...initial };
  const listeners = new Set();

  return {
    getState: () => state,
    setState(patch) {
      state = { ...state, ...patch };
      for (const listener of listeners) listener(state);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
