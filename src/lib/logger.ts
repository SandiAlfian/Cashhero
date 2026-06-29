const PREFIX = '[Cashhero]'

type LogLevel = 'info' | 'warn' | 'error'

function log(level: LogLevel, context: string, message: string, data?: unknown) {
  const timestamp = new Date().toISOString()
  const entry = { timestamp, level, context, message }

  switch (level) {
    case 'error':
      console.error(PREFIX, JSON.stringify(entry), data ?? '')
      break
    case 'warn':
      console.warn(PREFIX, JSON.stringify(entry), data ?? '')
      break
    default:
      console.log(PREFIX, JSON.stringify(entry), data ?? '')
  }
}

export const logger = {
  info: (context: string, message: string, data?: unknown) => log('info', context, message, data),
  warn: (context: string, message: string, data?: unknown) => log('warn', context, message, data),
  error: (context: string, message: string, data?: unknown) => log('error', context, message, data),
}
