import { fetchApi } from "./client";
import { AnalyzeRequest, AnalyzeResponse } from "@/types/analysis";

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
