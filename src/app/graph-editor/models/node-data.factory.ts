import { NodeType } from './node-types';
import { NodeData } from './node-data';
import { DestinationTrigger, RingGroup, RingGroupDestination } from './ringGroup';
import { CallQueue, CallQueueDestination } from './callQueue';
import { Ivr, IvrDestination } from './ivr';
import { DidNumber, DidNumberDestination } from './didNumber';
import { Extension } from './extension';
import { SipTrunk, SipTrunkDestination } from './sipTrunk';
import { Voicemail } from './voicemail';
import { CallProcessingScript } from './callProcessingScript';
import { ExternalNumber } from './externalNumber';
import { Terminal, TerminalKind } from './terminal';

export interface NodeDataSeed {
  label?: string;
  extensionNumber?: string;
  firstName?: string;
  lastName?: string;
  callProcessingScriptName?: string;
  externalNumber?: string;
  externalLabel?: string;
  voicemailName?: string;
  sourceLinkKey?: string;
}

export function createDefaultNodeData(type: NodeType, seed?: NodeDataSeed): NodeData {
  const now = Date.now();
  switch (type) {
    case 'ring-group':      return buildRingGroup(now, seed);
    case 'call-queue':      return buildCallQueue(now, seed);
    case 'ivr':             return buildIvr(now, seed);
    case 'did':             return buildDid(now, seed);
    case 'extension':       return buildExtension(now, seed);
    case 'sip-trunk':       return buildSipTrunk(now, seed);
    case 'voicemail':       return buildVoicemail(seed);
    case 'call-processing-script': return buildCallProcessingScript(seed);
    case 'external-number': return buildExternal(seed);
    case 'accept-anyway':   return buildTerminal('accept-anyway', seed);
    case 'end-call':        return buildTerminal('end-call', seed);
  }
}

function emptyRingGroupDestination(trigger: DestinationTrigger, now: number): RingGroupDestination {
  return {
    id: null, ringGroupId: null, trigger,
    name: null, targetType: null, extensionNumber: null,
    toValue: 'None', external: null, prompt: null, promptEnabled: false,
    createdTimestamp: now, updatedTimestamp: now, removedTimestamp: null,
  } as RingGroupDestination;
}

function emptyCallQueueDestination(trigger: DestinationTrigger, now: number): CallQueueDestination {
  return {
    id: null, callQueueId: null, trigger,
    name: null, targetType: null, extensionNumber: null,
    toValue: 'None', external: null, prompt: null, promptEnabled: false,
    createdTimestamp: now, updatedTimestamp: now, removedTimestamp: null,
  } as CallQueueDestination;
}

function emptyIvrDestination(trigger: DestinationTrigger, now: number): IvrDestination {
  return {
    id: null, ivrId: null, trigger,
    name: null, targetType: null, extensionNumber: null,
    toValue: 'None', external: null, prompt: null, promptEnabled: false,
    createdTimestamp: now, updatedTimestamp: now, removedTimestamp: null,
  } as IvrDestination;
}

function emptyDidDestination(trigger: DestinationTrigger, now: number): DidNumberDestination {
  return {
    id: null, didNumberId: null, trigger,
    name: null, targetType: null, extensionNumber: null,
    toValue: 'None', external: null, prompt: null, promptEnabled: false,
    createdTimestamp: now, updatedTimestamp: now, removedTimestamp: null,
  } as DidNumberDestination;
}

function emptySipTrunkDestination(trigger: DestinationTrigger, now: number): SipTrunkDestination {
  return {
    id: null, sipTrunkId: null, trigger,
    name: null, targetType: null, extensionNumber: null,
    toValue: 'None', external: null, prompt: null, promptEnabled: false,
    createdTimestamp: now, updatedTimestamp: now, removedTimestamp: null,
  } as SipTrunkDestination;
}

