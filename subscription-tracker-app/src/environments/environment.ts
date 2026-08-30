export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api',

  // Sentry is off unless this is filled in. Left empty in development on purpose: local errors are
  // already visible in the console, and sending them to a shared project buries the real ones from
  // production under noise nobody triaged.
  sentryDsn: ''
};
