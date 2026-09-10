import React from 'react';
import { SonarReportPage } from '@/components/analysis/SonarReportPage';

export default async function ReportPage(props: { params: Promise<{ scan_id: string }> }) {
  const params = await props.params;
  return <SonarReportPage scanId={params.scan_id} />;
}
