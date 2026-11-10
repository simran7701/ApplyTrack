import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import { applicationApi, authApi, clearToken, getToken, interviewApi, saveToken } from "./api";

const STATUSES = ["Applied", "Assessment", "Interview", "Selected", "Rejected"];
const JOB_TYPES = ["Full-time", "Part-time", "Internship", "Contract", "Other"];
const blankForm = () => ({
  companyName: "",
  jobRole: "",
  location: "",
  jobType: "Internship",
  applicationDate: localDateInput(),
  status: "Applied",
  jobDescription: "",
  jobLink: "",
  interviewDate: "",
  notes: ""
});

function localDateInput(date = new Date()) {
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return adjusted.toISOString().slice(0, 10);
}

function prettyDate(date) {
  if (!date) return "Not set";
  return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function AuthScreen({ onAuthenticated, notice }) {
  const [registering, setRegistering] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = registering ? await authApi.register(form) : await authApi.login(form);
      saveToken(result.token);
      onAuthenticated(result.user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <a className="brand auth-brand" href="/" aria-label="ApplyTrack home">
          <span className="brand-mark">A</span><span>ApplyTrack</span>
        </a>
        <div className="auth-copy">
          <p className="eyebrow">{registering ? "GET STARTED" : "WELCOME BACK"}</p>
          <h1>{registering ? "Create your account" : "Sign in to your workspace"}</h1>
          <p>Keep every opportunity organized and move your career forward.</p>
        </div>
        {(error || notice) && <div className="notice error-notice" role="alert">{error || notice}</div>}
        <form className="auth-form" onSubmit={submit}>
          {registering && (
            <label>
              Full name
              <input autoComplete="name" maxLength="80" minLength="2" name="name" onChange={(event) => setForm({ ...form, name: event.target.value })} required value={form.name} />
            </label>
          )}
          <label>
            Email address
            <input autoComplete="email" name="email" onChange={(event) => setForm({ ...form, email: event.target.value })} required type="email" value={form.email} />
          </label>
          <label>
            Password
            <input autoComplete={registering ? "new-password" : "current-password"} maxLength="72" minLength="8" name="password" onChange={(event) => setForm({ ...form, password: event.target.value })} required type="password" value={form.password} />
            {registering && <span className="input-hint">Use at least 8 characters.</span>}
          </label>
          <button className="button button-primary auth-submit" disabled={busy} type="submit">
            {busy ? "Please wait…" : registering ? "Create account" : "Sign in"}
          </button>
        </form>
        <p className="auth-switch">
          {registering ? "Already have an account?" : "New to ApplyTrack?"}
          <button className="text-button" onClick={() => { setRegistering(!registering); setError(""); }} type="button">
            {registering ? "Sign in" : "Create account"}
          </button>
        </p>
      </section>
      <aside className="auth-aside">
        <div className="aside-orbit orbit-one" /><div className="aside-orbit orbit-two" />
        <div className="aside-content">
          <span className="aside-label">YOUR NEXT CHAPTER STARTS HERE</span>
          <h2>Make your job search feel less like a job.</h2>
          <p>One calm place to track applications, prepare for interviews, and celebrate every win.</p>
          <div className="aside-mini-card"><span className="mini-check">✓</span><span><strong>Stay on top of it</strong><small>Every application, neatly organized.</small></span></div>
        </div>
      </aside>
    </main>
  );
}

function ApplicationForm({ form, setForm, editing, busy, error, onClose, onSubmit }) {
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section aria-labelledby="form-title" aria-modal="true" className="modal application-modal" role="dialog">
        <div className="modal-heading">
          <div><p className="eyebrow">{editing ? "KEEP IT UP TO DATE" : "A NEW OPPORTUNITY"}</p><h2 id="form-title">{editing ? "Edit application" : "Add application"}</h2></div>
          <button aria-label="Close dialog" className="icon-button" onClick={onClose} type="button">×</button>
        </div>
        <form className="application-form" onSubmit={onSubmit}>
          {error && <div className="notice error-notice" role="alert">{error}</div>}
          <div className="form-grid">
            <label>Company name <input autoFocus maxLength="120" name="companyName" onChange={update} required value={form.companyName} /></label>
            <label>Job role <input maxLength="120" name="jobRole" onChange={update} required value={form.jobRole} /></label>
            <label>Location <input maxLength="120" name="location" onChange={update} placeholder="e.g. Bengaluru / Remote" value={form.location} /></label>
            <label>Job type
              <select name="jobType" onChange={update} value={form.jobType}>
                {JOB_TYPES.map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>
            <label>Application date <input name="applicationDate" onChange={update} required type="date" value={form.applicationDate} /></label>
            <label>Status
              <select name="status" onChange={update} value={form.status}>
                {STATUSES.map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
            <label>Interview date <input name="interviewDate" onChange={update} type="date" value={form.interviewDate} /></label>
            <label>Job link <input maxLength="2048" name="jobLink" onChange={update} placeholder="https://" type="url" value={form.jobLink} /></label>
            <label className="full-width">Job description <textarea maxLength="5000" name="jobDescription" onChange={update} rows="3" value={form.jobDescription} /></label>
            <label className="full-width">Notes <textarea maxLength="5000" name="notes" onChange={update} placeholder="Add a reminder, contact, or follow-up…" rows="3" value={form.notes} /></label>
          </div>
          <div className="modal-actions">
            <button className="button button-quiet" onClick={onClose} type="button">Cancel</button>
            <button className="button button-primary" disabled={busy} type="submit">{busy ? "Saving…" : editing ? "Save changes" : "Add application"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ApplicationDetails({ application, onClose }) {
  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section aria-labelledby="details-title" aria-modal="true" className="modal details-modal" role="dialog">
        <div className="modal-heading">
          <div><p className="eyebrow">APPLICATION DETAILS</p><h2 id="details-title">{application.companyName}</h2></div>
          <button aria-label="Close dialog" className="icon-button" onClick={onClose} type="button">×</button>
        </div>
        <p className="details-role">{application.jobRole} · {application.location || "Location not specified"}</p>
        <span className={`status-badge ${application.status.toLowerCase()}`}>{application.status}</span>
        <dl className="details-list">
          <div><dt>Job type</dt><dd>{application.jobType}</dd></div>
          <div><dt>Applied on</dt><dd>{prettyDate(application.applicationDate)}</dd></div>
          <div><dt>Interview date</dt><dd>{prettyDate(application.interviewDate)}</dd></div>
          {application.jobDescription && <div className="detail-block"><dt>Job description</dt><dd>{application.jobDescription}</dd></div>}
          {application.notes && <div className="detail-block"><dt>Notes</dt><dd>{application.notes}</dd></div>}
        </dl>
        {application.jobLink && <a className="button button-secondary" href={application.jobLink} rel="noreferrer" target="_blank">Open job posting ↗</a>}
      </section>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(Boolean(getToken()));
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [details, setDetails] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [sortOrder, setSortOrder] = useState("newest");

  const loadWorkspaceData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [applicationData, interviewData] = await Promise.all([
        applicationApi.list(),
        interviewApi.list()
      ]);
      setApplications(applicationData);
      setInterviews(interviewData);
    } catch (requestError) {
      setError(requestError.message);
      if (requestError.status === 401) {
        clearToken();
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getToken()) return;
    let active = true;
    authApi.me().then(({ user: currentUser }) => {
      if (!active) return;
      setUser(currentUser);
      return loadWorkspaceData();
    }).catch((requestError) => {
      if (!active) return;
      if (requestError.status === 401) {
        clearToken();
        setError("Your session expired. Please sign in again.");
      } else {
        setError(requestError.message);
      }
    }).finally(() => {
      if (active) setInitializing(false);
    });
    return () => { active = false; };
  }, [loadWorkspaceData]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredApplications = useMemo(() => applications
    .filter((application) => `${application.companyName} ${application.jobRole}`.toLowerCase().includes(search.trim().toLowerCase()))
    .filter((application) => filterStatus === "All" || application.status === filterStatus)
    .filter((application) => filterType === "All" || application.jobType === filterType)
    .sort((first, second) => {
      const difference = new Date(first.applicationDate) - new Date(second.applicationDate);
      return sortOrder === "newest" ? -difference : difference;
    }), [applications, search, filterStatus, filterType, sortOrder]);

  const counts = useMemo(() => ({
    total: applications.length,
    Applied: applications.filter((app) => app.status === "Applied").length,
    Assessment: applications.filter((app) => app.status === "Assessment").length,
    Interview: applications.filter((app) => app.status === "Interview").length,
    Selected: applications.filter((app) => app.status === "Selected").length,
    Rejected: applications.filter((app) => app.status === "Rejected").length
  }), [applications]);

  const upcomingInterviews = useMemo(() => interviews
    .filter((app) => app.interviewDate && new Date(`${app.interviewDate.slice(0, 10)}T23:59:59`) >= new Date())
    .sort((first, second) => new Date(first.interviewDate) - new Date(second.interviewDate))
    .slice(0, 4), [interviews]);

  const openNewForm = () => {
    setEditingId(null);
    setForm(blankForm());
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (application) => {
    setEditingId(application._id);
    setForm({
      companyName: application.companyName || "",
      jobRole: application.jobRole || "",
      location: application.location || "",
      jobType: application.jobType || "Internship",
      applicationDate: application.applicationDate ? localDateInput(new Date(application.applicationDate)) : localDateInput(),
      status: application.status || "Applied",
      jobDescription: application.jobDescription || "",
      jobLink: application.jobLink || "",
      interviewDate: application.interviewDate ? localDateInput(new Date(application.interviewDate)) : "",
      notes: application.notes || ""
    });
    setFormError("");
    setShowForm(true);
  };

  const submitApplication = async (event) => {
    event.preventDefault();
    if (!form.companyName.trim() || !form.jobRole.trim()) {
      setFormError("Enter a company name and job role.");
      return;
    }
    if (form.jobLink && !/^https?:\/\//i.test(form.jobLink.trim())) {
      setFormError("Job link must start with http:// or https://.");
      return;
    }
    setBusy(true);
    setFormError("");
    const payload = {
      ...form,
      companyName: form.companyName.trim(),
      jobRole: form.jobRole.trim(),
      applicationDate: new Date(`${form.applicationDate}T12:00:00`).toISOString(),
      interviewDate: form.interviewDate ? new Date(`${form.interviewDate}T12:00:00`).toISOString() : null
    };
    try {
      if (editingId) {
        await applicationApi.update(editingId, payload);
        setToast("Application updated.");
      } else {
        await applicationApi.create(payload);
        setToast("Application added.");
      }
      setShowForm(false);
      await loadWorkspaceData();
    } catch (requestError) {
      setFormError(requestError.message);
      if (requestError.status === 401) {
        clearToken();
        setUser(null);
      }
    } finally {
      setBusy(false);
    }
  };

  const removeApplication = async (application) => {
    if (!window.confirm(`Delete your ${application.jobRole} application at ${application.companyName}? This cannot be undone.`)) return;
    setError("");
    setDeletingId(application._id);
    try {
      await applicationApi.remove(application._id);
      setApplications((current) => current.filter((item) => item._id !== application._id));
      setInterviews((current) => current.filter((item) => item._id !== application._id));
      setDetails((current) => current?._id === application._id ? null : current);
      setToast("Application deleted.");
    } catch (requestError) {
      setError(requestError.message);
      if (requestError.status === 401) {
        clearToken();
        setUser(null);
      }
    } finally {
      setDeletingId(null);
    }
  };

  const signOut = () => {
    clearToken();
    setUser(null);
    setApplications([]);
    setInterviews([]);
    setError("");
  };

  if (initializing) {
    return <main className="loading-screen"><span className="spinner" /><p>Opening your workspace…</p></main>;
  }
  if (!user) return <AuthScreen notice={error} onAuthenticated={(authenticatedUser) => { setUser(authenticatedUser); setError(""); loadWorkspaceData(); }} />;

  return (
    <div className="workspace">
      <aside className="sidebar">
        <a className="brand" href="#overview"><span className="brand-mark">A</span><span>ApplyTrack</span></a>
        <p className="nav-caption">WORKSPACE</p>
        <nav className="side-nav">
          <a className="nav-link active" href="#overview"><span className="nav-icon">⌂</span>Overview</a>
          <a className="nav-link" href="#applications"><span className="nav-icon">▤</span>Applications<span className="nav-count">{counts.total}</span></a>
          <a className="nav-link" href="#interviews"><span className="nav-icon">◷</span>Interviews</a>
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><span className="help-icon">✦</span><strong>Keep the momentum</strong><p>A small step today can lead to your next big opportunity.</p></div>
          <div className="profile-row"><span className="avatar">{user.name?.charAt(0).toUpperCase() || "U"}</span><span className="profile-copy"><strong>{user.name}</strong><small>{user.email}</small></span><button aria-label="Sign out" className="icon-button signout-button" onClick={signOut} title="Sign out" type="button">↗</button></div>
        </div>
      </aside>

      <main className="main-content" id="overview">
        <header className="topbar">
          <div><p className="breadcrumb">Workspace <span>/</span> Overview</p><h1>Your job search, in focus.</h1><p className="page-subtitle">A little progress adds up. Here’s where you stand today.</p></div>
          <button className="button button-primary top-add" onClick={openNewForm} type="button"><span>＋</span> Add application</button>
        </header>

        {error && <div className="notice error-notice page-notice" role="alert"><span>{error}</span><button aria-label="Dismiss error" className="notice-close" onClick={() => setError("")} type="button">×</button></div>}

        <section aria-label="Application statistics" className="stats-grid">
          <article className="stat-card stat-total"><div className="stat-top"><span>Total applications</span><span className="stat-symbol">▤</span></div><strong>{counts.total}</strong><small>Opportunities you're tracking</small></article>
          <article className="stat-card"><div className="stat-top"><span>Applied</span><span className="stat-dot applied-dot" /></div><strong>{counts.Applied}</strong><small>Waiting for a response</small></article>
          <article className="stat-card"><div className="stat-top"><span>Assessments</span><span className="stat-dot assessment-dot" /></div><strong>{counts.Assessment}</strong><small>Skills in action</small></article>
          <article className="stat-card"><div className="stat-top"><span>Interviews</span><span className="stat-dot interview-dot" /></div><strong>{counts.Interview}</strong><small>Conversations ahead</small></article>
          <article className="stat-card"><div className="stat-top"><span>Selected / offers</span><span className="stat-dot selected-dot" /></div><strong>{counts.Selected}</strong><small>Your hard work is paying off</small></article>
          <article className="stat-card"><div className="stat-top"><span>Rejected</span><span className="stat-dot rejected-dot" /></div><strong>{counts.Rejected}</strong><small>Every no is a step closer</small></article>
        </section>

        <section className="content-grid">
          <div className="applications-panel" id="applications">
            <div className="section-heading">
              <div><p className="eyebrow">YOUR PIPELINE</p><h2>Applications</h2><p>{filteredApplications.length} {filteredApplications.length === 1 ? "opportunity" : "opportunities"} in view</p></div>
              <button className="button button-secondary small-add" onClick={openNewForm} type="button">＋ Add new</button>
            </div>
            <div className="filter-toolbar">
              <label className="search-box"><span>⌕</span><input aria-label="Search company or job role" onChange={(event) => setSearch(event.target.value)} placeholder="Search company or role…" value={search} /></label>
              <select aria-label="Filter by status" onChange={(event) => setFilterStatus(event.target.value)} value={filterStatus}><option value="All">All statuses</option>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select>
              <select aria-label="Filter by job type" onChange={(event) => setFilterType(event.target.value)} value={filterType}><option value="All">All job types</option>{JOB_TYPES.map((type) => <option key={type}>{type}</option>)}</select>
              <select aria-label="Sort applications by date" onChange={(event) => setSortOrder(event.target.value)} value={sortOrder}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select>
            </div>
            {loading ? <div className="list-state"><span className="spinner" /><p>Loading your applications…</p></div> : filteredApplications.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">▤</div><h3>{applications.length ? "No matches found" : "Your next opportunity starts here"}</h3><p>{applications.length ? "Try a different search or update your filters." : "Add your first application and keep every detail in one place."}</p>{!applications.length && <button className="button button-primary" onClick={openNewForm} type="button">Add your first application</button>}</div>
            ) : (
              <div className="application-list">
                {filteredApplications.map((application) => (
                  <article className="application-card" key={application._id}>
                    <div className="company-avatar">{application.companyName?.charAt(0).toUpperCase()}</div>
                    <div className="application-info"><div className="company-title"><h3>{application.companyName}</h3><span className={`status-badge ${application.status.toLowerCase()}`}>{application.status}</span></div><p>{application.jobRole}</p><div className="application-meta"><span>⌖ {application.location || "Location not specified"}</span><span>·</span><span>{application.jobType}</span><span>·</span><span>Applied {prettyDate(application.applicationDate)}</span></div>{application.interviewDate && <p className="interview-reminder">◷ Interview {prettyDate(application.interviewDate)}</p>}</div>
                    <div className="application-actions"><button className="action-button" onClick={() => setDetails(application)} type="button">Details</button><button aria-label={`Edit ${application.companyName}`} className="icon-button" onClick={() => openEditForm(application)} title="Edit" type="button">✎</button><button aria-label={deletingId === application._id ? `Deleting ${application.companyName}` : `Delete ${application.companyName}`} aria-busy={deletingId === application._id} className="icon-button delete-action" disabled={deletingId === application._id} onClick={() => removeApplication(application)} title={deletingId === application._id ? "Deleting" : "Delete"} type="button">{deletingId === application._id ? "…" : "⌫"}</button></div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside className="interviews-panel" id="interviews">
            <div className="section-heading interview-heading"><div><p className="eyebrow">COMING UP</p><h2>Interviews</h2></div><span className="calendar-icon">▦</span></div>
            {upcomingInterviews.length ? <div className="interview-list">{upcomingInterviews.map((application) => (
              <button className="interview-item" key={application._id} onClick={() => setDetails(application)} type="button">
                <span className="interview-date"><strong>{new Date(application.interviewDate).toLocaleDateString(undefined, { day: "2-digit" })}</strong><small>{new Date(application.interviewDate).toLocaleDateString(undefined, { month: "short" })}</small></span>
                <span className="interview-company"><strong>{application.companyName}</strong><small>{application.jobRole}</small></span><span className="interview-arrow">↗</span>
              </button>
            ))}</div> : <div className="interview-empty"><span>◷</span><p>No upcoming interviews yet.</p><small>Add an interview date to an application and it’ll show up here.</small></div>}
            <div className="pipeline-tip"><span>✦</span><div><strong>Keep your notes close</strong><p>Capture a few thoughts after every conversation while they’re fresh.</p></div></div>
          </aside>
        </section>
        <footer className="page-footer"><span>ApplyTrack <span>·</span> Your search, organized.</span><span>Built for your next chapter</span></footer>
      </main>

      {showForm && <ApplicationForm busy={busy} editing={Boolean(editingId)} error={formError} form={form} onClose={() => setShowForm(false)} onSubmit={submitApplication} setForm={setForm} />}
      {details && <ApplicationDetails application={details} onClose={() => setDetails(null)} />}
      {toast && <div aria-live="polite" className="toast"><span>✓</span>{toast}</div>}
    </div>
  );
}

export default App;
