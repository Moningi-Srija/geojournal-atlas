import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Play, Sparkles, X } from 'lucide-react';

interface DemoTourProps {
  onStepChange?: (stepIndex: number) => void;
}

interface TourStep {
  target: string;
  eyebrow: string;
  title: string;
  body: string;
}

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TooltipPosition {
  top: number;
  left: number;
}

const TOUR_SEEN_KEY = 'geojournal_demo_tour_seen';
const CARD_WIDTH = 360;
const CARD_HEIGHT_ESTIMATE = 258;
const EDGE_GAP = 12;
const TARGET_GAP = 16;

const TOUR_STEPS: TourStep[] = [
  {
    target: 'atlas-board',
    eyebrow: 'Your living Atlas',
    title: 'See the story behind the pins',
    body: 'This board keeps ownership clear: teal pins are yours, violet pins belong to your Explorer Circle.',
  },
  {
    target: 'scope-switcher',
    eyebrow: 'One globe, two views',
    title: 'Switch between Circle and Mine',
    body: 'Circle brings trusted friends onto your world. Mine instantly returns to only your personal memories.',
  },
  {
    target: 'memory-search',
    eyebrow: 'Places, stories, activities',
    title: 'Find any memory quickly',
    body: 'Try a phrase such as “quiet beaches” or “great coffee” and Atlas focuses matching journal moments locally.',
  },
  {
    target: 'memories-rediscover',
    eyebrow: 'Your travel journal',
    title: 'Remember, reflect, rediscover',
    body: 'Open Memories for your journal, country insights, and anniversary moments that resurface automatically.',
  },
  {
    target: 'sync-import',
    eyebrow: 'No empty-globe problem',
    title: 'Bring your travel history in',
    body: 'Sync reviews Google Location and geotagged Instagram exports before any suggested pin joins your Atlas.',
  },
  {
    target: 'add-memory',
    eyebrow: 'Capture the moment',
    title: 'Add a place in a few taps',
    body: 'Save the location, story, visibility, photos, and co-travelers behind a memory while it is still fresh.',
  },
];

const clamp = (value: number, minimum: number, maximum: number) => (
  Math.min(Math.max(value, minimum), maximum)
);

