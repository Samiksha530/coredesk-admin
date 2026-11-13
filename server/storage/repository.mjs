let repositoryPromise;
export function getRepository() {
  if (!repositoryPromise) {
    repositoryPromise = (async () => {
      if (process.env.DATABASE_URL) {
        const { createPostgresRepository } = await import('./postgres.repository.mjs');
        return createPostgresRepository(process.env.DATABASE_URL);
      }
      if (process.env.VERCEL)
        throw new Error('DATABASE_URL must be configured for Vercel deployment.');
      const { createLocalRepository } = await import('./local.repository.mjs');
      return createLocalRepository();
    })().catch((error) => {
      repositoryPromise = undefined;
      throw error;
    });
  }
  return repositoryPromise;
}
