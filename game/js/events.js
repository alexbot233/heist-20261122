// One-frame event queue shared by simulation and sound; keeps the modules acyclic.
const queue = new WeakMap();

export function emit(state, type, data = {}) {
  let list = queue.get(state);
  if (!list) {
    list = [];
    queue.set(state, list);
  }
  list.push({ type, ...data });
}

export function drainEvents(state) {
  const list = queue.get(state) ?? [];
  queue.set(state, []);
  return list;
}
