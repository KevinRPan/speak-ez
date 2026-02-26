import { navigateTo } from '../lib/router.js';

export function renderInterviewSetup(container) {
  container.innerHTML = `
    <div class="screen interview-setup-screen">
      <div class="section-header">
        <h1 class="h1">Interview Prep</h1>
      </div>
      <p class="subtitle" style="margin-bottom: 24px;">Choose how you want to practice. Drills give you curated questions by field and level. Custom mode lets you paste a specific job description.</p>

      <div class="card" style="margin-bottom: 16px;">
        <label class="label" style="display: block; margin-bottom: 12px;">Interview Type</label>
        <select id="interview-type" class="form-input">
          <option value="recruiter-screen">Recruiter Screen</option>
          <option value="hiring-manager">Hiring Manager</option>
          <option value="behavioral">Behavioral</option>
          <option value="coding">Coding / Technical</option>
          <option value="system-design">System Design</option>
          <option value="final-onsite">Final Onsite</option>
        </select>
      </div>

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

      <!-- Upload Mode CTA -->
      <div class="card card-interactive" id="upload-mode-card" style="margin-bottom: 20px; background: linear-gradient(135deg, rgba(0, 180, 216, 0.12), rgba(9, 132, 227, 0.08)); border: 1px solid rgba(0, 180, 216, 0.2);">
        <div class="workout-card">
          <div class="workout-card-icon" style="background: var(--blue-dim); font-size: 1.5rem;">
            📹
          </div>
          <div class="workout-card-info">
            <div class="workout-card-name">Upload Recording</div>
            <div class="workout-card-meta">
              MP4/audio -> transcript -> interviewer-style feedback
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
        <label class="label" style="display: block; margin-bottom: 12px;">Job Notes / Company Context</label>
        <textarea id="interview-notes" class="form-input" rows="4" placeholder="e.g. Anthropic. Focus areas: model reliability, responsible AI, cross-functional leadership."></textarea>
      </div>

      <button class="btn btn-primary btn-block btn-lg" id="start-interview-btn">
        Start Custom Interview →
      </button>

      <button class="btn btn-secondary btn-block" id="view-upload-history-btn" style="margin-top: 10px;">
        View Upload History
      </button>
    </div>
  `;

  // Drill mode navigation
  document.getElementById('drill-mode-card').addEventListener('click', () => {
    navigateTo('interview-drill');
  });

  document.getElementById('upload-mode-card').addEventListener('click', () => {
    navigateTo('interview-upload');
  });

  document.getElementById('view-upload-history-btn').addEventListener('click', () => {
    navigateTo('interview-history');
  });

  const startBtn = document.getElementById('start-interview-btn');
  const interviewTypeInput = document.getElementById('interview-type');
  const jdInput = document.getElementById('interview-jd');
  const notesInput = document.getElementById('interview-notes');

  startBtn.addEventListener('click', () => {
    const interviewType = interviewTypeInput.value;
    const jobDescription = jdInput.value.trim();
    const jobNotes = notesInput.value.trim();

    if (!jobDescription) {
      alert('Please provide a job description.');
      return;
    }

    // Save to localStorage so they don't have to re-type it every time
    localStorage.setItem('speak_ez_last_interview_type', interviewType);
    localStorage.setItem('speak_ez_last_jd', jobDescription);
    localStorage.setItem('speak_ez_last_job_notes', jobNotes);

    navigateTo('interview-practice', {
      interviewType,
      jobDescription,
      jobNotes
    });
  });

  // Pre-fill if exists
  const lastInterviewType = localStorage.getItem('speak_ez_last_interview_type');
  const lastJd = localStorage.getItem('speak_ez_last_jd');
  const lastJobNotes = localStorage.getItem('speak_ez_last_job_notes');
  const legacyCompany = localStorage.getItem('speak_ez_last_company');
  if (lastInterviewType) interviewTypeInput.value = lastInterviewType;
  if (lastJd) jdInput.value = lastJd;
  if (lastJobNotes) notesInput.value = lastJobNotes;
  else if (legacyCompany) notesInput.value = legacyCompany;
}