export function DemoTour({ onStepChange }: DemoTourProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [tooltip, setTooltip] = useState<TooltipPosition>({ top: 140, left: EDGE_GAP });
  const dialogRef = useRef<HTMLDivElement>(null);
  const onStepChangeRef = useRef(onStepChange);

  useEffect(() => {
    onStepChangeRef.current = onStepChange;
  }, [onStepChange]);

  const startTour = useCallback(() => {
    sessionStorage.setItem(TOUR_SEEN_KEY, 'true');
    setStepIndex(0);
    setIsOpen(true);
  }, []);

  const finishTour = useCallback(() => {
    sessionStorage.setItem(TOUR_SEEN_KEY, 'true');
    setIsOpen(false);
  }, []);

  useEffect(() => {
    const explicitStart = new URLSearchParams(window.location.search).get('tour') === '1';
    const alreadySeenThisSession = sessionStorage.getItem(TOUR_SEEN_KEY) === 'true';

    if (explicitStart || !alreadySeenThisSession) startTour();
  }, [startTour]);

  const measureStep = useCallback(() => {
    if (!isOpen) return;

    const selector = `[data-tour="${TOUR_STEPS[stepIndex].target}"]`;
    const target = document.querySelector<HTMLElement>(selector);
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const cardWidth = Math.min(CARD_WIDTH, viewportWidth - EDGE_GAP * 2);

    if (!target) {
      setSpotlight(null);
      setTooltip({
        top: clamp((viewportHeight - CARD_HEIGHT_ESTIMATE) / 2, EDGE_GAP, viewportHeight - CARD_HEIGHT_ESTIMATE - EDGE_GAP),
        left: (viewportWidth - cardWidth) / 2,
      });
      return;
    }

    const rect = target.getBoundingClientRect();
    const padding = viewportWidth <= 640 ? 6 : 9;
    const highlighted: SpotlightRect = {
      top: clamp(rect.top - padding, 4, viewportHeight - 8),
      left: clamp(rect.left - padding, 4, viewportWidth - 8),
      width: Math.min(rect.width + padding * 2, viewportWidth - 8),
      height: Math.min(rect.height + padding * 2, viewportHeight - 8),
    };

    setSpotlight(highlighted);

    const roomBelow = viewportHeight - highlighted.top - highlighted.height;
    const roomAbove = highlighted.top;
    const placeBelow = roomBelow >= CARD_HEIGHT_ESTIMATE + TARGET_GAP || roomBelow >= roomAbove;
    const top = placeBelow
      ? highlighted.top + highlighted.height + TARGET_GAP
      : highlighted.top - CARD_HEIGHT_ESTIMATE - TARGET_GAP;
    const left = highlighted.left + highlighted.width / 2 - cardWidth / 2;

    setTooltip({
      top: clamp(top, EDGE_GAP, viewportHeight - CARD_HEIGHT_ESTIMATE - EDGE_GAP),
      left: clamp(left, EDGE_GAP, viewportWidth - cardWidth - EDGE_GAP),
    });
  }, [isOpen, stepIndex]);

  useEffect(() => {
    if (!isOpen) return;

    onStepChangeRef.current?.(stepIndex);
    const frame = window.requestAnimationFrame(measureStep);
    const settleTimer = window.setTimeout(measureStep, 260);
    const handleViewportChange = () => measureStep();

    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(settleTimer);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [isOpen, measureStep, stepIndex]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') finishTour();
    };

    window.addEventListener('keydown', handleKeyDown);
    dialogRef.current?.focus({ preventScroll: true });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [finishTour, isOpen, stepIndex]);

  const currentStep = TOUR_STEPS[stepIndex];
  const isLastStep = stepIndex === TOUR_STEPS.length - 1;

  return (
    <>
      {!isOpen && (
        <button type="button" className="demo-tour-launch" onClick={startTour}>
          <Play size={13} fill="currentColor" aria-hidden="true" />
          <span>60-sec tour</span>
        </button>
      )}

      {isOpen && (
        <div className="demo-tour-layer" aria-live="polite">
          {spotlight && (
            <div
              className="demo-tour-spotlight"
              style={spotlight}
              aria-hidden="true"
            />
          )}

          <div
            ref={dialogRef}
            className="demo-tour-card"
            style={tooltip}
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-tour-title"
            tabIndex={-1}
          >
            <div className="demo-tour-card-topline">
              <span><Sparkles size={13} aria-hidden="true" /> {currentStep.eyebrow}</span>
              <button type="button" onClick={finishTour} aria-label="Close product tour" title="Close tour">
                <X size={15} />
              </button>
            </div>

            <div className="demo-tour-progress" aria-hidden="true">
              {TOUR_STEPS.map((step, index) => (
                <i key={step.target} className={index <= stepIndex ? 'is-active' : ''} />
              ))}
            </div>

            <span className="demo-tour-count">Step {stepIndex + 1} of {TOUR_STEPS.length}</span>
            <h2 id="demo-tour-title">{currentStep.title}</h2>
            <p>{currentStep.body}</p>

            <div className="demo-tour-actions">
              <button type="button" className="demo-tour-skip" onClick={finishTour}>Skip</button>
              <div>
                <button
                  type="button"
                  className="demo-tour-back"
                  onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
                  disabled={stepIndex === 0}
                >
                  <ChevronLeft size={14} /> Back
                </button>
                <button
                  type="button"
                  className="demo-tour-next"
                  onClick={() => {
                    if (isLastStep) finishTour();
                    else setStepIndex((current) => current + 1);
                  }}
                >
                  {isLastStep ? 'Done' : 'Next'}
                  {!isLastStep && <ChevronRight size={14} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
