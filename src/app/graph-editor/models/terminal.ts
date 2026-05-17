export type TerminalKind = 'accept-anyway' | 'end-call';

export interface Terminal {
  kind: TerminalKind;
  // `${sourceNodeId}|${DestinationTrigger}` — identifies the destination slot that owns this terminal.
  sourceLinkKey: string;
}
