import {SipTrunk} from "./sipTrunk";
import {DestinationTrigger} from "./ringGroup";

export interface DidNumber {
  id: number;
  orgId: number;
  customerId: number;
  phoneSystemId: number;
  number: string;
  displayName: string;
  tcxTrunkId: number;
  currentHours: string | null;
  destinationOfficeHours: DidNumberDestination;
  destinationOfficeClosed: DidNumberDestination;
  destinationHoliday: DidNumberDestination;
  createdTimestamp: number;
  updatedTimestamp: number;
  removedTimestamp: number | null;

  phoneSystemName: string;
  customerName: string;
  sipTrunk: SipTrunk;
}

export interface DidNumberDestination {
  id: number | null;
  didNumberId: number | null;
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
