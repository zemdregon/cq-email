import { useRef, useState } from 'react';
import { BlurText } from './components/BlurText.jsx';
import redwolvesImage from '../redwolves.jpg';

const manorOptions = ['Holbrook', 'Smith'];
const rankOptions = ['AB', 'AMN', 'A1C', 'SrA'];
const phaseOptions = ['Remedial', 'Phase I', 'Phase II', 'Phase III'];

const createLateEntry = () => ({
  lastName: '',
  firstName: '',
  rank: '',
  room: '',
  timeAccounted: '',
  notes: ''
});

const createOfflineEntry = () => ({
  lastName: '',
  firstName: '',
  rank: '',
  room: ''
});

const createPhaseEntry = () => ({
  lastName: '',
  firstName: '',
  room: '',
  systemPhase: '',
  actualPhase: ''
});

const createOutprocessedEntry = () => ({
  lastName: '',
  firstName: '',
  date: ''
});

const createNoteEntry = () => ({ id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, text: '' });

const formatSubjectDate = date => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short'
  });
  return formatter
    .format(date)
    .replace(',', '')
    .replace(/^0/, '');
};

const escapeHtml = value =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatAccountedTime = value => {
  if (!value) {
    return '';
  }

  const [hours, minutes] = value.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return value;
  }

  const date = new Date();
  date.setHours(hours);
  date.setMinutes(minutes);

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
};

const formatOutprocessedDate = value => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

const buildBulletSection = (entries, { htmlFormatter, textFormatter, includeNotes = false }) => {
  const trimmedEntries = entries.filter(entry =>
    Object.values(entry)
      .map(value => (typeof value === 'string' ? value.trim() : value))
      .some(Boolean)
  );

  if (trimmedEntries.length === 0) {
    return {
      html: '<p><em>None reported.</em></p>',
      text: 'None reported.'
    };
  }

  const htmlItems = [];
  const textItems = [];

  trimmedEntries.forEach(entry => {
    const mainHtml = htmlFormatter(entry);
    const mainText = textFormatter(entry);

    if (!mainHtml || !mainText) {
      return;
    }

    let entryHtml = `<li>${mainHtml}`;
    let entryText = `• ${mainText}`;

    if (includeNotes && entry.notes && entry.notes.trim().length > 0) {
      const note = escapeHtml(entry.notes.trim());
      entryHtml += `
        <ul style="margin: 0.35em 0 0.5em 1.2em; padding-left: 1em;">
          <li>Note: ${note}</li>
        </ul>`;
      entryText += `
   ◦ Note: ${entry.notes.trim()}`;
    }

    entryHtml += '</li>';
    htmlItems.push(entryHtml);
    textItems.push(entryText);
  });

  if (htmlItems.length === 0) {
    return {
      html: '<p><em>None reported.</em></p>',
      text: 'None reported.'
    };
  }

  return {
    html: `<ul style="margin: 0.35em 0 0.75em 1.4em; padding-left: 1em;">${htmlItems.join('')}</ul>`,
    text: textItems.join('\n')
  };
};

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
  outPrompt: 'Out-processing roster review',
  outDetails: 'Out-processing details',
  notes: 'Additional notes',
  preparer: 'Prepared by'
};

