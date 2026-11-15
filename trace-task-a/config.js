// TRACE · Task A — site configuration.
// apiUrl:       the Google Apps Script web-app URL (ends in /exec) of backend/Code.gs.
//               Leave empty to run in local-only mode (work is kept in the browser only).
// contactEmail: shown to annotators for questions.
// dryRun:       true shows a "Test data" banner to everyone. Set it to false once data/ holds the
//               final TaskA/platform files from Part A (all six models).
window.TASK_CONFIG = {
  apiUrl: 'https://script.google.com/macros/s/AKfycbxG1XYCkBJiVEaqBVO6yJTsIJKb7vM42wdbbHI0ze5jpELj05q_Ui6trWxgf_erqk3myw/exec',
  contactEmail: 'ahyari2002@gmail.com',
  dryRun: true,
  datasetLabel: 'Dry-run sample (4 of 6 models). Annotations made now are for testing only and will not be used.'
};
