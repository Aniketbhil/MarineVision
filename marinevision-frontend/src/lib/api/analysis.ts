import { fetchApi } from "./client";
import { AnalyzeRequest, AnalyzeResponse, ScanReport } from "@/types/analysis";

export async function analyzeSonarImage(request: AnalyzeRequest): Promise<AnalyzeResponse> {
  const formData = new FormData();
  formData.append("file", request.file);

  if (request.coordinates?.latitude !== undefined) {
    formData.append("latitude", request.coordinates.latitude.toString());
  }

  if (request.coordinates?.longitude !== undefined) {
    formData.append("longitude", request.coordinates.longitude.toString());
  }

  return fetchApi<AnalyzeResponse>("/api/analyze", {
    method: "POST",
    body: formData,
  });
}

export async function getScanReport(scanId: string): Promise<ScanReport> {
  return fetchApi<ScanReport>(`/api/report/${scanId}?format=json`, {
    method: "GET",
  });
}
