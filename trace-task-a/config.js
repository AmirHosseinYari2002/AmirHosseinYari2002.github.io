// TRACE · Task A — site configuration.
// apiUrl:       the Google Apps Script web-app URL (ends in /exec) of backend/Code.gs.
//               Leave empty to run in local-only mode (work is kept in the browser only).
// contactEmail: shown to annotators for questions.
// datasetId:    fixed ID under which every annotation of the study is stored. Keep it unchanged when
//               windows of a later model are appended (notebook cell A5), so no saved work is lost.
//               Remove it only for a throw-away dry run.
// dryRun:       true shows a "Test data" banner to everyone.
window.TASK_CONFIG = {
  apiUrl: 'https://script.google.com/macros/s/AKfycbxG1XYCkBJiVEaqBVO6yJTsIJKb7vM42wdbbHI0ze5jpELj05q_Ui6trWxgf_erqk3myw/exec',
  contactEmail: 'ahyari2002@gmail.com',
  datasetId: 'taskA-study-1',
  dryRun: false
};
