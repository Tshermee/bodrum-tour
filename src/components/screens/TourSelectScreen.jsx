import { useState, useMemo } from 'react'
import { ChevronRight, Clock, MapPin, Star, Trophy, CheckCircle2, Play, Compass, LogOut, Lock, Baby } from 'lucide-react'
import MapView from '../ui/MapView'
import PurchaseModal from '../ui/PurchaseModal'

// ── Constants ─────────────────────────────────────────────────────────────────

const DURATION_FILTERS = [
  { id: 'all', label: 'All lengths' },
  { id: 'quick', label: 'Under 1.5h' },
  { id: 'half', label: '1.5 – 3h' },
  { id: 'full', label: '3h+' },
]

const INTEREST_FILTERS = [
  { id: 'history', label: '🏛️ History' },
  { id: 'food', label: '🍽️ Food' },
  { id: 'photography', label: '📸 Photo' },
  { id: 'nature', label: '🌿 Nature' },
  { id: 'active', label: '🏃 Active' },
  { id: 'culture', label: '🏺 Culture' },
  { id: 'scenic', label: '🏔️ Scenic' },
  { id: 'architecture', label: '🏗️ Archit.' },
]

const DIFFICULTY_STYLE = {
  easy: { label: 'Easy', color: '#4ade80', dots: 1 },
  moderate: { label: 'Moderate', color: '#fbbf24', dots: 2 },
  challenging: { label: 'Challenging', color: '#f87171', dots: 3 },
}

// ── FilterPill ────────────────────────────────────────────────────────────────

function FilterPill({ label, active, accent, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all active:scale-95 whitespace-nowrap"
      style={
        active
          ? {
              background: accent ?? 'rgba(34,211,238,0.2)',
              border: `1px solid ${accent ?? '#22d3ee'}`,
              color: '#fff',
              boxShadow: `0 0 10px ${accent ?? '#22d3ee'}44`,
            }
          : {
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.5)',
            }
      }
    >
      {label}
    </button>
  )
}

// ── FilterRow ─────────────────────────────────────────────────────────────────

function FilterRow({ label, children }) {
  return (
    <div className="mb-3">
      <div className="text-white/30 text-xs font-semibold tracking-widest uppercase mb-2 px-4">
        {label}
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-1">
        {children}
      </div>
    </div>
  )
}

// ── TourCard ──────────────────────────────────────────────────────────────────

