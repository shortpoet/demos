import type { Commit } from "git-last-commit";

export type HealthCheck = {
  status: string;
  version: string;
  uptime: string;
  env: string;
  timestamp: Date;
  gitInfo: Commit;
};
