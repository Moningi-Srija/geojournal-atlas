/* oxlint-disable react/only-export-components -- Trip Fit intentionally exports its persisted context API beside the panel. */
import { useEffect, useRef, useState } from 'react';
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Cloud,
  MapPin,
  Save,
  Upload,
  Wallet,
  X,
} from 'lucide-react';

export type TripFitBudgetBand = 'economy' | 'comfortable' | 'premium';

export interface TripFitCalendarEvent {
  start: string;
  summary: string;
}

export interface TripFitContext {
  homeCity: string;
  leaveDaysRemaining: number | null;
  budgetBand: TripFitBudgetBand;
  preferredMonth: string;
  holidayNotes: string;
  calendarEvents: TripFitCalendarEvent[];
  updatedAt: number;
}

interface TripFitPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (context: TripFitContext) => void;
}

const STORAGE_KEY = 'geojournal_trip_fit';
const MAX_CALENDAR_EVENTS = 30;
const BUDGET_OPTIONS: Array<{ value: TripFitBudgetBand; label: string; note: string }> = [
  { value: 'economy', label: 'Economy', note: 'Value-first' },
  { value: 'comfortable', label: 'Comfortable', note: 'Balanced' },
  { value: 'premium', label: 'Premium', note: 'Experience-first' },
];

const emptyTripFitContext = (): TripFitContext => ({
  homeCity: '',
  leaveDaysRemaining: null,
  budgetBand: 'comfortable',
  preferredMonth: '',
  holidayNotes: '',
  calendarEvents: [],
  updatedAt: 0,
});

const isBudgetBand = (value: unknown): value is TripFitBudgetBand =>
  value === 'economy' || value === 'comfortable' || value === 'premium';

export function loadTripFitContext(): TripFitContext {
  if (typeof window === 'undefined') return emptyTripFitContext();

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return emptyTripFitContext();

    const parsed = JSON.parse(stored) as Partial<TripFitContext>;
    const leaveDays = typeof parsed.leaveDaysRemaining === 'number'
      && Number.isFinite(parsed.leaveDaysRemaining)
      && parsed.leaveDaysRemaining >= 0
      ? parsed.leaveDaysRemaining
      : null;
    const calendarEvents = Array.isArray(parsed.calendarEvents)
      ? parsed.calendarEvents
          .filter((event): event is TripFitCalendarEvent => Boolean(
            event
            && typeof event.start === 'string'
            && typeof event.summary === 'string',
          ))
          .slice(0, MAX_CALENDAR_EVENTS)
      : [];

    return {
      homeCity: typeof parsed.homeCity === 'string' ? parsed.homeCity : '',
      leaveDaysRemaining: leaveDays,
      budgetBand: isBudgetBand(parsed.budgetBand) ? parsed.budgetBand : 'comfortable',
      preferredMonth: typeof parsed.preferredMonth === 'string' ? parsed.preferredMonth : '',
      holidayNotes: typeof parsed.holidayNotes === 'string' ? parsed.holidayNotes : '',
      calendarEvents,
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0,
    };
  } catch (error) {
    console.warn('Trip Fit context could not be loaded.', error);
    return emptyTripFitContext();
  }
}

const decodeIcsText = (value: string) => value
  .replace(/\\n/gi, ' ')
  .replace(/\\,/g, ',')
  .replace(/\\;/g, ';')
  .replace(/\\\\/g, '\\')
  .trim();

const parseIcsDate = (value: string): string | null => {
  const match = value.trim().match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?)?(Z)?$/);
  if (!match) return null;

  const [, year, month, day, hour = '00', minute = '00', second = '00', utc] = match;
  const parts = [year, month, day, hour, minute, second].map(Number);
  const [numericYear, numericMonth, numericDay, numericHour, numericMinute, numericSecond] = parts;
  const date = utc
    ? new Date(Date.UTC(
        numericYear,
        numericMonth - 1,
        numericDay,
        numericHour,
        numericMinute,
        numericSecond,
      ))
    : new Date(
        numericYear,
        numericMonth - 1,
        numericDay,
        numericHour,
        numericMinute,
        numericSecond,
      );

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const parseIcsEvents = (contents: string): TripFitCalendarEvent[] => {
  const unfolded = contents.replace(/\r?\n[ \t]/g, '');
  const eventBlocks = unfolded.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/gi) ?? [];

  return eventBlocks
    .map((block): TripFitCalendarEvent | null => {
      const startValue = block.match(/^DTSTART(?:;[^:]*)?:(.+)$/im)?.[1]?.trim();
      const summaryValue = block.match(/^SUMMARY(?:;[^:]*)?:(.+)$/im)?.[1]?.trim();
      if (!startValue || !summaryValue) return null;

      const start = parseIcsDate(startValue);
      const summary = decodeIcsText(summaryValue);
      if (!start || !summary) return null;
      return { start, summary };
    })
    .filter((event): event is TripFitCalendarEvent => event !== null)
    .sort((first, second) => first.start.localeCompare(second.start))
    .slice(0, MAX_CALENDAR_EVENTS);
};

