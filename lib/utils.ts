import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function titleCase(str: string) {
  return str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
}

export function parseCurlCommand(command: string) {
  const urlMatch = command.match(/curl\s+(?:-X\s+\w+\s+)?(?:--url\s+)?['"]?([^'"\s]+)['"]?/i)
  const methodMatch = command.match(/-X\s+([A-Z]+)/i) || command.match(/--request\s+([A-Z]+)/i)
  const dataMatch = command.match(/(?:-d|--data|--data-raw)\s+(['"])([\s\S]*?)\1/)
  
  const headers = []
  const headerRegex = /(?:-H|--header)\s+(['"])(.*?)\1/g
  let match

  while ((match = headerRegex.exec(command)) !== null) {
      const parts = match[2].split(':')
      if (parts.length >= 2) {
          headers.push({
              id: crypto.randomUUID(),
              key: parts[0].trim(),
              value: parts.slice(1).join(':').trim()
          })
      }
  }

  return {
      url: urlMatch ? urlMatch[1] : '',
      method: methodMatch ? methodMatch[1] : (dataMatch ? 'POST' : 'GET'),
      headers,
      body: dataMatch ? [{ id: crypto.randomUUID(), key: 'raw', value: dataMatch[2] }] : [],
      query: [],
      path: []
  }
}
