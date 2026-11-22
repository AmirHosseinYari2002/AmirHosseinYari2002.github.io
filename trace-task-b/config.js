// TRACE · Task B — site configuration.
// 1. apiUrl: the Google Apps Script web-app URL (ends in /exec) of the Task B backend (backend/Code.gs).
//    Leave empty to run in local-only mode (work is kept in the browser and can be downloaded).
// 2. contactEmail: shown to annotators for questions.
// 3. taskAApiUrl: the Task A backend. Task B admits the annotators registered there (checked by backend/Code.gs);
//    the researcher page uses this URL, with the Task A admin key, to list them.
window.TASK_CONFIG = {
  apiUrl: 'https://script.google.com/macros/s/AKfycbx5PXplmiTTHs2PgQqdOxnfOpdElCEkbfKcIenI4hZ4FN84nnOnebMNCFFanxyq6qg/exec',
  contactEmail: 'ahyari2002@gmail.com',
  taskAApiUrl: 'https://script.google.com/macros/s/AKfycbxG1XYCkBJiVEaqBVO6yJTsIJKb7vM42wdbbHI0ze5jpELj05q_Ui6trWxgf_erqk3myw/exec'
};