const formatCalendarEvent = (start: string) => new Date(start).toLocaleDateString(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export function TripFitPanel({ isOpen, onClose, onSaved }: TripFitPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [homeCity, setHomeCity] = useState('');
  const [leaveDaysRemaining, setLeaveDaysRemaining] = useState('');
  const [budgetBand, setBudgetBand] = useState<TripFitBudgetBand>('comfortable');
  const [preferredMonth, setPreferredMonth] = useState('');
  const [holidayNotes, setHolidayNotes] = useState('');
  const [calendarEvents, setCalendarEvents] = useState<TripFitCalendarEvent[]>([]);
  const [isReadingCalendar, setIsReadingCalendar] = useState(false);
  const [calendarMessage, setCalendarMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const saved = loadTripFitContext();
    setHomeCity(saved.homeCity);
    setLeaveDaysRemaining(saved.leaveDaysRemaining === null ? '' : String(saved.leaveDaysRemaining));
    setBudgetBand(saved.budgetBand);
    setPreferredMonth(saved.preferredMonth);
    setHolidayNotes(saved.holidayNotes);
    setCalendarEvents(saved.calendarEvents);
    setCalendarMessage(saved.calendarEvents.length > 0
      ? `${saved.calendarEvents.length} saved calendar ${saved.calendarEvents.length === 1 ? 'event' : 'events'} ready.`
      : '');
    setError('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCalendarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsReadingCalendar(true);
    setCalendarMessage('');
    setError('');

    try {
      const parsedEvents = parseIcsEvents(await file.text());
      if (parsedEvents.length === 0) {
        throw new Error('No calendar events with both a start date and title were found in this ICS file.');
      }
      setCalendarEvents(parsedEvents);
      setCalendarMessage(
        `${parsedEvents.length} ${parsedEvents.length === 1 ? 'event' : 'events'} loaded locally from ${file.name}.`,
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'This calendar file could not be read.');
    } finally {
      setIsReadingCalendar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    const parsedLeaveDays = leaveDaysRemaining.trim() === '' ? null : Number(leaveDaysRemaining);
    if (parsedLeaveDays !== null
      && (!Number.isFinite(parsedLeaveDays) || parsedLeaveDays < 0 || parsedLeaveDays > 365)) {
      setError('Leave days must be a number between 0 and 365.');
      return;
    }

    const context: TripFitContext = {
      homeCity: homeCity.trim(),
      leaveDaysRemaining: parsedLeaveDays,
      budgetBand,
      preferredMonth,
      holidayNotes: holidayNotes.trim(),
      calendarEvents: calendarEvents.slice(0, MAX_CALENDAR_EVENTS),
      updatedAt: Date.now(),
    };

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
      onSaved?.(context);
      onClose();
    } catch (storageError) {
      console.error('Trip Fit context could not be saved.', storageError);
      setError('Your browser could not save this planning context.');
    }
  };

  return (
    <div className="modal-overlay trip-fit-overlay" onClick={onClose}>
      <section
        className="glass-panel side-panel slide-in-right trip-fit-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="trip-fit-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="trip-fit-header">
          <div>
            <span className="trip-fit-kicker">Nexus planning context · Live</span>
            <h2 id="trip-fit-title">Trip Fit</h2>
            <p>Give Nexus the practical constraints that make a recommendation usable.</p>
          </div>
          <button type="button" className="glass-btn trip-fit-close" onClick={onClose} aria-label="Close Trip Fit">
            <X size={18} />
          </button>
        </header>

        <div className="trip-fit-content">
          {error && <div className="trip-fit-error" role="alert">{error}</div>}

          <section className="trip-fit-section">
            <div className="trip-fit-section-heading">
              <MapPin size={17} aria-hidden="true" />
              <div>
                <strong>Starting point</strong>
                <span>Manual context · Live</span>
              </div>
            </div>
            <label className="trip-fit-field" htmlFor="trip-fit-home-city">
              <span>Home city</span>
              <input
                id="trip-fit-home-city"
                className="glass-input"
                value={homeCity}
                onChange={(event) => setHomeCity(event.target.value)}
                placeholder="Bengaluru, India"
                autoComplete="address-level2"
              />
            </label>

            <div className="trip-fit-field-grid">
              <label className="trip-fit-field" htmlFor="trip-fit-leave-days">
                <span>Leave days remaining</span>
                <input
                  id="trip-fit-leave-days"
                  className="glass-input"
                  type="number"
                  min="0"
                  max="365"
                  step="0.5"
                  value={leaveDaysRemaining}
                  onChange={(event) => setLeaveDaysRemaining(event.target.value)}
                  placeholder="12"
                />
              </label>
              <label className="trip-fit-field" htmlFor="trip-fit-month">
                <span>Preferred month</span>
                <input
                  id="trip-fit-month"
                  className="glass-input"
                  type="month"
                  value={preferredMonth}
                  onChange={(event) => setPreferredMonth(event.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="trip-fit-section">
            <div className="trip-fit-section-heading">
              <Wallet size={17} aria-hidden="true" />
              <div>
                <strong>Budget fit</strong>
                <span>Choose the recommendation style, not an exact price.</span>
              </div>
            </div>
            <div className="trip-fit-budget" role="radiogroup" aria-label="Budget band">
              {BUDGET_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={budgetBand === option.value}
                  className={`trip-fit-budget-option ${budgetBand === option.value ? 'is-selected' : ''}`}
                  onClick={() => setBudgetBand(option.value)}
                >
                  <strong>{option.label}</strong>
                  <span>{option.note}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="trip-fit-section">
            <div className="trip-fit-section-heading">
              <Building2 size={17} aria-hidden="true" />
              <div>
                <strong>Office and public holidays</strong>
                <span>Manual context · Live</span>
              </div>
            </div>
            <label className="trip-fit-field" htmlFor="trip-fit-holiday-notes">
              <span>Notes Nexus should respect</span>
              <textarea
                id="trip-fit-holiday-notes"
                className="glass-input trip-fit-notes"
                value={holidayNotes}
                onChange={(event) => setHolidayNotes(event.target.value)}
                placeholder="Company shutdown Dec 24–Jan 1; Karnataka public holidays; avoid quarter-end week."
                rows={4}
              />
            </label>
          </section>

          <section className="trip-fit-section">
            <div className="trip-fit-section-heading">
              <CalendarDays size={17} aria-hidden="true" />
              <div>
                <strong>Calendar availability</strong>
                <span>Local ICS import · Live</span>
              </div>
            </div>

            <input
              ref={fileInputRef}
              className="trip-fit-file-input"
              type="file"
              accept=".ics,text/calendar"
              onChange={handleCalendarUpload}
              aria-label="Upload an ICS calendar file"
            />
            <button
              type="button"
              className="glass-btn trip-fit-upload"
              onClick={() => fileInputRef.current?.click()}
              disabled={isReadingCalendar}
            >
              {isReadingCalendar ? (
                <>
                  <CalendarDays size={16} className="animate-spin" /> Reading calendar…
                </>
              ) : (
                <>
                  <Upload size={16} /> Upload .ics file
                </>
              )}
            </button>
            <p className="trip-fit-local-note">
              Parsed in this browser. No Google or Microsoft account credentials are requested.
            </p>

            {calendarMessage && (
              <div className="trip-fit-calendar-message" role="status">
                <CheckCircle2 size={15} aria-hidden="true" /> {calendarMessage}
              </div>
            )}

            {calendarEvents.length > 0 && (
              <div className="trip-fit-event-preview">
                {calendarEvents.slice(0, 5).map((calendarEvent, index) => (
                  <div className="trip-fit-event" key={`${calendarEvent.start}_${calendarEvent.summary}_${index}`}>
                    <time dateTime={calendarEvent.start}>{formatCalendarEvent(calendarEvent.start)}</time>
                    <span>{calendarEvent.summary}</span>
                  </div>
                ))}
                {calendarEvents.length > 5 && (
                  <span className="trip-fit-event-more">+{calendarEvents.length - 5} more saved events</span>
                )}
              </div>
            )}
          </section>

          <section className="trip-fit-section trip-fit-connectors" aria-label="Calendar connector roadmap">
            <div className="trip-fit-section-heading">
              <Cloud size={17} aria-hidden="true" />
              <div>
                <strong>Google and Outlook account sync</strong>
                <span className="trip-fit-roadmap-label">Roadmap</span>
              </div>
            </div>
            <p>Account-connected calendar sync is planned and is not active in this version.</p>
            <div className="trip-fit-connector-actions">
              <button type="button" className="glass-btn" disabled>Google Calendar · Roadmap</button>
              <button type="button" className="glass-btn" disabled>Outlook Calendar · Roadmap</button>
            </div>
          </section>
        </div>

        <footer className="trip-fit-footer">
          <button type="button" className="glass-btn" onClick={onClose}>Cancel</button>
          <button type="button" className="glass-btn glass-btn-primary" onClick={handleSave}>
            <Save size={16} /> Save planning context
          </button>
        </footer>
      </section>
    </div>
  );
}