function buildRingGroup(now: number, s?: NodeDataSeed): RingGroup {
  const noAnswer = emptyRingGroupDestination(DestinationTrigger.NO_ANSWER, now);
  const officeClosed = emptyRingGroupDestination(DestinationTrigger.OFFICE_CLOSED, now);
  const brk = emptyRingGroupDestination(DestinationTrigger.BREAK, now);
  const holiday = emptyRingGroupDestination(DestinationTrigger.HOLIDAY, now);
  return {
    id: 0, orgId: 0, customerId: 0, phoneSystemId: 0, tcxId: 0,
    registered: false,
    name: s?.label ?? '',
    extensionNumber: s?.extensionNumber ?? '',
    departmentId: 0,
    departmentName: '',
    ringStrategy: 'prioritized',
    ringTime: 20,
    voicemailGreeting: '',
    voicemailEmailDelivery: '',
    voicemailEmailList: '',
    multicastIpAddress: null,
    multicastCodec: null,
    multicastPort: null,
    multicastPacketTime: null,
    assignedDids: [],
    members: [],
    destinations: [noAnswer, officeClosed, brk, holiday],
    createdTimestamp: now,
    updatedTimestamp: now,
    removedTimestamp: null,
    destinationNoAnswer: noAnswer,
    destinationOfficeClosed: officeClosed,
    destinationBreak: brk,
    destinationHoliday: holiday,
    phoneSystem: undefined,
    phoneSystemName: '',
    customerName: '',
  } as RingGroup;
}

function buildCallQueue(now: number, s?: NodeDataSeed): CallQueue {
  const noAnswer = emptyCallQueueDestination(DestinationTrigger.NO_ANSWER, now);
  const officeClosed = emptyCallQueueDestination(DestinationTrigger.OFFICE_CLOSED, now);
  const brk = emptyCallQueueDestination(DestinationTrigger.BREAK, now);
  const holiday = emptyCallQueueDestination(DestinationTrigger.HOLIDAY, now);
  return {
    id: 0, orgId: 0, customerId: 0, phoneSystemId: 0, tcxId: 0,
    registered: false,
    name: s?.label ?? '',
    extensionNumber: s?.extensionNumber ?? '',
    departmentId: 0,
    departmentName: '',
    pollingStrategy: 'hunt',
    maxQueueWaitTime: 300,
    ringTimeout: 20,
    assignedDids: [],
    agents: [],
    destinations: [noAnswer, officeClosed, brk, holiday],
    createdTimestamp: now,
    updatedTimestamp: now,
    removedTimestamp: null,
    destinationNoAnswer: noAnswer,
    destinationOfficeClosed: officeClosed,
    destinationBreak: brk,
    destinationHoliday: holiday,
    phoneSystem: undefined,
    phoneSystemName: '',
    customerName: '',
  } as CallQueue;
}

function buildIvr(now: number, s?: NodeDataSeed): Ivr {
  const officeClosed = emptyIvrDestination(DestinationTrigger.OFFICE_CLOSED, now);
  const brk = emptyIvrDestination(DestinationTrigger.BREAK, now);
  const holiday = emptyIvrDestination(DestinationTrigger.HOLIDAY, now);
  return {
    id: 0, orgId: 0, customerId: 0, phoneSystemId: 0, tcxId: 0,
    registered: false,
    timeout: 10,
    timeoutDestination: null,
    timeoutForwardType: null,
    invalidKeyDestination: null,
    transferEnabled: null,
    type: 'standard',
    name: s?.label ?? '',
    extensionNumber: s?.extensionNumber ?? '',
    departmentId: null,
    departmentName: null,
    promptSet: '',
    promptFilename: '',
    assignedDids: [],
    forwards: [],
    destinations: [officeClosed, brk, holiday],
    createdTimestamp: now,
    updatedTimestamp: now,
    removedTimestamp: null,
    destinationOfficeClosed: officeClosed,
    destinationBreak: brk,
    destinationHoliday: holiday,
    phoneSystem: undefined,
    phoneSystemName: '',
    customerName: '',
  } as Ivr;
}

function buildDid(now: number, s?: NodeDataSeed): DidNumber {
  const officeHours = emptyDidDestination(DestinationTrigger.DEFAULT_ROUTE, now);
  const officeClosed = emptyDidDestination(DestinationTrigger.OFFICE_CLOSED, now);
  const holiday = emptyDidDestination(DestinationTrigger.HOLIDAY, now);
  return {
    id: 0, orgId: 0, customerId: 0, phoneSystemId: 0,
    number: s?.label ?? '',
    displayName: '',
    tcxTrunkId: 0,
    currentHours: null,
    destinationOfficeHours: officeHours,
    destinationOfficeClosed: officeClosed,
    destinationHoliday: holiday,
    createdTimestamp: now,
    updatedTimestamp: now,
    removedTimestamp: null,
    phoneSystemName: '',
    customerName: '',
    sipTrunk: undefined as unknown,
  } as unknown as DidNumber;
}

