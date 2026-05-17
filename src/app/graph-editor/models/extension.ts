import {TableData} from "./tableData";
import {Phone} from "./phone";

export interface Extension extends TableData {
  id: number;
  orgId: number;
  customerId: number;
  phoneSystemId: number;
  policyTemplateId: number;
  groupId: number;
  dateAdded: number;
  dateRemoved: number | null;
  num: string;
  firstName: string;
  lastName: string;
  email: string | null;
  outboundCallerId: string | null;
  currentProfile: string | null;
  threecxId: number;
  shouldBeVoicemailOnly: boolean;
  voicemailOnly: boolean;
  shouldBeForwardOnly: boolean;
  forwardOnly: boolean;
  callRecordingOption: string;
  allowOwnRecording: boolean;
  voicemailSetupOption: string;
  sendEmailOnMissedCall: boolean;
  mainDepartmentId: number;
  mainDepartmentName: string;
  mainDepartmentRole: string;
  mobile: string;
  webMeetingApproveParticipants: boolean;
  defaultOfficeHours: boolean;
  specificOfficeHours: boolean;
  autoSwitchStatusDuringOfficeHours: boolean;
  disableOutboundCallsOutsideOfficeHours: boolean;
  voicemailEnabled: boolean;
  voicemailDisablePinAuth: boolean;
  voicemailPlayCallerId: boolean;
  voicemailPin: string;
  voicemailPlayMessageDateTime: string;
  showCallRecording: boolean;
  allowDeletionOfRecordings: boolean;
  callRecordingNotification: boolean;
  transcriptionMode: string;
  disableExternalCalls: boolean;
  disableExtension: boolean;
  hideCallForwardingRules: boolean;
  enablePinProtect: boolean;
  pinProtectTimeout: number;
  hideUser: boolean;
  screenCalls: boolean;
  srtpMode: string;
  pbxDeliversAudio: boolean;
  registered: boolean;
  active: boolean;

  // NON API
  phoneSystemName: string;
  customerName: string;
  allowOwnRecordingStatus: string;
  phones: Phone[];
}

export interface ExtensionWriteRequest {
  id: number;
  orgId: number;
  customerId: number;
  phoneSystemId: number;
  firstName: string;
  lastName: string;
  email: string;
  number: string;
  voicemailOnly: boolean;
  forwardOnly: boolean;
  voicemailEmailOption: string;
  callRecordingOption: string;
  allowOwnRecordings: boolean;
  sendEmailOnMissedCall: boolean;
  resetPasswordUponCreation: boolean;
  mainDepartmentId: number;
  outboundCallerId: string;
  mobile: string;
  webMeetingApproveParticipants: boolean;
  officeHoursProps: string[];
  voicemailEnabled: boolean;
  voicemailDisablePinAuth: boolean;
  voicemailPlayCallerId: boolean;
  voicemailPin: string;
  voicemailPlayMessageDateTime: string;
  showCallRecording: boolean;
  allowDeletionOfRecordings: boolean;
  callRecordingNotification: boolean;
  transcriptionMode: string;
  disableExternalCalls: boolean;
  disableExtension: boolean;
  hideCallForwardingRules: boolean;
  enablePinProtect: boolean;
  pinProtectTimeout: number;
  hideUser: boolean;
  screenCalls: boolean;
  srtpMode: string;
  pbxDeliversAudio: boolean;
  groups: ExtensionDepartment[];
  tcxId: number;
}

export interface ExtensionDepartment {
  GroupId: number;
  Rights: ExtensionDepartmentRights;
}

export interface ExtensionDepartmentRights {
  RoleName: string;
  AllowToManageCompanyBook: boolean;
  AllowToChangePresence: boolean;
  CanSeeGroupMembers: boolean;
  CanSeeGroupCalls: boolean;
  ShowMyPresence: boolean;
  ShowMyPresenceOutside: boolean;
  ShowMyCalls: boolean;
  PerformOperations: boolean;
  CanBargeIn: boolean;
  CanIntercom: boolean;
  AllowParking: boolean;
  AllowIVR: boolean;
  AssignClearOperations: boolean;
  CanSeeGroupRecordings: boolean;
}

export interface TcxDepartment {
  Id: number;
  Name: string;
  IsDefault: boolean;
  HasMembers: boolean;
  Rights: ExtensionDepartmentRights[];
}

export interface StandardizeDialogData {
  extensions: Extension[];
}