export default function App() {
  const [manor, setManor] = useState('');
  const [lateAccounted, setLateAccounted] = useState([createLateEntry()]);
  const [notInSystem, setNotInSystem] = useState([]);
  const [phaseMismatches, setPhaseMismatches] = useState([]);
  const [outprocessed, setOutprocessed] = useState([]);
  const [notes, setNotes] = useState([]);

  const [emailSubject, setEmailSubject] = useState('');
  const [emailBodyHtml, setEmailBodyHtml] = useState('');
  const [emailBodyText, setEmailBodyText] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [copyStatus, setCopyStatus] = useState({ subject: '', body: '' });

  const [includeLate, setIncludeLate] = useState(null);
  const [includeNotInSystem, setIncludeNotInSystem] = useState(null);
  const [includePhase, setIncludePhase] = useState(null);
  const [includeOutprocessed, setIncludeOutprocessed] = useState(null);

  const [preparer, setPreparer] = useState({
    lastName: '',
    middleInitial: '',
    firstName: '',
    rank: rankOptions[0]
  });

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const copyTimers = useRef({});

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
              return 'Are any Airmen accounted for but not in the system?';
            case 'notDetails':
              return 'Record Airmen not in system';
            case 'phasePrompt':
              return 'Are any Airmen in the wrong phase in the system?';
            case 'phaseDetails':
              return 'Report mismatched training phases';
            case 'outPrompt':
              return 'Are there out-processed Airmen still on the roster?';
            case 'outDetails':
              return 'List out-processed Airmen for removal';
            case 'notes':
              return 'Add any additional notes or reminders (add a new note for each item)';
            case 'preparer':
              return 'Who prepared this accountability report?';
            default:
              return '';
          }
        })()}
      </h2>
      <p className="step-description">
        {(() => {
          switch (activeStep) {
            case 'manor':
              return 'Select the dorm you are responsible for right now.';
            case 'latePrompt':
              return 'Report if anyone checked in after the scheduled accountability time for their phase.';
            case 'lateDetails':
              return 'Capture who arrived late, when they checked in, where they stay, and any reasoning for why they were late.';
            case 'notPrompt':
              return 'Confirm whether you need to document Airmen who are present but not showing in the accountability roster.';
            case 'notDetails':
              return 'List the accountability information for Airmen accounted for not in the system so it can be updated.';
            case 'phasePrompt':
              return 'Identify if any Airmen are listed in a different phase than their current status.';
            case 'phaseDetails':
              return 'Provide the room number and actual phase so the roster can be updated.';
            case 'outPrompt':
              return 'Let us know if anyone has completed out-processing but is still appearing on the roster.';
            case 'outDetails':
              return 'Log who should be removed and the date their out-processing was completed.';
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
                setLateAccounted([createLateEntry()]);
              }
              if (!value) {
                setLateAccounted([createLateEntry()]);
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
                  <div className="entry-header">
                    <span className="entry-index">#{index + 1}</span>
                  </div>
                  <div className="field-grid field-grid--five field-grid--late">
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
                    <div className="field">
                      <label htmlFor={`late-time-${index}`}>Time Accounted For</label>
                      <input
                        id={`late-time-${index}`}
                        type="time"
                        value={entry.timeAccounted}
                        onChange={event => updateEntries(lateAccounted, setLateAccounted, index, 'timeAccounted', event.target.value)}
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor={`late-notes-${index}`}>Notes</label>
                    <textarea
                      id={`late-notes-${index}`}
                      value={entry.notes}
                      onChange={event => updateEntries(lateAccounted, setLateAccounted, index, 'notes', event.target.value)}
                      placeholder="Optional"
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
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => setLateAccounted([...lateAccounted, createLateEntry()])}
                >
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
                setNotInSystem([createOfflineEntry()]);
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
                  <div className="entry-actions">
                    <button className="button destructive" type="button" onClick={() => removeEntry(notInSystem, setNotInSystem, index)}>
                      Remove entry
                    </button>
                  </div>
                </div>
              ))}
              <div className="add-row">
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => setNotInSystem([...notInSystem, createOfflineEntry()])}
                >
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
                  <div className="field-grid field-grid--five">
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
                      <label htmlFor={`phase-room-${index}`}>Room Number</label>
                      <input
                        id={`phase-room-${index}`}
                        value={entry.room}
                        onChange={event => updateEntries(phaseMismatches, setPhaseMismatches, index, 'room', event.target.value)}
                        placeholder="C305"
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
                      <label htmlFor={`phase-actual-${index}`}>Actual Phase</label>
                      <select
                        id={`phase-actual-${index}`}
                        value={entry.actualPhase}
                        onChange={event => updateEntries(phaseMismatches, setPhaseMismatches, index, 'actualPhase', event.target.value)}
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
                  Add out-processing Airman
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
                  {rankOptions.map(option => (
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

  const handleCopyStatus = (field, message) => {
    if (copyTimers.current[field]) {
      clearTimeout(copyTimers.current[field]);
    }

    setCopyStatus(prev => ({ ...prev, [field]: message }));
    copyTimers.current[field] = setTimeout(() => {
      setCopyStatus(prev => ({ ...prev, [field]: '' }));
    }, 2500);
  };

  const formatMemberName = ({ rank, lastName, firstName }) => {
    const cleanRank = rank?.trim();
    const cleanLast = lastName?.trim();
    const cleanFirst = firstName?.trim();
    const parts = [];

    if (cleanRank) {
      parts.push(cleanRank);
    }

    if (cleanLast || cleanFirst) {
      const namePortion = [cleanLast, cleanFirst].filter(Boolean).join(', ');
      parts.push(namePortion);
    }

    return parts.join(' ');
  };

  const formatRoom = room => (room && room.trim().length > 0 ? `Room ${room.trim().toUpperCase()}` : '');

  const formatPhase = phase => (phase && phase.trim().length > 0 ? phase.trim() : '');

  const buildEmailTemplate = () => {
    const today = new Date();
    const subjectLine = manor ? `${manor} Accountability ${formatSubjectDate(today)}` : `Accountability ${formatSubjectDate(today)}`;

    const lateSection = includeLate
      ? buildBulletSection(lateAccounted, {
          includeNotes: true,
          htmlFormatter: entry => {
            const pieces = [formatMemberName(entry), formatRoom(entry.room)];
            const accounted = formatAccountedTime(entry.timeAccounted);
            if (accounted) {
              pieces.push(`Accounted at ${accounted}`);
            }
            return pieces
              .filter(Boolean)
              .map(piece => escapeHtml(piece))
              .join(' &bull; ');
          },
          textFormatter: entry => {
            const pieces = [formatMemberName(entry), formatRoom(entry.room)];
            const accounted = formatAccountedTime(entry.timeAccounted);
            if (accounted) {
              pieces.push(`Accounted at ${accounted}`);
            }
            return pieces.filter(Boolean).join(' • ');
          }
        })
      : { html: '<p><em>None reported.</em></p>', text: 'None reported.' };

    const notSystemSection = includeNotInSystem
      ? buildBulletSection(notInSystem, {
          htmlFormatter: entry => {
            const pieces = [formatMemberName(entry), formatRoom(entry.room)];
            return pieces
              .filter(Boolean)
              .map(piece => escapeHtml(piece))
              .join(' &bull; ');
          },
          textFormatter: entry => {
            const pieces = [formatMemberName(entry), formatRoom(entry.room)];
            return pieces.filter(Boolean).join(' • ');
          }
        })
      : { html: '<p><em>None reported.</em></p>', text: 'None reported.' };

    const phaseSection = includePhase
      ? buildBulletSection(phaseMismatches, {
          htmlFormatter: entry => {
            const pieces = [
              formatMemberName(entry),
              formatRoom(entry.room),
              entry.systemPhase ? `System phase: ${formatPhase(entry.systemPhase)}` : '',
              entry.actualPhase ? `Actual phase: ${formatPhase(entry.actualPhase)}` : ''
            ];
            return pieces.filter(Boolean).join(' &bull; ');
          },
          textFormatter: entry => {
            const pieces = [
              formatMemberName(entry),
              formatRoom(entry.room),
              entry.systemPhase ? `System phase: ${formatPhase(entry.systemPhase)}` : '',
              entry.actualPhase ? `Actual phase: ${formatPhase(entry.actualPhase)}` : ''
            ];
            return pieces.filter(Boolean).join(' • ');
          }
        })
      : { html: '<p><em>None reported.</em></p>', text: 'None reported.' };

    const outprocessedSection = includeOutprocessed
      ? buildBulletSection(outprocessed, {
          htmlFormatter: entry => {
            const pieces = [formatMemberName(entry)];
            const formattedDate = formatOutprocessedDate(entry.date);
            if (entry.room && entry.room.trim()) {
              pieces.push(formatRoom(entry.room));
            }
            if (formattedDate) {
              pieces.push(`Completed out-processing on ${formattedDate}`);
            }
            return pieces
              .filter(Boolean)
              .map(piece => escapeHtml(piece))
              .join(' &bull; ');
          },
          textFormatter: entry => {
            const pieces = [formatMemberName(entry)];
            if (entry.room && entry.room.trim()) {
              pieces.push(formatRoom(entry.room));
            }
            const formattedDate = formatOutprocessedDate(entry.date);
            if (formattedDate) {
              pieces.push(`Completed out-processing on ${formattedDate}`);
            }
            return pieces.filter(Boolean).join(' • ');
          }
        })
      : { html: '<p><em>None reported.</em></p>', text: 'None reported.' };

    const notesSection = buildBulletSection(
      notes.filter(note => note.text && note.text.trim().length > 0),
      {
        htmlFormatter: entry => (entry.text && entry.text.trim().length > 0 ? escapeHtml(entry.text.trim()) : ''),
        textFormatter: entry => (entry.text && entry.text.trim().length > 0 ? entry.text.trim() : '')
      }
    );

    const middleInitial = preparer.middleInitial?.trim();
    const formattedNameParts = [
      preparer.firstName?.trim(),
      middleInitial ? `${middleInitial}.` : '',
      preparer.lastName?.trim(),
      preparer.rank ? `${preparer.rank}, USAF` : 'USAF'
    ].filter(Boolean);
    const signatureLine = formattedNameParts.join(' ');

    const htmlBody = [
      '<p>MTLs,</p>',
      '<p>The following personnel were late but accounted for:</p>',
      lateSection.html,
      '<p>The following personnel were accounted for but not in the system:</p>',
      notSystemSection.html,
      '<p>The following personnel were in a different phase in the system:</p>',
      phaseSection.html,
      '<p>The following personnel are out-processed but still on the roster:</p>',
      outprocessedSection.html,
      '<p>Notes:</p>',
      notesSection.html,
      `<p>${escapeHtml(signatureLine)}</p>`,
      '<p>Head CQ<br />336 TRS<br />Keesler AFB, MS</p>'
    ].join('\n');

    const textBodyLines = [
      'MTLs,',
      '',
      'The following personnel were late but accounted for:',
      lateSection.text,
      '',
      'The following personnel were accounted for but not in the system:',
      notSystemSection.text,
      '',
      'The following personnel were in a different phase in the system:',
      phaseSection.text,
      '',
      'The following personnel are out-processed but still on the roster:',
      outprocessedSection.text,
      '',
      'Notes:',
      notesSection.text,
      '',
      signatureLine,
      'Head CQ',
      '336 TRS',
      'Keesler AFB, MS'
    ];

    setEmailSubject(subjectLine);
    setEmailBodyHtml(htmlBody);
    setEmailBodyText(textBodyLines.join('\n'));
    setShowPreview(true);

    if (typeof document !== 'undefined') {
      setTimeout(() => {
        const previewElement = document.getElementById('email-preview');
        if (previewElement) {
          previewElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    }
  };

  const handleCopySubject = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(emailSubject);
        handleCopyStatus('subject', 'Copied!');
      } else {
        handleCopyStatus('subject', 'Copy unavailable');
      }
    } catch (error) {
      console.error('Unable to copy subject line', error);
      handleCopyStatus('subject', 'Copy failed');
    }
  };

  const handleCopyBody = async () => {
    try {
      if (typeof navigator !== 'undefined') {
        if (navigator.clipboard?.write && typeof window !== 'undefined' && window.ClipboardItem) {
          const clipboardItem = new window.ClipboardItem({
            'text/plain': new Blob([emailBodyText], { type: 'text/plain' }),
            'text/html': new Blob([emailBodyHtml], { type: 'text/html' })
          });
          await navigator.clipboard.write([clipboardItem]);
        } else if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(emailBodyText);
        } else {
          throw new Error('Clipboard API not available');
        }
        handleCopyStatus('body', 'Copied!');
      } else {
        handleCopyStatus('body', 'Copy unavailable');
      }
    } catch (error) {
      console.error('Unable to copy email body', error);
      handleCopyStatus('body', 'Copy failed');
    }
  };

  return (
    <div className="app-shell">
      <div className="layout">
        <section className="hero-card">
          <div className="hero-content">
            <img src={redwolvesImage} alt="Red Wolves emblem" className="hero-logo" />
            <div className="hero-body">
              <BlurText text="Accountability Template" className="hero-title" animateBy="words" />
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
                <button className="button primary" type="button" onClick={buildEmailTemplate}>
                  Save accountability snapshot
                </button>
              )}
            </div>
          </div>
        </section>
        {showPreview && (
          <section className="glow-card preview-card" id="email-preview">
            <div className="preview-header">
              <BlurText text="Email template ready" animateBy="letters" className="preview-label" />
              <h2 className="preview-title">Copy and paste the accountability email into Outlook</h2>
              <p className="preview-description">
                Use the buttons below to copy the subject line and body. The body includes bullet formatting that pastes directly
                into Outlook.
              </p>
            </div>
            <div className="preview-field">
              <label htmlFor="email-subject">Subject line</label>
              <div className="preview-field-controls">
                <div className="preview-protected-input">
                  <input id="email-subject" value={emailSubject} readOnly />
                  <div
                    className="interaction-shield interaction-shield--input"
                    aria-hidden="true"
                    title="Use the copy subject button to copy"
                  />
                </div>
                <button className="button secondary" type="button" onClick={handleCopySubject}>
                  Copy subject
                </button>
              </div>
              {copyStatus.subject && <span className="copy-status">{copyStatus.subject}</span>}
            </div>
            <div className="preview-body">
              <div className="preview-body-header">
                <span>Email body</span>
                <div className="preview-body-actions">
                  <button className="button secondary" type="button" onClick={handleCopyBody}>
                    Copy formatted body
                  </button>
                  {copyStatus.body && <span className="copy-status">{copyStatus.body}</span>}
                </div>
              </div>
              <div className="preview-body-content-wrapper">
                <div className="preview-body-content" dangerouslySetInnerHTML={{ __html: emailBodyHtml }} />
                <div
                  className="interaction-shield interaction-shield--body"
                  aria-hidden="true"
                  title="Use the copy formatted body button to copy"
                />
              </div>
              <details className="preview-plaintext">
                <summary>Plain text fallback</summary>
                <textarea value={emailBodyText} readOnly />
              </details>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
