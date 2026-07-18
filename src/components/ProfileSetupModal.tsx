import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Compass, Loader2, Sparkles } from 'lucide-react';
import type { UserProfile } from '../types';
import { useAuth } from './AuthContext';

interface ProfileSetupModalProps {
  profile: UserProfile;
  onComplete: () => void;
}

interface AvatarChoice {
  name: string;
  url: string;
}

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

const AVATAR_CHOICES: AvatarChoice[] = [
  'Mira',
  'Atlas',
  'Sage',
  'Rio',
  'June',
  'Kai',
  'Nova',
  'Leo',
].map((name) => ({
  name,
  url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
}));

const isValidCustomAvatarUrl = (value: string) => {
  if (!value) return true;

  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

export const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({ profile, onComplete }) => {
  const { updateProfile } = useAuth();
  const profileUsesPreset = AVATAR_CHOICES.some((choice) => choice.url === profile.photoURL);

  const [step, setStep] = useState<1 | 2>(1);
  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [username, setUsername] = useState(
    profile.username?.startsWith('user_') ? '' : (profile.username || ''),
  );
  const [selectedAvatar, setSelectedAvatar] = useState(
    profileUsesPreset ? profile.photoURL : AVATAR_CHOICES[0].url,
  );
  const [customAvatarUrl, setCustomAvatarUrl] = useState(
    profile.photoURL && !profileUsesPreset ? profile.photoURL : '',
  );
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const validateIdentity = () => {
    if (!displayName.trim()) return 'Enter the name you would like other explorers to see.';
    if (!USERNAME_PATTERN.test(username)) {
      return 'Username must be 3–20 characters using lowercase letters, numbers, or underscores.';
    }
    return '';
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20));
    if (error) setError('');
  };

  const handleIdentitySubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextError = validateIdentity();
    if (nextError) {
      setError(nextError);
      return;
    }

    setError('');
    setStep(2);
  };

  const chooseAvatar = (url: string) => {
    setSelectedAvatar(url);
    setCustomAvatarUrl('');
    setError('');
  };

  const handleCustomAvatarChange = (value: string) => {
    setCustomAvatarUrl(value);
    if (error) setError('');
  };

  const handleSave = async () => {
    const identityError = validateIdentity();
    if (identityError) {
      setError(identityError);
      setStep(1);
      return;
    }

    const customUrl = customAvatarUrl.trim();
    if (!isValidCustomAvatarUrl(customUrl)) {
      setError('Enter a complete image URL beginning with http:// or https://.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await updateProfile({
        displayName: displayName.trim(),
        username,
        photoURL: customUrl || selectedAvatar,
        onboardingCompleted: true,
      });
      onComplete();
    } catch (caught) {
      console.error('Profile setup failed:', caught);
      setError('We could not save your explorer profile. Check your connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const avatarPreview = customAvatarUrl.trim() || selectedAvatar;

  return (
    <div className="profile-setup-overlay">
      <section
        className="profile-setup-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-setup-title"
        aria-describedby="profile-setup-description"
      >
        <header className="profile-setup-header">
          <div className="profile-setup-brand" aria-label="GeoJournal">
            <Compass size={18} aria-hidden="true" />
            <span>GeoJournal</span>
          </div>

          <div className="profile-setup-progress" aria-label={`Profile setup step ${step} of 2`}>
            <div
              className={`profile-setup-progress-step ${
                step === 1 ? 'profile-setup-progress-active' : 'profile-setup-progress-complete'
              }`}
            >
              <span className="profile-setup-progress-number">
                {step > 1 ? <Check size={13} aria-hidden="true" /> : '1'}
              </span>
              <span>Identity</span>
            </div>
            <span className="profile-setup-progress-line" aria-hidden="true" />
            <div
              className={`profile-setup-progress-step ${
                step === 2 ? 'profile-setup-progress-active' : 'profile-setup-progress-pending'
              }`}
            >
              <span className="profile-setup-progress-number">2</span>
              <span>Avatar</span>
            </div>
          </div>
        </header>

        <div className="profile-setup-body">
          {step === 1 ? (
            <form className="profile-setup-form" onSubmit={handleIdentitySubmit}>
              <div className="profile-setup-intro">
                <span className="profile-setup-eyebrow">
                  <Sparkles size={14} aria-hidden="true" />
                  Make the Atlas yours
                </span>
                <h1 id="profile-setup-title">How should we know you?</h1>
                <p id="profile-setup-description">
                  Your name and unique username appear on memories you choose to share.
                </p>
              </div>

              <div className="profile-setup-fields">
                <label className="profile-setup-field" htmlFor="profile-setup-display-name">
                  <span className="profile-setup-label">Display name</span>
                  <input
                    id="profile-setup-display-name"
                    className="profile-setup-input"
                    type="text"
                    value={displayName}
                    onChange={(event) => {
                      setDisplayName(event.target.value.slice(0, 60));
                      if (error) setError('');
                    }}
                    placeholder="Your name"
                    autoComplete="name"
                    maxLength={60}
                    autoFocus
                    required
                  />
                </label>

                <label className="profile-setup-field" htmlFor="profile-setup-username">
                  <span className="profile-setup-label-row">
                    <span className="profile-setup-label">Username</span>
                    <span className="profile-setup-character-count">{username.length}/20</span>
                  </span>
                  <div className="profile-setup-username-control">
                    <span className="profile-setup-username-prefix" aria-hidden="true">@</span>
                    <input
                      id="profile-setup-username"
                      className="profile-setup-input profile-setup-username-input"
                      type="text"
                      value={username}
                      onChange={(event) => handleUsernameChange(event.target.value)}
                      placeholder="your_username"
                      autoComplete="username"
                      minLength={3}
                      maxLength={20}
                      pattern="[a-z0-9_]{3,20}"
                      aria-describedby="profile-setup-username-help"
                      required
                    />
                  </div>
                  <span id="profile-setup-username-help" className="profile-setup-help">
                    3–20 characters · lowercase letters, numbers, and underscores
                  </span>
                </label>
              </div>

              <div className="profile-setup-account-note">
                Setting up the private Atlas for <strong>{profile.email}</strong>
              </div>

              {error && (
                <div className="profile-setup-error" role="alert">
                  {error}
                </div>
              )}

              <button className="profile-setup-primary-action" type="submit">
                Choose an avatar <ArrowRight size={17} aria-hidden="true" />
              </button>
            </form>
          ) : (
            <div className="profile-setup-avatar-step">
              <div className="profile-setup-intro">
                <span className="profile-setup-eyebrow">
                  <Sparkles size={14} aria-hidden="true" />
                  Your explorer portrait
                </span>
                <h1 id="profile-setup-title">Choose your place on the map.</h1>
                <p id="profile-setup-description">
                  Pick an illustrated avatar or use a photograph that feels like you.
                </p>
              </div>

              <div className="profile-setup-avatar-layout">
                <div className="profile-setup-avatar-preview">
                  <img src={avatarPreview} alt="Selected profile avatar preview" />
                  <div className="profile-setup-avatar-preview-copy">
                    <strong>{displayName.trim()}</strong>
                    <span>@{username}</span>
                  </div>
                </div>

                <div className="profile-setup-avatar-grid" aria-label="Choose an illustrated avatar">
                  {AVATAR_CHOICES.map((choice) => {
                    const isSelected = !customAvatarUrl.trim() && selectedAvatar === choice.url;
                    return (
                      <button
                        key={choice.name}
                        className={`profile-setup-avatar-option ${
                          isSelected ? 'profile-setup-avatar-selected' : ''
                        }`}
                        type="button"
                        onClick={() => chooseAvatar(choice.url)}
                        aria-label={`Choose ${choice.name} avatar`}
                        aria-pressed={isSelected}
                      >
                        <img src={choice.url} alt="" />
                        {isSelected && (
                          <span className="profile-setup-avatar-check" aria-hidden="true">
                            <Check size={13} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="profile-setup-field" htmlFor="profile-setup-custom-avatar">
                <span className="profile-setup-label">Or use a custom image URL</span>
                <input
                  id="profile-setup-custom-avatar"
                  className="profile-setup-input"
                  type="url"
                  value={customAvatarUrl}
                  onChange={(event) => handleCustomAvatarChange(event.target.value)}
                  placeholder="https://example.com/your-photo.jpg"
                  inputMode="url"
                  autoComplete="url"
                />
              </label>

              {error && (
                <div className="profile-setup-error" role="alert">
                  {error}
                </div>
              )}

              <div className="profile-setup-actions">
                <button
                  className="profile-setup-secondary-action"
                  type="button"
                  onClick={() => {
                    setError('');
                    setStep(1);
                  }}
                  disabled={isSaving}
                >
                  <ArrowLeft size={17} aria-hidden="true" /> Back
                </button>
                <button
                  className="profile-setup-primary-action"
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="profile-setup-loader" size={17} aria-hidden="true" />
                      Saving your Atlas…
                    </>
                  ) : (
                    <>
                      Enter GeoJournal <ArrowRight size={17} aria-hidden="true" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
