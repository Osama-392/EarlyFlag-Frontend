// Centralized logging utility — thin wrapper around console
const fmt = (level: string, msg: string, component?: string) =>
  `[${level}]${component ? ` [${component}]` : ''} ${msg}`;

export const logger = {
  info:    (msg: string, data?: any, c?: string) => console.log(fmt('INFO', msg, c), ...(data !== undefined ? [data] : [])),
  success: (msg: string, data?: any, c?: string) => console.log(fmt('OK', msg, c), ...(data !== undefined ? [data] : [])),
  warning: (msg: string, data?: any, c?: string) => console.warn(fmt('WARN', msg, c), ...(data !== undefined ? [data] : [])),
  error:   (msg: string, data?: any, c?: string) => console.error(fmt('ERR', msg, c), ...(data !== undefined ? [data] : [])),
  debug:   (msg: string, data?: any, c?: string) => console.debug(fmt('DBG', msg, c), ...(data !== undefined ? [data] : [])),

  // Semantic aliases — keep all call-sites working without changes
  pageNavigation:   (page: string, from?: string) => console.log(fmt('NAV', page, 'Navigation'), ...(from ? [{ from }] : [])),
  buttonClick:      (btn: string, c?: string)      => console.log(fmt('BTN', btn, c)),
  formSubmit:       (form: string, data?: any)     => console.log(fmt('FORM', form), ...(data !== undefined ? [data] : [])),
  formChange:       (field: string, v: any, c?: string) => console.debug(fmt('CHANGE', field, c), v),
  modalOpen:        (name: string, data?: any)     => console.log(fmt('MODAL', `open: ${name}`), ...(data !== undefined ? [data] : [])),
  modalClose:       (name: string)                 => console.log(fmt('MODAL', `close: ${name}`)),
  reportGeneration: (name: string, cfg: any)       => console.log(fmt('REPORT', name), cfg),
  apiCall:          (m: string, url: string)        => console.log(fmt('API', `${m} ${url}`)),
  apiResponse:      (url: string, status: number, data?: any) => console.log(fmt('API', `${url} ${status}`), ...(data !== undefined ? [data] : [])),
  apiError:         (url: string, err: any)        => console.error(fmt('API', url), err),
  stateChange:      (c: string, k: string, v: any) => console.debug(fmt('STATE', k, c), v),
};

// Expose in browser console for debugging
if (typeof window !== 'undefined') {
  (window as any).logger = logger;
}
