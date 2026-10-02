import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Los recorridos completos viven fuera de src porque no prueban una pieza aislada.
  testDir: './e2e',

  // Empezamos de forma secuencial para evitar conflictos futuros entre datos de prueba.
  fullyParallel: false,
  workers: 1,
  retries: 0,

  // El informe se genera al ejecutar las pruebas, pero no se abre automáticamente.
  reporter: [['html', { open: 'never' }]],

  use: {
    // Así las pruebas pueden navegar con rutas breves como page.goto('/login').
    baseURL: 'http://127.0.0.1:5173',

    // Estas evidencias ayudan a entender qué ocurrió cuando una prueba falla.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Playwright levanta el frontend y espera a que esté disponible.
  webServer: [
    {
      command: 'npm run e2e:server',
      cwd: '../backend',
      url: 'http://127.0.0.1:3002/api/v1/health',
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ...process.env,
        FRONTEND_URL: 'http://127.0.0.1:5173',
      },
    },
    {
      command: 'npm run dev -- --host 127.0.0.1',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ...process.env,
        VITE_API_URL: 'http://127.0.0.1:3002/api/v1',
      },
    },
  ],
});
