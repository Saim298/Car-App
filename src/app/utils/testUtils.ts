import { safeStringify } from './safeLogger';

// Create a custom serializer for Jest
expect.addSnapshotSerializer({
  test: (val) => typeof val === 'object' && val !== null,
  print: (val, serialize) => {
    try {
      return serialize(JSON.parse(safeStringify(val)));
    } catch (error) {
      return serialize('[Circular Object]');
    }
  },
});

// Helper function to safely serialize objects for Jest
export function safeSerialize(obj: any): any {
  try {
    return JSON.parse(safeStringify(obj));
  } catch (error) {
    return { error: 'Circular reference detected' };
  }
} 