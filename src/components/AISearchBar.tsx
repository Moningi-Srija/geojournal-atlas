import React, { useState } from 'react';
import { Search, Sparkles, Loader2, X } from 'lucide-react';
import type { JournalEntry } from '../types';

interface AISearchBarProps {
  entries: JournalEntry[];
  onSearchComplete: (matchingIds: string[] | null) => void;
}

export const AISearchBar: React.FC<AISearchBarProps> = ({ entries, onSearchComplete }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isSearching) return;

    setIsSearching(true);
    setIsActive(true);
    setFeedbackMsg(null);

    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) throw new Error("API Key missing");

      // Build context of pins with their IDs
      const pinsContext = entries.map(e =>
        `ID: ${e.id} | Location: ${e.locationName || e.title} | Notes: ${e.body}`
      ).join('\n');

      const systemPrompt = `You are a semantic search engine for a travel app.
The user will provide a search query. You must find all pins that match the query semantically.
Return ONLY a comma-separated list of the matching IDs. If no pins match, return "NONE".

USER PINS:
${pinsContext}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-5-nano',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query }
          ],
          reasoning_effort: 'minimal',
          max_completion_tokens: 256,
        })
      });

      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      const reply = data.choices[0].message.content.trim();

      if (reply === 'NONE') {
        onSearchComplete([]);
        setFeedbackMsg("No memories found. Open the ✨ AI Copilot for travel recommendations!");
      } else {
        const validIds = new Set(entries.map((entry) => entry.id));
        const matchingIds = reply
          .split(',')
          .map((id: string) => id.trim())
          .filter((id: string) => validIds.has(id));
        onSearchComplete(matchingIds);
        setFeedbackMsg(matchingIds.length > 0
          ? `${matchingIds.length} ${matchingIds.length === 1 ? 'memory' : 'memories'} brought into focus.`
          : 'No matching memories found.');
      }
    } catch (err) {
      console.error("AI Search Error:", err);
      // Presentation-safe semantic fallback for common travel intents.
      const lowerQuery = query.toLowerCase();
      const intentGroups = [
        ['coffee', 'cafe', 'café', 'latte', 'espresso'],
        ['hike', 'hiking', 'trek', 'trail', 'mountain', 'summit'],
        ['beach', 'coast', 'coastal', 'ocean', 'sea', 'shore'],
        ['city', 'urban', 'architecture', 'building', 'skyline', 'street'],
      ];
      const queryTokens = lowerQuery
        .split(/\s+/)
        .map((token) => token.replace(/[^a-zà-ÿ]/g, ''))
        .filter((token) => token.length > 2);
      const searchTerms = new Set<string>(queryTokens);
      intentGroups.forEach((group) => {
        if (group.some((term) => lowerQuery.includes(term))) {
          group.forEach((term) => searchTerms.add(term));
        }
      });
      if (searchTerms.size === 0) searchTerms.add(lowerQuery);

      const fallbackIds = entries
        .filter((entry) => {
          const haystack = `${entry.title} ${entry.body} ${entry.locationName} ${entry.category || ''}`.toLowerCase();
          return Array.from(searchTerms).some((term) => haystack.includes(term));
        })
        .map(e => e.id);
      onSearchComplete(fallbackIds);
      setFeedbackMsg(fallbackIds.length > 0
        ? `Offline index · ${fallbackIds.length} semantic ${fallbackIds.length === 1 ? 'match' : 'matches'} found.`
        : 'Offline index · no matching memories found.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setIsActive(false);
    setFeedbackMsg(null);
    onSearchComplete(null);
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (feedbackMsg || isActive) {
      setFeedbackMsg(null);
      setIsActive(false);
      onSearchComplete(null);
    }
  };

  const feedbackIsEmpty = Boolean(
    feedbackMsg && (
      feedbackMsg.toLowerCase().includes('no memories') ||
      feedbackMsg.toLowerCase().includes('no matching')
    )
  );

  return (
    <div className="atlas-search">
      <form
        onSubmit={handleSearch}
        role="search"
        aria-label="Search memories with AI"
        className={`atlas-search-form${isActive ? ' is-active' : ''}`}
      >
        <Sparkles className="atlas-search-spark" size={20} aria-hidden="true" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          disabled={entries.length === 0}
          aria-label="Describe the memory you want to find"
          placeholder={entries.length === 0 ? 'Add a memory to unlock Atlas search' : "Ask AI to find a memory... (e.g. 'beaches in Asia')"}
          className="atlas-search-input"
        />
        {isSearching ? (
          <Loader2 size={20} className="animate-spin atlas-search-loader" aria-label="Searching memories" />
        ) : query ? (
          <>
            <button type="button" aria-label="Clear AI search" onClick={handleClear} className="atlas-search-clear">
              <X size={18} aria-hidden="true" />
            </button>
            <button type="submit" aria-label="Search memories" className="atlas-search-submit">
              <Search size={15} aria-hidden="true" />
            </button>
          </>
        ) : (
          <Search size={20} className="atlas-search-placeholder-icon" aria-hidden="true" />
        )}
      </form>
      {feedbackMsg && (
        <div aria-live="polite" role="status" className="atlas-search-feedback">
          <div className={`atlas-search-feedback-message${feedbackIsEmpty ? ' is-empty' : ''}`}>
            {feedbackMsg}
          </div>
        </div>
      )}
    </div>
  );
};
