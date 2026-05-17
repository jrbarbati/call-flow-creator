import { Type } from '@angular/core';
import { NodeType } from './node-types';
import { RingGroupEditComponent } from '../components/edit/ring-group-edit/ring-group-edit.component';
import { CallQueueEditComponent } from '../components/edit/call-queue-edit/call-queue-edit.component';
import { IvrEditComponent } from '../components/edit/ivr-edit/ivr-edit.component';
import { DidEditComponent } from '../components/edit/did-edit/did-edit.component';
import { ExtensionEditComponent } from '../components/edit/extension-edit/extension-edit.component';
import { SipTrunkEditComponent } from '../components/edit/sip-trunk-edit/sip-trunk-edit.component';
import { VoicemailEditComponent } from '../components/edit/voicemail-edit/voicemail-edit.component';
import { CallProcessingScriptEditComponent } from '../components/edit/call-processing-script-edit/call-processing-script-edit.component';
import { ExternalNumberEditComponent } from '../components/edit/external-number-edit/external-number-edit.component';

export const EDIT_COMPONENT_FOR_TYPE: Partial<Record<NodeType, Type<unknown>>> = {
  'ring-group':      RingGroupEditComponent,
  'call-queue':      CallQueueEditComponent,
  'ivr':             IvrEditComponent,
  'did':             DidEditComponent,
  'extension':       ExtensionEditComponent,
  'sip-trunk':       SipTrunkEditComponent,
  'voicemail':       VoicemailEditComponent,
  'call-processing-script': CallProcessingScriptEditComponent,
  'external-number': ExternalNumberEditComponent,
  // accept-anyway, end-call: no editor — they're terminal/derived
};