function TourCard({ tour, progress, isPurchased, onSelect, onBuy }) {
  const diff = DIFFICULTY_STYLE[tour.difficulty] ?? DIFFICULTY_STYLE.easy
  const completedStops = progress
    ? Object.values(progress.missions).filter(m => m.status === 'completed').length
    : 0

  const isCompleted = progress?.completedAt != null
  const isStarted = progress != null && !isCompleted
  const canAccess = isPurchased || progress != null

  const handleTap = () => {
    if (canAccess) {
      onSelect(tour.id)
    } else {
      onBuy(tour)
    }
  }

  return (
    <button
      onClick={handleTap}
      className="w-full text-left rounded-2xl overflow-hidden active:scale-[0.98] transition-transform"
      style={{ border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Map preview */}
      <div style={{ height: 150, position: 'relative' }}>
        <MapView
          missions={tour.missions}
          missionProgress={progress?.missions}
          height={150}
          interactive={false}
          accentColor={tour.accentColor}
        />
        {/* Price badge overlay */}
        <div
          className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1"
          style={{
            background: canAccess
              ? 'rgba(34,197,94,0.85)'
              : 'rgba(0,0,0,0.75)',
            color: '#fff',
            backdropFilter: 'blur(6px)',
            border: canAccess
              ? '1px solid rgba(34,197,94,0.5)'
              : '1px solid rgba(255,255,255,0.15)',
          }}
        >
          {canAccess ? (
            <><CheckCircle2 className="w-3 h-3" /> Unlocked</>
          ) : (
            <><Lock className="w-3 h-3" /> €{tour.price}</>
          )}
        </div>
        {/* Kid-friendly badge */}
        {tour.kidFriendly && (
          <div
            className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1"
            style={{
              background: 'rgba(251,191,36,0.85)',
              color: '#000',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(251,191,36,0.4)',
            }}
          >
            <Baby className="w-3 h-3" /> Kids
          </div>
        )}
      </div>

      {/* Card gradient body */}
      <div
        className="relative p-4"
        style={{
          background: `linear-gradient(135deg, ${tour.gradient[0]}, ${tour.gradient[1]})`,
        }}
      >
        {/* Top row: emoji + title + status badge */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            {tour.coverEmoji}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h3 className="text-white font-bold text-base leading-tight">{tour.title}</h3>
              {isCompleted && (
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 flex items-center gap-1"
                  style={{ background: 'rgba(34,197,94,0.2)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}
                >
                  <CheckCircle2 className="w-3 h-3" /> Done
                </span>
              )}
            </div>
            <p className="text-white/60 text-sm leading-snug">{tour.tagline}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-white/40" />
            <span className="text-white/60 text-xs">{tour.stops} stops</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-white/40" />
            <span className="text-white/60 text-xs">{tour.durationLabel}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-white/40" />
            <span className="text-white/60 text-xs">{tour.totalPossibleScore} pts</span>
          </div>
          {/* Difficulty dots */}
          <div className="flex items-center gap-1 ml-auto">
            {[1, 2, 3].map(d => (
              <div
                key={d}
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: d <= diff.dots ? diff.color : 'rgba(255,255,255,0.15)',
                }}
              />
            ))}
            <span className="text-xs ml-1" style={{ color: diff.color }}>{diff.label}</span>
          </div>
        </div>

        {/* Progress bar (if started) */}
        {isStarted && (
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-white/40 text-xs">{completedStops} / {tour.stops} stops</span>
              <span className="text-xs font-semibold" style={{ color: tour.accentColor }}>
                {progress.totalScore} pts
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.round((completedStops / tour.stops) * 100)}%`,
                  background: `linear-gradient(90deg, ${tour.accentColor}cc, ${tour.accentColor})`,
                }}
              />
            </div>
          </div>
        )}

        {/* Completed score */}
        {isCompleted && (
          <div
            className="mb-3 flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-white/70 text-sm">Completed with </span>
            <span className="text-amber-400 font-bold">{progress.totalScore} pts</span>
          </div>
        )}

        {/* Tags + CTA row */}
        <div className="flex items-center justify-between gap-3">
          {/* Tags */}
          <div className="flex gap-1.5 flex-wrap flex-1">
            {tour.tags.slice(0, 3).map(tag => {
              const fi = INTEREST_FILTERS.find(f => f.id === tag)
              return fi ? (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: `${tour.accentColor}18`,
                    color: tour.accentColor,
                    border: `1px solid ${tour.accentColor}33`,
                  }}
                >
                  {fi.label}
                </span>
              ) : null
            })}
          </div>

          {/* CTA button */}
          <div
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl flex-shrink-0 font-semibold text-sm"
            style={
              !canAccess
                ? {
                    background: 'rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.9)',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }
                : isCompleted
                ? {
                    background: 'rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.7)',
                  }
                : {
                    background: `linear-gradient(135deg, ${tour.accentColor}dd, ${tour.accentColor})`,
                    color: tour.gradient[0],
                    boxShadow: `0 2px 12px ${tour.accentColor}44`,
                  }
            }
          >
            {!canAccess ? (
              <><Lock className="w-3.5 h-3.5" /> Buy €{tour.price}</>
            ) : isCompleted ? (
              <><Play className="w-3.5 h-3.5" /> Again</>
            ) : isStarted ? (
              <><ChevronRight className="w-4 h-4" /> Resume</>
            ) : (
              <><ChevronRight className="w-4 h-4" /> Start</>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

// ── TourSelectScreen ──────────────────────────────────────────────────────────

export default function TourSelectScreen({ teamName, tours, allProgress, purchases, onSelectTour, onPurchase, onChangeName }) {
  const [durationFilter, setDurationFilter] = useState('all')
  const [interestFilters, setInterestFilters] = useState([])
  const [kidFriendlyOnly, setKidFriendlyOnly] = useState(false)
  const [purchaseTarget, setPurchaseTarget] = useState(null)

  const filtered = useMemo(() => {
    return tours.filter(t => {
      if (durationFilter === 'quick' && t.durationMin >= 90) return false
      if (durationFilter === 'half' && (t.durationMin < 90 || t.durationMin >= 180)) return false
      if (durationFilter === 'full' && t.durationMin < 180) return false

      if (interestFilters.length > 0) {
        const hasMatch = interestFilters.some(i => t.tags.includes(i))
        if (!hasMatch) return false
      }

      if (kidFriendlyOnly && !t.kidFriendly) return false

      return true
    })
  }, [tours, durationFilter, interestFilters, kidFriendlyOnly])

  const toggleInterest = (id) => {
    setInterestFilters(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const activeFilterCount =
    (durationFilter !== 'all' ? 1 : 0) +
    interestFilters.length +
    (kidFriendlyOnly ? 1 : 0)

  return (
    <div className="flex flex-col min-h-screen screen-enter-up">
      {/* Header */}
      <div
        className="relative pt-safe px-5 pb-4 flex-shrink-0"
        style={{ background: 'linear-gradient(180deg, #041a3d 0%, #072b5c 100%)' }}
      >
        <div className="flex items-center justify-between pt-2 mb-4">
          <div>
            <div className="text-cyan-400 text-xs font-semibold tracking-[0.25em] uppercase">
              Welcome back
            </div>
            <h1 className="text-white font-bold text-2xl leading-tight">{teamName} 👋</h1>
          </div>
          <button
            onClick={onChangeName}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl active:scale-95 transition-transform"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <LogOut className="w-3.5 h-3.5 text-white/40" />
            <span className="text-white/40 text-xs">Change</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-cyan-400" />
          <span className="text-white/70 text-sm">
            Choose your Bodrum adventure
          </span>
        </div>
      </div>

      {/* Filters */}
      <div
        className="flex-shrink-0 pt-4 pb-2"
        style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <FilterRow label="Duration">
          {DURATION_FILTERS.map(f => (
            <FilterPill
              key={f.id}
              label={f.label}
              active={durationFilter === f.id}
              accent="#38bdf8"
              onClick={() => setDurationFilter(f.id)}
            />
          ))}
        </FilterRow>

        <FilterRow label="Interests">
          {INTEREST_FILTERS.map(f => (
            <FilterPill
              key={f.id}
              label={f.label}
              active={interestFilters.includes(f.id)}
              accent="#22d3ee"
              onClick={() => toggleInterest(f.id)}
            />
          ))}
        </FilterRow>

        <div className="px-4 pb-1">
          <button
            onClick={() => setKidFriendlyOnly(v => !v)}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all active:scale-95"
            style={
              kidFriendlyOnly
                ? {
                    background: 'rgba(251,191,36,0.15)',
                    border: '1px solid rgba(251,191,36,0.4)',
                    color: '#fbbf24',
                  }
                : {
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.45)',
                  }
            }
          >
            <Baby className="w-4 h-4" />
            <span className="text-sm font-medium">Kid-friendly tours only</span>
            <div
              className="ml-auto w-4 h-4 rounded-full border-2 flex items-center justify-center"
              style={{
                borderColor: kidFriendlyOnly ? '#fbbf24' : 'rgba(255,255,255,0.2)',
                background: kidFriendlyOnly ? '#fbbf24' : 'transparent',
              }}
            >
              {kidFriendlyOnly && <div className="w-2 h-2 rounded-full bg-black" />}
            </div>
          </button>
        </div>
      </div>

      {/* Results summary + clear filters */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <span className="text-white/40 text-sm">
          {filtered.length === tours.length
            ? `All ${tours.length} tours`
            : `${filtered.length} of ${tours.length} tours`}
        </span>
        {activeFilterCount > 0 && (
          <button
            onClick={() => {
              setDurationFilter('all')
              setInterestFilters([])
              setKidFriendlyOnly(false)
            }}
            className="text-cyan-400 text-sm font-medium active:opacity-60"
          >
            Clear filters ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Tour list */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-safe">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-3">🧭</div>
            <div className="text-white/50 font-medium mb-1">No tours match your filters</div>
            <div className="text-white/30 text-sm">Try adjusting the filters above</div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 stagger-children">
            {filtered.map(tour => (
              <TourCard
                key={tour.id}
                tour={tour}
                progress={allProgress[tour.id] ?? null}
                isPurchased={purchases[tour.id] === true}
                onSelect={onSelectTour}
                onBuy={setPurchaseTarget}
              />
            ))}
          </div>
        )}

        <div className="mt-4 mb-2 text-center">
          <p className="text-white/15 text-xs">Bodrum, Turkey · More tours coming soon</p>
        </div>
      </div>

      {/* Purchase modal */}
      {purchaseTarget && (
        <PurchaseModal
          tour={purchaseTarget}
          onPurchase={(tourId) => {
            onPurchase(tourId)
          }}
          onClose={() => setPurchaseTarget(null)}
        />
      )}
    </div>
  )
}
