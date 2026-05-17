import {PhoneSystem} from "./phoneSystem";
import {DestinationTrigger} from "./ringGroup";

export interface SipTrunk {
  id: number;
  orgId: number;
  customerId: number;
  phoneSystemId: number;
  tcxId: number;
  name: string;
  isOnline: boolean;
  host: string;
  port: number;
  proxyHost: string | null;
  proxyPort: number | null;
  number: string;
  authId: string;
  authPassword: string;
  direction: string;
  externalNumber: string;
  outboundCallerId: string;
  useSeparateAuthId: boolean;
  separateAuthId: string;
  secondaryRegistrar: string;
  publicIpInSip: string;
  e164ProcessIncomingNumber: boolean;
  diversionHeader: boolean;
  e164CountryCode: string;
  enableInboundCalls: boolean;
  enableOutboundCalls: boolean;
  ipRestriction: string;
  transportRestriction: string;
  publishInfo: boolean;
  publicInfoGroups: string[];
  receiveInfo: boolean;
  remotePbxPrefix: string;
  tunnelEnabled: boolean;
  tunnelRemoteAddr: string;
  tunnelRemotePort: number;
  tags: string[];
  disableVideo: boolean;
  certificateName: string;
  webMeetingBridge: boolean;
  codecs: string[];
  didNumbers: string[];
  simCalls: number;
  smsEnabled: boolean;
  smsWebhook: string;
  smsProvider: string;
  smsNumberLengthEnabled: boolean;
  smsAuthUser: string;
  smsAuthPassword: string;
  smsAppId: string;
  smsAccountId: string;
  destinations: SipTrunkDestination[];
  createdTimestamp: number;
  updatedTimestamp: number;
  removedTimestamp: number | null;
  inactivatedTimestamp: number | null;

  defaultRoute: SipTrunkDestination;

  phoneSystem: PhoneSystem | undefined;
  phoneSystemName: string;
  customerName: string;
}

export interface SipTrunkDestination {
  id: number | null;
  sipTrunkId: number | null;
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
