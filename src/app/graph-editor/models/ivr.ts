import {PhoneSystem} from "./phoneSystem";
import {DestinationTrigger} from "./ringGroup";

export interface Ivr {
  id: number;
  orgId: number;
  customerId: number;
  phoneSystemId: number;
  tcxId: number;
  registered: boolean;
  timeout: number | null;
  timeoutDestination: string | null;
  timeoutForwardType: string | null;
  invalidKeyDestination: string | null;
  transferEnabled: boolean | null;
  type: string;
  name: string;
  extensionNumber: string;
  departmentId: number | null;
  departmentName: string | null;
  promptSet: string;
  promptFilename: string;
  assignedDids: string[];
  forwards: IvrForward[];
  destinations: IvrDestination[];
  createdTimestamp: number;
  updatedTimestamp: number;
  removedTimestamp: number | null;

  destinationOfficeClosed: IvrDestination;
  destinationBreak: IvrDestination;
  destinationHoliday: IvrDestination;

  phoneSystem: PhoneSystem | undefined;
  phoneSystemName: string;
  customerName: string;
}

export interface IvrForward {
  id: number | null;
  ivrId: number | null;
  type: string;
  input: string;
  peerType: string | null;
  destination: string | null;
  tcxId: number | null;
  customData: string | null;
}

export interface IvrDestination {
  id: number | null;
  ivrId: number | null;
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
