import { ErrorHandler, Provider, provideZoneChangeDetection } from "@angular/core";
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

/**
 * Sentry is imported dynamically, and only when a DSN is configured.
 *
 * A static `import * as Sentry` costs the initial bundle ~52 kB whether or not error reporting is
 * ever switched on - measured, and enough on its own to breach the 550 kB budget this app already
 * worked to get under (966 kB -> 298 kB via lazy routes). A dynamic import puts Sentry in its own
 * chunk that is fetched only by deployments that actually use it, so the default build pays
 * nothing.
 *
 * Guarding on the DSN rather than always initializing also keeps development quiet: an
 * unconfigured `Sentry.init()` still installs global error and unhandled-rejection handlers, so
 * every local error would take a detour through Sentry's machinery before reaching the console
 * where it is being read.
 */
async function sentryProviders(): Promise<Provider[]> {
  if (!environment.sentryDsn) {
    return [];
  }

  const Sentry = await import('@sentry/angular');

  Sentry.init({
    dsn: environment.sentryDsn,
    environment: environment.production ? 'production' : 'development',

    // The default (1.0) sends a performance trace for every transaction. On anything with real
    // traffic that exhausts the quota within days and then starts silently dropping the errors
    // too, which are the part actually worth having.
    tracesSampleRate: 0.1,

    // No names or email addresses leave the app. The user id already held for display is enough to
    // tell "one user hit this 200 times" apart from "200 users hit it once".
    sendDefaultPii: false
  });

  return [{ provide: ErrorHandler, useValue: Sentry.createErrorHandler() }];
}

async function bootstrap(): Promise<void> {
  await bootstrapApplication(AppComponent, {
    ...appConfig,
    providers: [
      provideZoneChangeDetection(),
      ...appConfig.providers,
      ...(await sentryProviders())
    ]
  });
}

bootstrap().catch((err) => console.error(err));
