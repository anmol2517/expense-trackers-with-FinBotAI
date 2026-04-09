import fs from 'fs'
import path from 'path'

const logsDir = path.join(process.cwd(), 'logs')

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

const accessLogFile = path.join(logsDir, 'access.log')
const errorLogFile = path.join(logsDir, 'error.log')

export function logAccess(method: string, url: string, status: number, duration: number) {
  const timestamp = new Date().toISOString()
  const line = `[${timestamp}] ${method} ${url} ${status} ${duration}ms\n`
  fs.appendFileSync(accessLogFile, line)
}

export function logError(error: unknown, context?: string) {
  const timestamp = new Date().toISOString()
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : ''
  const line = `[${timestamp}] [ERROR] ${context ? `[${context}] ` : ''}${message}\n${stack ? stack + '\n' : ''}`
  fs.appendFileSync(errorLogFile, line)
}

export function logInfo(message: string, context?: string) {
  const timestamp = new Date().toISOString()
  const line = `[${timestamp}] [INFO] ${context ? `[${context}] ` : ''}${message}\n`
  fs.appendFileSync(accessLogFile, line)
}
