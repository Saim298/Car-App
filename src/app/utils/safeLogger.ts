/**
 * Safely stringifies objects that might contain circular references
 * @param obj The object to stringify
 * @returns A string representation of the object
 */
export function safeStringify(obj: any): string {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular Reference]';
      }
      seen.add(value);
    }
    return value;
  }, 2);
}

/**
 * Safely logs objects that might contain circular references
 * @param label A label for the log
 * @param obj The object to log
 */
export function safeLog(label: string, obj: any): void {
  console.log(`${label}:`, safeStringify(obj));
} 