import {PhoneSystem} from "./phoneSystem";
import {DestinationTrigger} from "./ringGroup";

export interface CallQueue {
  id: number;
  orgId: number;
  customerId: number;
  phoneSystemId: number;
  tcxId: number;
  registered: boolean;
  name: string;
  extensionNumber: string;
  departmentId: number;
  departmentName: string;
  pollingStrategy: string;
  maxQueueWaitTime: number;
  ringTimeout: number;
  assignedDids: string[];
  agents: CallQueueAgent[];
  destinations: CallQueueDestination[];
  createdTimestamp: number;
  updatedTimestamp: number;
  removedTimestamp: number | null;

  destinationNoAnswer: CallQueueDestination;
  destinationOfficeClosed: CallQueueDestination;
  destinationBreak: CallQueueDestination;
  destinationHoliday: CallQueueDestination;

  // NON API — UI-only enrichment
  phoneSystem: PhoneSystem | undefined;
  phoneSystemName: string;
  customerName: string;
}

export interface CallQueueAgent {
  id: number | null;
  callQueueId: number | null;
  tcxId: number | null;
  name: string;
  extensionNumber: string;
  skillGroup: string;
}

export interface CallQueueDestination {
  id: number | null;
  callQueueId: number | null;
  trigger: DestinationTrigger;
  name: string | null;
  targetType: string | null;
  extensionNumber: string | null;
  toValue: string | null;
  external: string | null;
  prompt: string | null;
  promptEnabled: boolean;
  createdTimestamp: number;
  updatedTimestamp: number;
  removedTimestamp: number | null;
}
