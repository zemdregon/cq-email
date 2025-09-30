import { useState } from 'react';
import { BlurText } from './components/BlurText.jsx';

const manorOptions = ['Holbrook', 'Smith'];
const rankOptions = ['E-1', 'E-2', 'E-3', 'E-4'];
const phaseOptions = ['Remedial', 'Phase I', 'Phase II', 'Phase III'];
const memberRankOptions = ['AB', 'AMN', 'A1C', 'SrA'];

const createPersonnelEntry = () => ({
  lastName: '',
  firstName: '',
  rank: '',
  room: '',
  notes: ''
});

const createPhaseEntry = () => ({
  lastName: '',
  firstName: '',
  systemPhase: '',
  currentPhase: ''
});

const createOutprocessedEntry = () => ({
  lastName: '',
  firstName: '',
  date: ''
});

const createNoteEntry = () => ({ id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, text: '' });

const stepOrder = [
  'manor',
  'latePrompt',
  'lateDetails',
  'notPrompt',
  'notDetails',
  'phasePrompt',
  'phaseDetails',
  'outPrompt',
  'outDetails',
  'notes',
  'preparer'
];

const stepTitles = {
  manor: 'Select manor',
  latePrompt: 'Late arrivals',
  lateDetails: 'Late arrival details',
  notPrompt: 'Accounted but not in system',
  notDetails: 'Offline confirmations',
  phasePrompt: 'Phase discrepancies',
  phaseDetails: 'Phase discrepancy details',
  outPrompt: 'Outprocessed roster review',
  outDetails: 'Outprocessed details',
  notes: 'Additional notes',
  preparer: 'Prepared by'
};

