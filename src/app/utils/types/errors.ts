export enum ErrorCode {
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  
  // API Errors
  INVALID_TOKEN = 'INVALID_TOKEN',
  RATE_LIMIT = 'RATE_LIMIT',
  INVALID_VIN = 'INVALID_VIN',
  
  // Data Errors
  NO_LISTINGS = 'NO_LISTINGS',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  MISSING_REQUIRED_FIELDS = 'MISSING_REQUIRED_FIELDS',
  
  // Search Errors
  SEARCH_FAILED = 'SEARCH_FAILED',
  PARTIAL_RESULTS = 'PARTIAL_RESULTS',
  
  // Unknown
  UNKNOWN = 'UNKNOWN'
}

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: any;
  timestamp: string;
  endpoint?: string;
}

export class MarketCheckError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: any,
    public endpoint?: string
  ) {
    super(message);
    this.name = 'MarketCheckError';
  }

  toJSON(): ApiError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      endpoint: this.endpoint,
      timestamp: new Date().toISOString()
    };
  }
} 