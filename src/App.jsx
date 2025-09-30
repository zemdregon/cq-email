import { useMemo, useState } from 'react';
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

export default function App() {
  const [manor, setManor] = useState(manorOptions[0]);
  const [lateAccounted, setLateAccounted] = useState([createPersonnelEntry()]);
  const [notInSystem, setNotInSystem] = useState([]);
  const [phaseMismatches, setPhaseMismatches] = useState([]);
  const [outprocessed, setOutprocessed] = useState([]);
  const [notes, setNotes] = useState([createNoteEntry()]);
  const [preparer, setPreparer] = useState({
    lastName: '',
    middleInitial: '',
    firstName: '',
    rank: memberRankOptions[0]
  });

  const cardIntro = useMemo(
    () =>
      `Track accountability updates, roster discrepancies, and current statuses across ${manorOptions.join(
        ' & '
      )} manors with clarity.`,
    []
  );

  const updateEntries = (entries, setEntries, index, key, value) => {
    setEntries(entries.map((entry, idx) => (idx === index ? { ...entry, [key]: value } : entry)));
  };

  const removeEntry = (entries, setEntries, index) => {
    setEntries(entries.filter((_, idx) => idx !== index));
  };

  return (
    <div className="app-shell">
      <div className="layout">
        <section className="hero-card">
          <div className="hero-content">
            <BlurText text="Accountability Dashboard" className="hero-title" />
            <p className="section-description">{cardIntro}</p>
            <div className="field">
              <label htmlFor="manor">Which manor?</label>
              <select id="manor" value={manor} onChange={event => setManor(event.target.value)}>
                {manorOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="glow-card">
          <header className="section-header">
            <h2>Late but Accounted For</h2>
            <BlurText text="Document tardy arrivals with context." animateBy="letters" className="section-subtitle" />
          </header>
          <p className="section-description">
            Capture personnel who checked in late yet have confirmed accountability. Use the notes field to describe the
            circumstance or point of contact.
          </p>

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
              <button className="button primary" type="button" onClick={() => setLateAccounted([...lateAccounted, createPersonnelEntry()])}>
                Add late accountability
              </button>
            </div>
          </div>
        </section>

        <section className="glow-card">
          <header className="section-header">
            <h2>Accounted For but Not in System</h2>
            <BlurText text="Capture offline confirmations." animateBy="letters" className="section-subtitle" direction="bottom" />
          </header>
          <p className="section-description">
            Record personnel who are present yet not reflected in the system roster. Document how accountability was verified.
          </p>
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
        </section>

        <section className="glow-card">
          <header className="section-header">
            <h2>Phase Discrepancies</h2>
            <BlurText text="Flag mismatched training phases." animateBy="words" className="section-subtitle" />
          </header>
          <p className="section-description">
            Note any Airmen whose phase within the system differs from their current, verified status.
          </p>
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
        </section>

        <section className="glow-card">
          <header className="section-header">
            <h2>Outprocessed but on Roster</h2>
            <BlurText text="Track roster cleanup needs." animateBy="letters" className="section-subtitle" direction="bottom" />
          </header>
          <p className="section-description">
            Identify Airmen who have completed outprocessing but remain listed on the roster. Capture the confirmed date.
          </p>
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
        </section>

        <section className="glow-card">
          <header className="section-header">
            <h2>Additional Notes</h2>
            <BlurText text="Include reminders or follow-ups." animateBy="letters" className="section-subtitle" />
          </header>
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
        </section>

        <section className="glow-card">
          <header className="section-header">
            <h2>Prepared By</h2>
            <BlurText text="Sign the report." animateBy="letters" className="section-subtitle" direction="bottom" />
          </header>
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
                onChange={event => setPreparer(prev => ({ ...prev, middleInitial: event.target.value.toUpperCase().slice(0, 1) }))}
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
          <div className="entry-actions">
            <button className="button primary" type="button">
              Save accountability snapshot
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
