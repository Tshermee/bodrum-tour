import { useState } from 'react'
import { ArrowLeft, MapPin, ExternalLink, BookOpen, ChevronDown, ChevronUp } from 'lucide-react'
import PhotoChallenge from '../challenges/PhotoChallenge'
import RiddleChallenge from '../challenges/RiddleChallenge'
import CodeChallenge from '../challenges/CodeChallenge'
import MapView from '../ui/MapView'

export default function MissionScreen({
  mission,
  missionProgress,
  missionIndex,
  totalMissions,
  onComplete,
  onBack,
}) {
  const [storyExpanded, setStoryExpanded] = useState(false)
  const isCompleted = missionProgress?.status === 'completed'

  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(mission.mapsQuery)}`

  const handleComplete = (photoThumb = null) => {
    if (!isCompleted) onComplete(mission.id, photoThumb)
  }

  return (
    <div className="flex flex-col min-h-screen screen-enter">
      {/* Header */}
      <div
        className="relative pt-safe px-4 pb-5 flex-shrink-0"
        style={{ background: `linear-gradient(160deg, ${mission.gradient[0]}, ${mission.gradient[1]})` }}
      >
        {/* Back button */}
        <div className="flex items-center justify-between pt-2 mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl active:scale-95 transition-transform"
            style={{ background: 'rgba(255,255,255,0.12)' }}
          >
            <ArrowLeft className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">Back</span>
          </button>
          <div
            className="px-3 py-1.5 rounded-full text-xs font-semibold text-white/70"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            {missionIndex + 1} / {totalMissions}
          </div>
        </div>

        {/* Mission title area */}
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            {mission.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white/60 text-xs font-semibold tracking-wider uppercase mb-1">
              Stop {missionIndex + 1} · {mission.points} pts
            </div>
            <h1 className="font-display text-white text-xl font-bold leading-tight">
              {mission.title}
            </h1>
            <div className="flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: mission.accentColor }} />
              <span className="text-white/60 text-xs truncate">{mission.location}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Locator map */}
        {mission.coordinates && (
          <div className="px-4 pt-3 pb-0">
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <MapView
                missions={[mission]}
                height={160}
                interactive={true}
                accentColor={mission.accentColor}
                singleMode={true}
              />
            </div>
          </div>
        )}

        {/* Directions button */}
        <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 py-3 px-4 rounded-xl active:scale-[0.98] transition-transform"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${mission.accentColor}22` }}
            >
              <MapPin className="w-4 h-4" style={{ color: mission.accentColor }} />
            </div>
            <div className="flex-1">
              <div className="text-white font-medium text-sm">Get Directions</div>
              <div className="text-white/40 text-xs">{mission.location}</div>
            </div>
            <ExternalLink className="w-4 h-4 text-white/30 flex-shrink-0" />
          </a>
        </div>

        {/* Story */}
        <div className="px-4 py-4">
          <button
            onClick={() => setStoryExpanded(v => !v)}
            className="w-full flex items-center gap-3 py-3 px-4 rounded-xl text-left active:scale-[0.99] transition-transform"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(251, 191, 36, 0.15)' }}>
              <BookOpen className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex-1">
              <div className="text-white font-medium text-sm">The Story</div>
              <div className="text-white/40 text-xs">Tap to {storyExpanded ? 'hide' : 'read'}</div>
            </div>
            {storyExpanded
              ? <ChevronUp className="w-4 h-4 text-white/30" />
              : <ChevronDown className="w-4 h-4 text-white/30" />}
          </button>

          {storyExpanded && (
            <div
              className="mt-3 px-4 py-4 rounded-xl text-white/70 text-sm leading-relaxed animate-fade-in"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {mission.story}
            </div>
          )}
        </div>

        {/* Challenge area */}
        <div className="px-4 pb-6 pb-safe">
          <div className="text-white/30 text-xs font-semibold tracking-widest uppercase mb-3">
            Your Challenge
          </div>

          {mission.challenge.type === 'photo' && (
            <PhotoChallenge
              challenge={mission.challenge}
              isCompleted={isCompleted}
              completedThumb={missionProgress?.photoThumb}
              accentColor={mission.accentColor}
              gradient={mission.gradient}
              onComplete={handleComplete}
            />
          )}

          {mission.challenge.type === 'riddle' && (
            <RiddleChallenge
              challenge={mission.challenge}
              isCompleted={isCompleted}
              accentColor={mission.accentColor}
              gradient={mission.gradient}
              onComplete={() => handleComplete(null)}
            />
          )}

          {mission.challenge.type === 'code' && (
            <CodeChallenge
              challenge={mission.challenge}
              isCompleted={isCompleted}
              accentColor={mission.accentColor}
              gradient={mission.gradient}
              onComplete={() => handleComplete(null)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
