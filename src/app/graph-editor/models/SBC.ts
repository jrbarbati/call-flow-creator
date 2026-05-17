import {PhoneSystem} from "./phoneSystem";

export interface SBC {
  id: number;
  orgId: number;
  customerId: number;
  phoneSystemId: number;
  name: string;
  displayName: string;
  localIpAddress: string | null;
  departmentName: string | null;
  hasConnection: boolean;
  password: string | null;
  phoneMacAddress: string;
  tcxExtensionId: number;
  provisionLink: string;
  publicIpAddress: string | null;
  up: boolean | null;
  elapsedTime: string | null;
  registeredPhones: number | null;
  calls: number | null;
  latency: number | null;
  cpuUsage: string | null;
  memoryUsage: string | null;
  diskUsage: string | null;
  createdTimestamp: number;
  updatedTimestamp: number;
  removedTimestamp: number | null;

  phoneSystem: PhoneSystem | undefined;
  phoneSystemName: string;
  customerName: string;
}
