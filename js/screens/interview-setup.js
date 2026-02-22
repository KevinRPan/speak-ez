import { navigateTo } from '../lib/router.js';

export function renderInterviewSetup(container) {
  container.innerHTML = `
    <div class="screen interview-setup-screen">
      <div class="section-header">
        <h1 class="h1">Interview Setup</h1>
      </div>
      <p class="subtitle" style="margin-bottom: 24px;">Provide context for the AI interviewer. The more specific, the better the questions.</p>

      <div class="card" style="margin-bottom: 20px;">
        <label class="label" style="display: block; margin-bottom: 12px;">Job Description</label>
        <textarea id="interview-jd" class="form-input" rows="6" placeholder="e.g. Seeking a Senior React Developer with 5+ years experience in performance optimization..."></textarea>
      </div>

      <div class="card" style="margin-bottom: 24px;">
        <label class="label" style="display: block; margin-bottom: 12px;">Company Context / Notes</label>
        <textarea id="interview-company" class="form-input" rows="4" placeholder="e.g. Stripe. Core values: Users First, Move with Urgency..."></textarea>
      </div>

      <button class="btn btn-primary btn-block btn-lg" id="start-interview-btn">
        Start Interview →
      </button>
    </div>
  `;

  const startBtn = document.getElementById('start-interview-btn');
  const jdInput = document.getElementById('interview-jd');
  const companyInput = document.getElementById('interview-company');

  startBtn.addEventListener('click', () => {
    const jobDescription = jdInput.value.trim();
    const companyContext = companyInput.value.trim();

    if (!jobDescription) {
      alert('Please provide a job description.');
      return;
    }

    // Save to localStorage so they don't have to re-type it every time
    localStorage.setItem('speak_ez_last_jd', jobDescription);
    localStorage.setItem('speak_ez_last_company', companyContext);

    navigateTo('interview-practice', {
      jobDescription,
      companyContext
    });
  });

  // Pre-fill if exists
  const lastJd = localStorage.getItem('speak_ez_last_jd');
  const lastCompany = localStorage.getItem('speak_ez_last_company');
  if (lastJd) jdInput.value = lastJd;
  if (lastCompany) companyInput.value = lastCompany;
}
