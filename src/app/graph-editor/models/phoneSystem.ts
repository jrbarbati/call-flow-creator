import {Phone} from "./phone";
import {Extension} from "./extension";
import {TableData} from "./tableData";

export interface PhoneSystem extends TableData {
  id: number;
  customerId: number;
  orgId: number;
  policyTemplateId: number;
  groupId: number;
  description: string | null;
  threecxApiUrl: string;
  threecxApiUsername: string;
  threecxApiPassword: string;
  policyCheckStatus: string | null;
  policyCheckTimestamp: number | null;
  policyCheckMessage: string | null;
  active: boolean;
  inactivatedTimestamp: number | null;
  policy: string;
  voiceMailToTextEnabled: boolean;
  minimumBilledExtensions: number;
  majorVersion: number;
  threecxBackupFolderName: string | null;
  shouldAutoApplyPolicy: boolean;
  simCalls: number | null;
  msTeamsEnabled: boolean | null;
  phones: Phone[];
  extensions: Extension[];

  // Non API variables
  customerName: string;
  policyCount: number;
  policyIds: number[];
  hasConflicts: boolean;
  isSystemStatusStale: boolean;
}

export interface PhoneSystemConnectionTest {
  url: string;
  username: string;
  password: string;
}

export interface PhoneSystemBackup {
  name: string;
  includeRecordings: boolean;
  disableCompression: boolean;
  encryptBackup: boolean;
  encryptionPassword: string | null;
}
