/**
 * Used for objects that are represented as rows in a table
 * selected -> boolean whether or not a row is selected via the 'select' column
 * selectDisable -> a boolean to control if a row is selectable or not
 */
export interface TableData {
  selected: boolean;
  selectDisabled: boolean;
  progressSpinner: boolean;
}
