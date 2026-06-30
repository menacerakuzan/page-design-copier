/** Short, collision-unlikely client-side id for draft/list keys. */
export const uid = () => Math.random().toString(36).slice(2, 10);
