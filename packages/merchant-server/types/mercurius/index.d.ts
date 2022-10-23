import { buildContext } from '../../app';

declare module 'mercurius' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface MercuriusContext extends ReturnType<typeof buildContext> {}
}
