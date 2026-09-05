export interface Coordinates {
  latitude?: number;
  longitude?: number;
}

export interface AnalyzeRequest {
  file: File;
  coordinates?: Coordinates;
}

export interface AnalyzeResponse {
  scan_id: string;
  status: string;
  message?: string;
  // Other potential backend fields can be added here if known later
  [key: string]: unknown;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}
