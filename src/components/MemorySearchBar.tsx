import { useMemo, useState, type FormEvent } from 'react';
import { Search, X } from 'lucide-react';
import type { JournalEntry } from '../types';

interface MemorySearchBarProps {
  entries: JournalEntry[];
  onSearchComplete: (matchingIds: string[] | null) => void;
}

const INTENT_GROUPS = [
  ['coffee', 'cafe', 'latte', 'espresso', 'bakery'],
  ['hike', 'hiking', 'trek', 'trail', 'mountain', 'summit'],
  ['beach', 'coast', 'coastal', 'ocean', 'sea', 'shore'],
  ['city', 'urban', 'architecture', 'building', 'skyline', 'street'],
  ['food', 'meal', 'restaurant', 'market', 'dinner', 'lunch'],
  ['quiet', 'peaceful', 'calm', 'slow', 'relaxing'],
  ['culture', 'heritage', 'historic', 'temple', 'museum', 'art'],
] as const;

const normalize = (value: string) => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

const buildSearchTerms = (query: string) => {
  const normalizedQuery = normalize(query);
  const tokens = normalizedQuery
    .split(/\s+/)
    .map((token) => token.replace(/[^a-z0-9-]/g, ''))
    .filter((token) => token.length > 2);
  const terms = new Set(tokens);

  INTENT_GROUPS.forEach((group) => {
    if (group.some((term) => normalizedQuery.includes(term))) {
      group.forEach((term) => terms.add(term));
    }
  });

  return [...terms];
};

export function MemorySearchBar({ entries, onSearchComplete }: MemorySearchBarProps) {
  const [query, setQuery] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const searchTerms = useMemo(() => buildSearchTerms(query), [query]);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      onSearchComplete(null);
      setIsActive(false);
      setMatchCount(null);
      return;
    }

    const phrase = normalize(trimmedQuery);
    const matches = entries
      .map((entry) => {
        const title = normalize(entry.title);
        const location = normalize(entry.locationName);
        const country = normalize(entry.country || '');
        const body = normalize(entry.body);
        const category = normalize(entry.category || '');
        const haystack = `${title} ${location} ${country} ${body} ${category}`;
        const termMatches = searchTerms.filter((term) => haystack.includes(term)).length;
        const score = (title.includes(phrase) ? 8 : 0)
          + (location.includes(phrase) || country.includes(phrase) ? 6 : 0)
          + (body.includes(phrase) ? 4 : 0)
          + termMatches;

        return { id: entry.id, score };
      })
      .filter((candidate) => candidate.score > 0)
      .sort((first, second) => second.score - first.score)
      .map((candidate) => candidate.id);

    onSearchComplete(matches);
    setIsActive(true);
    setMatchCount(matches.length);
  };

  const clearSearch = () => {
    setQuery('');
    setIsActive(false);
    setMatchCount(null);
    onSearchComplete(null);
  };

  const updateQuery = (value: string) => {
    setQuery(value);
    if (isActive || matchCount !== null) {
      setIsActive(false);
      setMatchCount(null);
      onSearchComplete(null);
    }
  };

  return (
    <div className="atlas-search">
      <form
        onSubmit={handleSearch}
        role="search"
        aria-label="Search Atlas memories"
        className={`atlas-search-form${isActive ? ' is-active' : ''}`}
      >
        <Search className="atlas-search-spark" size={20} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => updateQuery(event.target.value)}
          disabled={entries.length === 0}
          aria-label="Search by place, story, or activity"
          placeholder={entries.length === 0
            ? 'Add a memory to unlock Atlas search'
            : "Search places and stories… (e.g. 'quiet beaches')"}
          className="atlas-search-input"
        />
        {query ? (
          <>
            <button type="button" aria-label="Clear memory search" onClick={clearSearch} className="atlas-search-clear">
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

      {matchCount !== null && (
        <div aria-live="polite" role="status" className="atlas-search-feedback">
          <div className={`atlas-search-feedback-message${matchCount === 0 ? ' is-empty' : ''}`}>
            {matchCount === 0
              ? 'No matching memories yet. Try a place, activity, or word from your journal.'
              : `${matchCount} ${matchCount === 1 ? 'memory' : 'memories'} brought into focus.`}
          </div>
        </div>
      )}
    </div>
  );
}
