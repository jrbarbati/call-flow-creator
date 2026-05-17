import {PhoneSystem} from "./phoneSystem";

export enum DestinationTrigger {
  NO_ANSWER = 'NO_ANSWER',
  OFFICE_CLOSED = 'OFFICE_CLOSED',
  BREAK = 'BREAK',
  HOLIDAY = 'HOLIDAY',
  DEFAULT_ROUTE = 'DEFAULT_ROUTE'
}

export interface RingGroup {
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
  ringStrategy: string;
  ringTime: number;
  voicemailGreeting: string;
  voicemailEmailDelivery: string;
  voicemailEmailList: string;
  multicastIpAddress: string | null;
  multicastCodec: string | null;
  multicastPort: number | null;
  multicastPacketTime: number | null;
  assignedDids: string[];
  members: RingGroupMember[];
  destinations: RingGroupDestination[];
  createdTimestamp: number;
  updatedTimestamp: number;
  removedTimestamp: number | null;

  destinationNoAnswer: RingGroupDestination;
  destinationOfficeClosed: RingGroupDestination;
  destinationBreak: RingGroupDestination;
  destinationHoliday: RingGroupDestination;

  // NON API — UI-only enrichment
  phoneSystem: PhoneSystem | undefined;
  phoneSystemName: string;
  customerName: string;
}

export interface RingGroupMember {
  id: number | null;
  ringGroupId: number | null;
  name: string;
  extensionNumber: string;
}

export interface RingGroupDestination {
  id: number | null;
  ringGroupId: number | null;
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

export interface FlatDestination {
  name: string | null;
  extensionNumber: string | null;
  targetType: string | null;
  toValue: string | null;
  external: string | null;
}

export function formatDestinationAsFlatString(destination: FlatDestination | undefined): string {
  if (!destination)
    return '-';

  if (destination.toValue === 'ProceedWithNoExceptions')
    return 'Accept Anyway'

  if (destination.toValue === 'None')
    return 'End Call'

  if (destination.toValue === 'External')
    return `External (${destination.external ?? ''})`;

  return `${destination.name ?? 'null'} (${destination.extensionNumber ?? ''} - ${destination.toValue ?? 'None'})`;
}
