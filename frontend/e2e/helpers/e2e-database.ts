import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export async function limpiarFichajesE2E(): Promise<void> {
  await ejecutarLimpieza('src/seeds/cleanupFichajesE2e.ts');
}

export async function limpiarTareasE2E(): Promise<void> {
  await ejecutarLimpieza('src/seeds/cleanupTareasE2e.ts');
}

export async function limpiarEvaluacionesE2E(): Promise<void> {
  await ejecutarLimpieza('src/seeds/cleanupEvaluacionesE2e.ts');
}

export async function cambiarTutorEmpresaBecarioE2E(
  tutorEmail: 'tutor.principal.e2e@pasp-demo.test' | 'tutor.alternativo.e2e@pasp-demo.test',
): Promise<void> {
  await ejecutarLimpieza('src/seeds/setTutorEmpresaE2e.ts', [tutorEmail]);
}

async function ejecutarLimpieza(
  script: string,
  args: string[] = [],
): Promise<void> {
  const backendDirectory = path.resolve(process.cwd(), '../backend');

  // Reutilizamos el Node actual y cargamos la configuración privada .env.e2e.
  await execFileAsync(
    process.execPath,
    [
      '--env-file=.env.e2e',
      'node_modules/ts-node/dist/bin.js',
      '--files',
      script,
      ...args,
    ],
    { cwd: backendDirectory, windowsHide: true },
  );
}
