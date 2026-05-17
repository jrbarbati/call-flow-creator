import {TableData} from "./tableData";

export interface Phone extends TableData {
  id: number;
  orgId: number;
  customerId: number;
  phoneSystemId: number;
  policyTemplateId: number;
  groupId: number;
  dateAdded: number;
  dateRemoved: number | null;
  model: string;
  firmwareVersion: string;
  name: string;
  ip: string;
  macAddress: string;
  extensionNum: string;
  active: boolean;
  firmwareUnsupported: boolean;
  connected: boolean;
  lastSeenOnline: number | null;
  localSipPort: number | null;
  localAudioPortStart: number | null;
  localAudioPortEnd: number | null;
  sbcName: string | null;
  sbcReady: boolean | null;
  remoteFqdn: string | null;
  transferType: string;
  phoneLogo: string;
  language: string;
  timeZone: string;
  dateFormat: string;
  timeFormat: string;
  powerLed: string;
  backlightTimeout: string;
  screensaverTimeout: string;
  lldp: boolean;
  defaultRingTone: string;
  queueRingTone: string;
  codecs: string[];
  enableVlanWan: boolean;
  vlanWanId: number;
  vlanWanPriority: number;
  enableVlanPc: boolean;
  vlanPcId: number;
  vlanPcPriority: number;
  provisioningMethod: string;
  threecxId: number;
  supported: boolean;

  // NON API
  phoneSystemName: string;
  customerName: string;
  departmentName: string;
  connectedStatus: string;
  supportedStatus: string;
  attachedPhones: Phone[];
  tcxSbc: RouterPhone | null;
  loadingDependencies: boolean;
}

// Needs to look like the TcxPhone, not the Phone ^ above.
export interface PhoneWriteRequest {
  id: number;
  orgId: number;
  customerId: number;
  phoneSystemId: number;
  model: string;
  macAddress: string;
  extensionNumber: string;
  tcxId: number;
  templateName: string;
  sbc: boolean;
  sbcName: string;
  networkInterface: string;
  language: string;
  timeZone: string;
  dateFormat: string;
  timeFormat: string;
  transferType: string;
  powerLed: string;
  backlight: string;
  screensaver: string;
  provisioningMethod: string;
  lldp: boolean;
  defaultRingTone: string;
  queueRingTone: string;
  codecs: string[];
  enableVlanWan: boolean;
  vlanWanId: number;
  vlanWanPriority: number;
  enableVlanPc: boolean;
  vlanPcId: number;
  vlanPcPriority: number;
}

export interface RouterPhone {
  name: string;
  displayName: string;
  password: string;
  group: string;
  hasConnection: boolean
  localIpAddress: string;
  publicIpAddress: string;
  phoneMacAddress: string;
  phoneUserId: number;
  provisionLink: string;
  up: boolean;
  elapsedTime: string;
  registeredPhones: number;
  calls: number;
  latency: number;
  cpuUsage: string;
  memoryUsage: string;
  diskUsage: string;
}

export interface TcxPhoneTemplate {
  AllowedNetConfigs: string[];
  AllowSSLProvisioning: boolean;
  BacklightTimeouts: string[];
  Codecs: string[];
  Content: string;
  DateFormats: string[]
  DefaultQueueRingTone: string;
  HotdeskingAllowed: boolean;
  Id: string;
  IsCustom: boolean;
  Languages: string[]
  MaxQueueCustomRingtones: number;
  Models: TcxPhoneTemplateModel[];
  PowerLedSettings: string[];
  QueueRingTones: string[];
  RingTones: string[];
  RpsEnabled: boolean;
  ScreenSaverTimeouts: string[];
  TemplateType: string;
  TimeFormats: string[];
  TimeZones: string[];
  URL: string;
  XferTypeEnabled: boolean;
}

export interface TcxPhoneTemplateModel {
  AddAllowed: boolean;
  Name: string;
  UserAgent: string;
  CanBeSBC: boolean;

  templateName: string;
}
