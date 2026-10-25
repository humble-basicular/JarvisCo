// workerd uses its real class; Node uses an inert constructor with injected send.
export function resolve(specifier, context, nextResolve) {
  if (specifier === 'cloudflare:email') return { url: new URL('./stub-email.mjs', import.meta.url).href, shortCircuit: true };
  return nextResolve(specifier, context);
}
