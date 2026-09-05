import { ApiError } from "@/types/analysis";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      let errorMessage = "An error occurred while calling the API.";
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        // Fallback if response is not JSON
        errorMessage = await response.text() || response.statusText;
      }
      throw new ApiError(response.status, errorMessage);
    }
    
    // Attempt to parse JSON, if it fails, just return empty or throw
    const data = await response.json();
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Handle network errors (e.g. backend unreachable)
    throw new Error(error instanceof Error ? error.message : "Network error or backend unavailable.");
  }
}
