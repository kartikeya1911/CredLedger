// Backwards-compat shim; main app now uses api/client and api/index.
export { api, setAuthToken } from './api/client'
export * from './api/index'
