import { navigateTo } from '../lib/router.js';

export function renderInterviewSetup(container) {
  container.innerHTML = `
    <div class="screen interview-setup-screen">
      <div class="section-header">
        <h1 class="h1">Interview Prep</h1>
      </div>
      <p class="subtitle" style="margin-bottom: 24px;">Choose how you want to practice. Drills give you curated questions by field and level. Custom mode lets you paste a specific job description.</p>

      <!-- Drill Mode CTA -->
      <div class="card card-interactive" id="drill-mode-card" style="margin-bottom: 20px; background: linear-gradient(135deg, rgba(255, 183, 77, 0.1), rgba(255, 107, 53, 0.06)); border: 1px solid rgba(255, 183, 77, 0.15);">
        <div class="workout-card">
          <div class="workout-card-icon" style="background: var(--accent-dim); font-size: 1.6rem;">
            🎯
          </div>
          <div class="workout-card-info">
            <div class="workout-card-name">Interview Drills</div>
            <div class="workout-card-meta">
              Curated questions by field, level & round type
            </div>
          </div>
          <div class="workout-card-arrow">›</div>
        </div>
      </div>

      <!-- Divider -->
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
        <div style="flex: 1; height: 1px; background: rgba(255,255,255,0.06);"></div>
        <span class="label">or paste a job description</span>
        <div style="flex: 1; height: 1px; background: rgba(255,255,255,0.06);"></div>
      </div>

      <!-- Custom JD Mode -->
      <div class="card" style="margin-bottom: 20px;">
        <label class="label" style="display: block; margin-bottom: 12px;">Job Description</label>
        <textarea id="interview-jd" class="form-input" rows="6" placeholder="e.g. Seeking a Senior React Developer with 5+ years experience in performance optimization..."></textarea>
      </div>

      <div class="card" style="margin-bottom: 24px;">
        <label class="label" style="display: block; margin-bottom: 12px;">Company Context / Notes</label>
        <textarea id="interview-company" class="form-input" rows="4" placeholder="e.g. Stripe. Core values: Users First, Move with Urgency..."></textarea>
      </div>

      <button class="btn btn-primary btn-block btn-lg" id="start-interview-btn">
        Start Custom Interview →
      </button>
    </div>
  `;

  // Drill mode navigation
  document.getElementById('drill-mode-card').addEventListener('click', () => {
    navigateTo('interview-drill');
  });

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
