import React, { useState } from 'react';
import { BadgeCheck, Check, Shield, Sparkles, Star, X } from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Plan = 'monthly' | 'annual';

const PLAN_DETAILS: Record<Plan, { name: string; price: string; cadence: string }> = {
  monthly: { name: 'Monthly', price: '$6', cadence: 'per month' },
  annual: { name: 'Annual', price: '$49', cadence: 'per year' },
};

const configuredUrl = (value: string | undefined) => value?.trim() || undefined;

// Dashboard-generated Dodo Test Mode links are reusable and contain no secret.
// Production can replace them through the existing VITE_DODO_* environment variables.
const PRESENTATION_CHECKOUTS: Record<Plan, string> = {
  monthly: 'https://test.checkout.dodopayments.com/buy/pdt_0NjRGqbG4p5KQwPbLFcuD?quantity=1',
  annual: 'https://test.checkout.dodopayments.com/buy/pdt_0NjRGwCE8YYCGPjMd1Pdl?quantity=1',
};

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose }) => {
  const [selectedPlan, setSelectedPlan] = useState<Plan>('annual');
  const [demoConfirmation, setDemoConfirmation] = useState<string | null>(null);
  const legacyCheckoutUrl = configuredUrl(import.meta.env.VITE_DODO_CHECKOUT_URL as string | undefined);
  const monthlyCheckoutUrl = configuredUrl(
    import.meta.env.VITE_DODO_MONTHLY_CHECKOUT_URL as string | undefined,
  ) ?? legacyCheckoutUrl ?? PRESENTATION_CHECKOUTS.monthly;
  const annualCheckoutUrl = configuredUrl(
    import.meta.env.VITE_DODO_ANNUAL_CHECKOUT_URL as string | undefined,
  ) ?? legacyCheckoutUrl ?? PRESENTATION_CHECKOUTS.annual;
  const checkoutUrl = selectedPlan === 'annual' ? annualCheckoutUrl : monthlyCheckoutUrl;
  const checkoutConfigured = Boolean(checkoutUrl);
  const isTestCheckout = checkoutUrl?.includes('test.checkout.dodopayments.com') ?? false;

  if (!isOpen) return null;

  const choosePlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setDemoConfirmation(null);
  };

  const closeModal = () => {
    setDemoConfirmation(null);
    onClose();
  };

  const handlePrimaryAction = () => {
    if (checkoutUrl) {
      // With noopener some browsers intentionally return null even when the tab
      // opened successfully, so never treat that value as a reason to replace
      // the Atlas page during a presentation.
      window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    setDemoConfirmation(
      `Presentation preview: ${PLAN_DETAILS[selectedPlan].name} Pro selected. Checkout is not configured, so no payment was collected.`,
    );
  };

  return (
    <div className="modal-overlay fade-in pro-modal-overlay" onClick={closeModal}>
      <section
        className="glass-panel slide-up pro-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="subscription-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={closeModal}
          aria-label="Close GeoJournal Pro"
          className="glass-btn pro-modal-close"
        >
          <X size={18} />
        </button>

        <header className="pro-modal-header">
          <span className="pro-modal-kicker">
            <Star size={14} fill="currentColor" /> GeoJournal Pro
          </span>
          <h2 id="subscription-title">Go further with your Atlas</h2>
          <p>
            One straightforward subscription for deeper memory search, personal trip planning,
            and a more expressive travel Atlas.
          </p>
        </header>

        <div className="pro-plan-grid" role="radiogroup" aria-label="Choose a GeoJournal Pro billing plan">
          <button
            type="button"
            role="radio"
            aria-checked={selectedPlan === 'monthly'}
            className={`pro-plan ${selectedPlan === 'monthly' ? 'is-selected' : ''}`}
            onClick={() => choosePlan('monthly')}
          >
            <span className="pro-plan-name">Monthly</span>
            <span className="pro-plan-price">
              <strong>{PLAN_DETAILS.monthly.price}</strong>
              <small>{PLAN_DETAILS.monthly.cadence}</small>
            </span>
            <span className="pro-plan-note">Flexible monthly billing</span>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={selectedPlan === 'annual'}
            className={`pro-plan is-recommended ${selectedPlan === 'annual' ? 'is-selected' : ''}`}
            onClick={() => choosePlan('annual')}
          >
            <span className="pro-plan-badge">Recommended</span>
            <span className="pro-plan-name">Annual</span>
            <span className="pro-plan-price">
              <strong>{PLAN_DETAILS.annual.price}</strong>
              <small>{PLAN_DETAILS.annual.cadence}</small>
            </span>
            <span className="pro-plan-note">Save 32% compared with monthly</span>
          </button>
        </div>

        <section className="pro-benefits" aria-labelledby="pro-benefits-title">
          <div className="pro-benefits-heading">
            <Sparkles size={17} aria-hidden="true" />
            <div>
              <h3 id="pro-benefits-title">Planned Pro benefits on either plan</h3>
              <p>No credits, no lifetime tier, and no confusing add-ons.</p>
            </div>
          </div>
          <div className="pro-benefit-grid">
            <PlanFeature>Nexus AI planning grounded in your Atlas, subject to fair-use limits</PlanFeature>
            <PlanFeature>Semantic memory search and richer planning context</PlanFeature>
            <PlanFeature>Advanced Atlas insights and passport personalization</PlanFeature>
            <PlanFeature>Priority import tools and expanded memory media</PlanFeature>
          </div>
        </section>

        <button type="button" onClick={handlePrimaryAction} className="pro-primary-action">
          {checkoutConfigured
            ? `${isTestCheckout ? 'Try' : 'Continue with'} ${PLAN_DETAILS[selectedPlan].name}`
            : `Preview ${PLAN_DETAILS[selectedPlan].name} selection`}
          <Sparkles size={17} aria-hidden="true" />
        </button>

        {demoConfirmation && (
          <div role="status" aria-live="polite" className="fade-in pro-demo-confirmation">
            <BadgeCheck size={17} aria-hidden="true" />
            <span>{demoConfirmation}</span>
          </div>
        )}

        <div className={`pro-checkout-status ${checkoutConfigured ? 'is-live' : 'is-sandbox'}`}>
          <Shield size={14} aria-hidden="true" />
          {checkoutConfigured ? (
            <span>
              {isTestCheckout
                ? 'Dodo-hosted Test Mode checkout · no real charge or account upgrade.'
                : 'Secure checkout by Dodo opens in a new tab.'}
            </span>
          ) : (
            <span>Presentation sandbox — Dodo checkout is not configured and no payment will be collected.</span>
          )}
        </div>
      </section>
    </div>
  );
};

const PlanFeature = ({ children }: { children: React.ReactNode }) => (
  <span className="pro-benefit">
    <Check size={14} aria-hidden="true" />
    {children}
  </span>
);
