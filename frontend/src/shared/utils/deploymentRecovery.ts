const PRELOAD_RELOAD_KEY = 'pasp_preload_reload_at';
const PRELOAD_RELOAD_COOLDOWN_MS = 30_000;

type RecoveryStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function shouldReloadStaleDeployment(
  storage: RecoveryStorage,
  now: number = Date.now()
): boolean {
  const previousReload = Number(storage.getItem(PRELOAD_RELOAD_KEY));

  if (
    Number.isFinite(previousReload) &&
    previousReload > 0 &&
    now - previousReload < PRELOAD_RELOAD_COOLDOWN_MS
  ) {
    return false;
  }

  storage.setItem(PRELOAD_RELOAD_KEY, String(now));
  return true;
}

export function installDeploymentRecovery(): void {
  window.addEventListener('vite:preloadError', event => {
    event.preventDefault();

    try {
      if (!shouldReloadStaleDeployment(window.sessionStorage)) {
        return;
      }
    } catch {
      // Sin almacenamiento no podemos impedir un bucle de recargas.
      return;
    }

    window.location.reload();
  });
}
