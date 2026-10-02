import { AppError } from '../shared/errors';

export const demoWriteError = () =>
  new AppError(
    403,
    'DEMO_READ_ONLY',
    'Los cambios no se han aplicado porque estás en la versión demo. Puedes consultar los datos y explorar los formularios.'
  );

export const isReadMethod = (method: string) =>
  ['GET', 'HEAD', 'OPTIONS'].includes(method);