export default function App() {
  const [manor, setManor] = useState('');
  const [lateAccounted, setLateAccounted] = useState([createPersonnelEntry()]);
  const [notInSystem, setNotInSystem] = useState([]);
  const [phaseMismatches, setPhaseMismatches] = useState([]);
  const [outprocessed, setOutprocessed] = useState([]);
  const [notes, setNotes] = useState([createNoteEntry()]);

  const [includeLate, setIncludeLate] = useState(null);
  const [includeNotInSystem, setIncludeNotInSystem] = useState(null);
  const [includePhase, setIncludePhase] = useState(null);
  const [includeOutprocessed, setIncludeOutprocessed] = useState(null);

  const [preparer, setPreparer] = useState({
    lastName: '',
    middleInitial: '',
    firstName: '',
    rank: memberRankOptions[0]
  });

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const isStepEnabled = step => {
    switch (step) {
      case 'lateDetails':
        return includeLate === true;
      case 'notDetails':
        return includeNotInSystem === true;
      case 'phaseDetails':
        return includePhase === true;
      case 'outDetails':
        return includeOutprocessed === true;
      default:
        return true;
    }
  };

  const getNextEnabledIndex = index => {
    let next = index + 1;
    while (next < stepOrder.length && !isStepEnabled(stepOrder[next])) {
      next += 1;
    }
    return next;
  };

  const getPreviousEnabledIndex = index => {
    let previous = index - 1;
    while (previous >= 0 && !isStepEnabled(stepOrder[previous])) {
      previous -= 1;
    }
    return previous;
  };

  const activeStep = stepOrder[currentStepIndex];
  const enabledSteps = stepOrder.filter(step => isStepEnabled(step) || step === activeStep);
  const currentPosition = enabledSteps.indexOf(activeStep) + 1;
  const totalSteps = enabledSteps.length;
  const progress = totalSteps > 0 ? Math.min((currentPosition / totalSteps) * 100, 100) : 0;

  const updateEntries = (entries, setEntries, index, key, value) => {
    setEntries(entries.map((entry, idx) => (idx === index ? { ...entry, [key]: value } : entry)));
  };

  const removeEntry = (entries, setEntries, index) => {
    setEntries(entries.filter((_, idx) => idx !== index));
  };

  const handleNext = () => {
    if (!canGoNext(activeStep)) {
      return;
    }

    const nextIndex = getNextEnabledIndex(currentStepIndex);
    if (nextIndex < stepOrder.length) {
      setCurrentStepIndex(nextIndex);
    }
  };

  const handlePrevious = () => {
    const previousIndex = getPreviousEnabledIndex(currentStepIndex);
    if (previousIndex >= 0) {
      setCurrentStepIndex(previousIndex);
    }
  };

  const cardIntro =
    'Track accountability updates, roster discrepancies, and current statuses across Holbrook & Smith manors with clarity.';

  const canGoNext = step => {
    switch (step) {
      case 'manor':
        return manor !== '';
      case 'latePrompt':
        return includeLate !== null;
      case 'notPrompt':
        return includeNotInSystem !== null;
      case 'phasePrompt':
        return includePhase !== null;
      case 'outPrompt':
        return includeOutprocessed !== null;
      default:
        return true;
    }
  };

  const stepHeading = (
    <div className="step-heading">
      <BlurText text={stepTitles[activeStep]} animateBy="letters" className="step-label" />
      <h2 className="step-title">
        {(() => {
          switch (activeStep) {
            case 'manor':
              return 'Which manor are you in?';
            case 'latePrompt':
              return 'Were any airmen late to accountability?';
            case 'lateDetails':
              return 'Document late but accounted Airmen';
            case 'notPrompt':
              return 'Do you need to list Airmen accounted for but missing from the system?';
            case 'notDetails':
              return 'Record offline confirmations';
            case 'phasePrompt':
              return 'Are there any phase discrepancies to report?';
            case 'phaseDetails':
              return 'Flag mismatched training phases';
            case 'outPrompt':
              return 'Are there outprocessed Airmen still on the roster?';
            case 'outDetails':
              return 'List outprocessed Airmen for removal';
            case 'notes':
              return 'Add any additional notes or reminders';
            case 'preparer':
              return 'Who prepared this accountability snapshot?';
            default:
              return '';
          }
        })()}
      </h2>
      <p className="step-description">
        {(() => {
          switch (activeStep) {
            case 'manor':
              return 'Select the dorm or manor you are responsible for right now.';
            case 'latePrompt':
              return 'Let us know if anyone checked in after the scheduled accountability time.';
            case 'lateDetails':
              return 'Capture who arrived late, where they stay, and any context you gathered.';
            case 'notPrompt':
              return 'Confirm whether you need to document Airmen who are present but not showing in the system roster.';
            case 'notDetails':
              return 'Share details on how accountability was confirmed for each Airman missing from the system.';
            case 'phasePrompt':
              return 'Identify if any Airmen are listed in a different phase than their current status.';
            case 'phaseDetails':
              return 'Provide the correct phase information so the roster can be updated.';
            case 'outPrompt':
              return 'Let us know if anyone has outprocessed but is still appearing on the roster.';
            case 'outDetails':
              return 'Log who should be removed and the date their outprocessing was confirmed.';
            case 'notes':
              return 'Write quick reminders, follow-ups, or anything leadership should be aware of.';
            case 'preparer':
              return 'Sign the report so leadership knows who verified accountability.';
            default:
              return '';
          }
        })()}
      </p>
    </div>
  );

  const renderPromptButtons = (value, onChange) => (
    <div className="prompt-actions">
      <button
        type="button"
        className={`button option ${value === true ? 'selected' : ''}`}
        aria-pressed={value === true}
        onClick={() => onChange(true)}
      >
        Yes
      </button>
      <button
        type="button"
        className={`button option ${value === false ? 'selected' : ''}`}
        aria-pressed={value === false}
        onClick={() => onChange(false)}
      >
        No
      </button>
    </div>
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 'manor':
        return (
          <>
            {stepHeading}
            <div className="option-grid">
              {manorOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  className={`button option ${manor === option ? 'selected' : ''}`}
                  aria-pressed={manor === option}
                  onClick={() => setManor(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </>
        );
      case 'latePrompt':
        return (
          <>
            {stepHeading}
            {renderPromptButtons(includeLate, value => {
              setIncludeLate(value);
              if (value && lateAccounted.length === 0) {
                setLateAccounted([createPersonnelEntry()]);
              }
              if (!value) {
                setLateAccounted([createPersonnelEntry()]);
              }
            })}
          </>
        );
      case 'lateDetails':
        return (
          <>
            {stepHeading}
            <div className="control-group">
              {lateAccounted.map((entry, index) => (
                <div className="list-entry" key={`late-${index}`}>
                  <span className="entry-index">#{index + 1}</span>
                  <div className="field-grid">
                    <div className="field">
                      <label htmlFor={`late-last-${index}`}>Last Name</label>
                      <input
                        id={`late-last-${index}`}
                        value={entry.lastName}
                        onChange={event => updateEntries(lateAccounted, setLateAccounted, index, 'lastName', event.target.value)}
                        placeholder="Doe"
                      />
                    </div>
                    <div className="field">
                      <label htmlFor={`late-first-${index}`}>First Name</label>
                      <input
                        id={`late-first-${index}`}
                        value={entry.firstName}
                        onChange={event => updateEntries(lateAccounted, setLateAccounted, index, 'firstName', event.target.value)}
                        placeholder="Jane"
                      />
                    </div>
                    <div className="field">
                      <label htmlFor={`late-rank-${index}`}>Rank</label>
                      <select
                        id={`late-rank-${index}`}
                        value={entry.rank}
                        onChange={event => updateEntries(lateAccounted, setLateAccounted, index, 'rank', event.target.value)}
                      >
                        <option value="" disabled>
                          Select rank
                        </option>
                        {rankOptions.map(option => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor={`late-room-${index}`}>Room Number</label>
                      <input
                        id={`late-room-${index}`}
                        value={entry.room}
                        onChange={event => updateEntries(lateAccounted, setLateAccounted, index, 'room', event.target.value)}
                        placeholder="B214"
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor={`late-notes-${index}`}>Notes</label>
                    <textarea
                      id={`late-notes-${index}`}
                      value={entry.notes}
                      onChange={event => updateEntries(lateAccounted, setLateAccounted, index, 'notes', event.target.value)}
                      placeholder="Contacted by CQ runner, returned at 2130."
                    />
                  </div>
                  <div className="entry-actions">
                    <button
                      className="button destructive"
                      type="button"
                      onClick={() => removeEntry(lateAccounted, setLateAccounted, index)}
                      disabled={lateAccounted.length === 1}
                    >
                      Remove entry
                    </button>
                  </div>
                </div>
              ))}
              <div className="add-row">
                <button className="button secondary" type="button" onClick={() => setLateAccounted([...lateAccounted, createPersonnelEntry()])}>
                  Add late accountability
                </button>
              </div>
            </div>
          </>
        );
      case 'notPrompt':
        return (
          <>
            {stepHeading}
            {renderPromptButtons(includeNotInSystem, value => {
              setIncludeNotInSystem(value);
              if (value && notInSystem.length === 0) {
                setNotInSystem([createPersonnelEntry()]);
              }
              if (!value) {
                setNotInSystem([]);
              }
            })}
          </>
        );
      case 'notDetails':
        return (
          <>
            {stepHeading}
            <div className="control-group">
              {notInSystem.map((entry, index) => (
                <div className="list-entry" key={`not-system-${index}`}>
                  <span className="entry-index">#{index + 1}</span>
                  <div className="field-grid">
                    <div className="field">
                      <label htmlFor={`not-last-${index}`}>Last Name</label>
                      <input
                        id={`not-last-${index}`}
                        value={entry.lastName}
                        onChange={event => updateEntries(notInSystem, setNotInSystem, index, 'lastName', event.target.value)}
                        placeholder="Lopez"
                      />
                    </div>
                    <div className="field">
                      <label htmlFor={`not-first-${index}`}>First Name</label>
                      <input
                        id={`not-first-${index}`}
                        value={entry.firstName}
                        onChange={event => updateEntries(notInSystem, setNotInSystem, index, 'firstName', event.target.value)}
                        placeholder="Maria"
                      />
                    </div>
                    <div className="field">
                      <label htmlFor={`not-rank-${index}`}>Rank</label>
                      <select
                        id={`not-rank-${index}`}
                        value={entry.rank}
                        onChange={event => updateEntries(notInSystem, setNotInSystem, index, 'rank', event.target.value)}
                      >
                        <option value="" disabled>
                          Select rank
                        </option>
                        {rankOptions.map(option => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor={`not-room-${index}`}>Room Number</label>
                      <input
                        id={`not-room-${index}`}
                        value={entry.room}
                        onChange={event => updateEntries(notInSystem, setNotInSystem, index, 'room', event.target.value)}
                        placeholder="A107"
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor={`not-notes-${index}`}>Notes</label>
                    <textarea
                      id={`not-notes-${index}`}
                      value={entry.notes}
                      onChange={event => updateEntries(notInSystem, setNotInSystem, index, 'notes', event.target.value)}
                      placeholder="Verified by Element Leader during room check."
                    />
                  </div>
                  <div className="entry-actions">
                    <button className="button destructive" type="button" onClick={() => removeEntry(notInSystem, setNotInSystem, index)}>
                      Remove entry
                    </button>
                  </div>
                </div>
              ))}
              <div className="add-row">
                <button className="button secondary" type="button" onClick={() => setNotInSystem([...notInSystem, createPersonnelEntry()])}>
                  Add accounted entry
                </button>
              </div>
            </div>
          </>
        );
      case 'phasePrompt':
        return (
          <>
            {stepHeading}
            {renderPromptButtons(includePhase, value => {
              setIncludePhase(value);
              if (value && phaseMismatches.length === 0) {
                setPhaseMismatches([createPhaseEntry()]);
              }
              if (!value) {
                setPhaseMismatches([]);
              }
            })}
          </>
        );
      case 'phaseDetails':
        return (
          <>
            {stepHeading}
            <div className="control-group">
              {phaseMismatches.map((entry, index) => (
                <div className="list-entry" key={`phase-${index}`}>
                  <span className="entry-index">#{index + 1}</span>
                  <div className="field-grid">
                    <div className="field">
                      <label htmlFor={`phase-last-${index}`}>Last Name</label>
                      <input
                        id={`phase-last-${index}`}
                        value={entry.lastName}
                        onChange={event => updateEntries(phaseMismatches, setPhaseMismatches, index, 'lastName', event.target.value)}
                        placeholder="Nguyen"
                      />
                    </div>
                    <div className="field">
                      <label htmlFor={`phase-first-${index}`}>First Name</label>
                      <input
                        id={`phase-first-${index}`}
                        value={entry.firstName}
                        onChange={event => updateEntries(phaseMismatches, setPhaseMismatches, index, 'firstName', event.target.value)}
                        placeholder="Alex"
                      />
                    </div>
                    <div className="field">
                      <label htmlFor={`phase-system-${index}`}>Phase in System</label>
                      <select
                        id={`phase-system-${index}`}
                        value={entry.systemPhase}
                        onChange={event => updateEntries(phaseMismatches, setPhaseMismatches, index, 'systemPhase', event.target.value)}
                      >
                        <option value="" disabled>
                          Select phase
                        </option>
                        {phaseOptions.map(option => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor={`phase-current-${index}`}>Current Phase</label>
                      <select
                        id={`phase-current-${index}`}
                        value={entry.currentPhase}
                        onChange={event => updateEntries(phaseMismatches, setPhaseMismatches, index, 'currentPhase', event.target.value)}
                      >
                        <option value="" disabled>
                          Select phase
                        </option>
                        {phaseOptions.map(option => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="entry-actions">
                    <button className="button destructive" type="button" onClick={() => removeEntry(phaseMismatches, setPhaseMismatches, index)}>
                      Remove entry
                    </button>
                  </div>
                </div>
              ))}
              <div className="add-row">
                <button className="button secondary" type="button" onClick={() => setPhaseMismatches([...phaseMismatches, createPhaseEntry()])}>
                  Add phase discrepancy
                </button>
              </div>
            </div>
          </>
        );
      case 'outPrompt':
        return (
          <>
            {stepHeading}
            {renderPromptButtons(includeOutprocessed, value => {
              setIncludeOutprocessed(value);
              if (value && outprocessed.length === 0) {
                setOutprocessed([createOutprocessedEntry()]);
              }
              if (!value) {
                setOutprocessed([]);
              }
            })}
          </>
        );
      case 'outDetails':
        return (
          <>
            {stepHeading}
            <div className="control-group">
              {outprocessed.map((entry, index) => (
                <div className="list-entry" key={`out-${index}`}>
                  <span className="entry-index">#{index + 1}</span>
                  <div className="field-grid">
                    <div className="field">
                      <label htmlFor={`out-last-${index}`}>Last Name</label>
                      <input
                        id={`out-last-${index}`}
                        value={entry.lastName}
                        onChange={event => updateEntries(outprocessed, setOutprocessed, index, 'lastName', event.target.value)}
                        placeholder="Khan"
                      />
                    </div>
                    <div className="field">
                      <label htmlFor={`out-first-${index}`}>First Name</label>
                      <input
                        id={`out-first-${index}`}
                        value={entry.firstName}
                        onChange={event => updateEntries(outprocessed, setOutprocessed, index, 'firstName', event.target.value)}
                        placeholder="Imani"
                      />
                    </div>
                    <div className="field">
                      <label htmlFor={`out-date-${index}`}>Date Outprocessed</label>
                      <input
                        id={`out-date-${index}`}
                        type="date"
                        value={entry.date}
                        onChange={event => updateEntries(outprocessed, setOutprocessed, index, 'date', event.target.value)}
                      />
                    </div>
                  </div>
                  <div className="entry-actions">
                    <button className="button destructive" type="button" onClick={() => removeEntry(outprocessed, setOutprocessed, index)}>
                      Remove entry
                    </button>
                  </div>
                </div>
              ))}
              <div className="add-row">
                <button className="button secondary" type="button" onClick={() => setOutprocessed([...outprocessed, createOutprocessedEntry()])}>
                  Add roster cleanup
                </button>
              </div>
            </div>
          </>
        );
      case 'notes':
        return (
          <>
            {stepHeading}
            <div className="notes-list">
              {notes.map((note, index) => (
                <div className="list-entry" key={note.id}>
                  <span className="entry-index">#{index + 1}</span>
                  <div className="field">
                    <label htmlFor={`note-${note.id}`}>Sentence note</label>
                    <textarea
                      id={`note-${note.id}`}
                      value={note.text}
                      onChange={event =>
                        setNotes(notes.map(item => (item.id === note.id ? { ...item, text: event.target.value } : item)))
                      }
                      placeholder="Follow up with Dorm Leader about maintenance ticket."
                    />
                  </div>
                  <div className="entry-actions">
                    <button className="button destructive" type="button" onClick={() => setNotes(notes.filter(item => item.id !== note.id))}>
                      Remove note
                    </button>
                  </div>
                </div>
              ))}
              <div className="add-row">
                <button className="button secondary" type="button" onClick={() => setNotes([...notes, createNoteEntry()])}>
                  Add note
                </button>
              </div>
            </div>
          </>
        );
      case 'preparer':
        return (
          <>
            {stepHeading}
            <div className="field-grid">
              <div className="field">
                <label htmlFor="prep-last">Last Name</label>
                <input
                  id="prep-last"
                  value={preparer.lastName}
                  onChange={event => setPreparer(prev => ({ ...prev, lastName: event.target.value }))}
                  placeholder="Taylor"
                />
              </div>
              <div className="field">
                <label htmlFor="prep-middle">Middle Initial</label>
                <input
                  id="prep-middle"
                  value={preparer.middleInitial}
                  onChange={event =>
                    setPreparer(prev => ({ ...prev, middleInitial: event.target.value.toUpperCase().slice(0, 1) }))
                  }
                  placeholder="M"
                />
              </div>
              <div className="field">
                <label htmlFor="prep-first">First Name</label>
                <input
                  id="prep-first"
                  value={preparer.firstName}
                  onChange={event => setPreparer(prev => ({ ...prev, firstName: event.target.value }))}
                  placeholder="Jordan"
                />
              </div>
              <div className="field">
                <label htmlFor="prep-rank">Rank</label>
                <select
                  id="prep-rank"
                  value={preparer.rank}
                  onChange={event => setPreparer(prev => ({ ...prev, rank: event.target.value }))}
                >
                  {memberRankOptions.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const isLastStep = activeStep === 'preparer';

  return (
    <div className="app-shell">
      <div className="layout">
        <section className="hero-card">
          <div className="hero-content">
            <BlurText text="Accountability Dashboard" className="hero-title" animateBy="words" />
            <p className="section-description">{cardIntro}</p>
            <div className="hero-progress">
              <div className="progress-meta">
                <span>Step {currentPosition}</span>
                <span>{stepTitles[activeStep]}</span>
                <span>{totalSteps} total</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        </section>

        <section className="glow-card wizard-card">
          {renderStepContent()}
          <div className="wizard-controls">
            <div className="wizard-control-left">
              {currentStepIndex > 0 && (
                <button className="button secondary" type="button" onClick={handlePrevious}>
                  Back
                </button>
              )}
            </div>
            <div className="wizard-control-right">
              {!isLastStep && (
                <button className="button primary" type="button" onClick={handleNext} disabled={!canGoNext(activeStep)}>
                  Next
                </button>
              )}
              {isLastStep && (
                <button className="button primary" type="button">
                  Save accountability snapshot
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
