export interface TcxDidNumber {
  number: string;
  displayName: string;
  trunkId: number | null;
  templateFileName: string | null;
  routingRuleId: number | null;
  routingRuleName: string | null;
  routingRuleCallType: string | null;
  routingRuleCondition: string | null;
  routingRuleCustomData: string | null;
  alterDestinationDuringOutOfOfficeHours: boolean | null;
  alterDestinationDuringHolidays: boolean | null;
  hoursType: string | null;
  ignoreHolidays: boolean | null;
  officeHoursDestination: TcxDestination | null;
  outOfOfficeHoursDestination: TcxDestination | null;
  holidaysDestination: TcxDestination | null;
}

export interface TcxDestination {
  to: string | null;
  external: string | null;
  extensionNum: string | null;
  name: string | null;
}
