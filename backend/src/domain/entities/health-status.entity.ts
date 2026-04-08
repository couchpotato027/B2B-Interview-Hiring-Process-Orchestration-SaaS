export interface HealthStatus {
  service: string;
  status: 'ok';
  timestamp: string;
  uptime: number;
  environment: string;
}