function buildExtension(now: number, s?: NodeDataSeed): Extension {
  return {
    id: 0, orgId: 0, customerId: 0, phoneSystemId: 0,
    policyTemplateId: 0, groupId: 0,
    dateAdded: now, dateRemoved: null,
    num: s?.extensionNumber ?? '',
    firstName: s?.firstName ?? '',
    lastName: s?.lastName ?? '',
    email: null,
    outboundCallerId: null,
    currentProfile: null,
    threecxId: 0,
    shouldBeVoicemailOnly: false, voicemailOnly: false,
    shouldBeForwardOnly: false, forwardOnly: false,
    callRecordingOption: '',
    allowOwnRecording: false,
    voicemailSetupOption: '',
    sendEmailOnMissedCall: false,
    mainDepartmentId: 0,
    mainDepartmentName: '',
    mainDepartmentRole: '',
    mobile: '',
    webMeetingApproveParticipants: false,
    defaultOfficeHours: true,
    specificOfficeHours: false,
    autoSwitchStatusDuringOfficeHours: false,
    disableOutboundCallsOutsideOfficeHours: false,
    voicemailEnabled: true,
    voicemailDisablePinAuth: false,
    voicemailPlayCallerId: false,
    voicemailPin: '',
    voicemailPlayMessageDateTime: '',
    showCallRecording: false,
    allowDeletionOfRecordings: false,
    callRecordingNotification: false,
    transcriptionMode: '',
    disableExternalCalls: false,
    disableExtension: false,
    hideCallForwardingRules: false,
    enablePinProtect: false,
    pinProtectTimeout: 0,
    hideUser: false,
    screenCalls: false,
    srtpMode: '',
    pbxDeliversAudio: false,
    registered: false,
    active: true,
    selected: false,
    selectDisabled: false,
    progressSpinner: false,
    phoneSystemName: '',
    customerName: '',
    allowOwnRecordingStatus: '',
    phones: [],
  } as Extension;
}

function buildSipTrunk(now: number, s?: NodeDataSeed): SipTrunk {
  const defaultRoute = emptySipTrunkDestination(DestinationTrigger.DEFAULT_ROUTE, now);
  return {
    id: 0, orgId: 0, customerId: 0, phoneSystemId: 0, tcxId: 0,
    name: s?.label ?? '',
    isOnline: false,
    host: '',
    port: 5060,
    proxyHost: null,
    proxyPort: null,
    number: '',
    authId: '',
    authPassword: '',
    direction: 'inbound',
    externalNumber: '',
    outboundCallerId: '',
    useSeparateAuthId: false,
    separateAuthId: '',
    secondaryRegistrar: '',
    publicIpInSip: '',
    e164ProcessIncomingNumber: false,
    diversionHeader: false,
    e164CountryCode: '',
    enableInboundCalls: true,
    enableOutboundCalls: true,
    ipRestriction: '',
    transportRestriction: '',
    publishInfo: false,
    publicInfoGroups: [],
    receiveInfo: false,
    remotePbxPrefix: '',
    tunnelEnabled: false,
    tunnelRemoteAddr: '',
    tunnelRemotePort: 0,
    tags: [],
    disableVideo: false,
    certificateName: '',
    webMeetingBridge: false,
    codecs: [],
    didNumbers: [],
    simCalls: 4,
    smsEnabled: false,
    smsWebhook: '',
    smsProvider: '',
    smsNumberLengthEnabled: false,
    smsAuthUser: '',
    smsAuthPassword: '',
    smsAppId: '',
    smsAccountId: '',
    destinations: [defaultRoute],
    createdTimestamp: now,
    updatedTimestamp: now,
    removedTimestamp: null,
    inactivatedTimestamp: null,
    defaultRoute,
    phoneSystem: undefined,
    phoneSystemName: '',
    customerName: '',
  } as SipTrunk;
}

function buildVoicemail(s?: NodeDataSeed): Voicemail {
  return {
    extensionNumber: s?.extensionNumber ?? '',
    name: s?.voicemailName ?? s?.label ?? `VM ${s?.extensionNumber ?? ''}`.trim(),
  };
}

function buildCallProcessingScript(s?: NodeDataSeed): CallProcessingScript {
  return {
    name: s?.callProcessingScriptName ?? s?.label ?? '',
    appId: null,
  };
}

function buildExternal(s?: NodeDataSeed): ExternalNumber {
  return {
    number: s?.externalNumber ?? s?.label ?? '',
    label: s?.externalLabel ?? null,
  };
}

function buildTerminal(kind: TerminalKind, s?: NodeDataSeed): Terminal {
  return {
    kind,
    sourceLinkKey: s?.sourceLinkKey ?? '',
  };
}
