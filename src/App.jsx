import { useState, useCallback, useRef, useEffect } from 'react'
import { ALL_TOURS } from './data/toursData'
import { useLocalStorage } from './hooks/useLocalStorage'
import { fetchAllToursForApp, createPurchase, upsertTourProgress, completeStop, completeTour, fetchTourWithStops } from './lib/api'
import WelcomeScreen from './components/screens/WelcomeScreen'
import TourSelectScreen from './components/screens/TourSelectScreen'
import MissionHubScreen from './components/screens/MissionHubScreen'
import MissionScreen from './components/screens/MissionScreen'
import CompletionScreen from './components/screens/CompletionScreen'
import SuccessOverlay from './components/ui/SuccessOverlay'
import { getDeviceId } from './lib/deviceId'

function buildDefaultMissions(tour) {
  return tour.missions.reduce((acc, m, idx) => {
    acc[m.id] = { status: idx === 0 ? 'unlocked' : 'locked', score: 0, completedAt: null, photoThumb: null }
    return acc
  }, {})
}

// Cache: tourId → { progressId, stopMap: { orderIndex → stopUUID } }
const supabaseCache = {}

async function initSupabaseTour(tourId, purchaseId, teamName) {
  try {
    const [progress, stopsData] = await Promise.all([
      upsertTourProgress({ purchaseId, tourId, teamName }),
      fetchTourWithStops(tourId),
    ])
    const stopMap = {}
    stopsData.tour_stops.forEach(s => { stopMap[s.order_index] = s.id })
    supabaseCache[tourId] = { progressId: progress.id, stopMap }
  } catch (e) {
    console.warn('Supabase sync failed (offline?)', e)
  }
}

export default function App() {
  const [teamName, setTeamName] = useLocalStorage('bodrum-name-v2', '')
  const [allProgress, setAllProgress] = useLocalStorage('bodrum-progress-v2', {})
  const [selectedTourId, setSelectedTourId] = useLocalStorage('bodrum-selected-tour-v2', null)
  const [purchases, setPurchases] = useLocalStorage('bodrum-purchases-v2', {})
  const purchaseIdRef = useRef({}) // tourId → supabase purchase UUID

  const [tours, setTours] = useState(ALL_TOURS)
  useEffect(() => {
    fetchAllToursForApp()
      .then(loaded => { if (loaded.length > 0) setTours(loaded) })
      .catch(() => {}) // silently fall back to ALL_TOURS
  }, [])

  const [screen, setScreen] = useState(() => {
    if (!teamName) return 'welcome'
    if (!selectedTourId) return 'tourSelect'
    return 'hub'
  })
  const [activeMissionId, setActiveMissionId] = useState(null)
  const [successData, setSuccessData] = useState(null)

  const activeTour = selectedTourId ? (tours.find(t => t.id === selectedTourId) ?? null) : null
  const activeTourProgress = selectedTourId ? allProgress[selectedTourId] ?? null : null

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleStartTeam = useCallback((name) => {
    setTeamName(name)
    setScreen('tourSelect')
  }, [setTeamName])

  const handleSelectTour = useCallback((tourId) => {
    const tour = tours.find(t => t.id === tourId)
    if (!tour) return
    setSelectedTourId(tourId)
    setAllProgress(prev => {
      if (prev[tourId]) return prev
      return {
        ...prev,
        [tourId]: {
          startTime: new Date().toISOString(),
          missions: buildDefaultMissions(tour),
          totalScore: 0,
          completedAt: null,
        },
      }
    })
    setScreen('hub')
    // Sync to Supabase in background
    const pid = purchaseIdRef.current[tourId]
    if (pid && teamName) {
      initSupabaseTour(tourId, pid, teamName)
    }
  }, [tours, setSelectedTourId, setAllProgress, teamName])

  const handleOpenMission = useCallback((missionId) => {
    setActiveMissionId(missionId)
    setScreen('mission')
  }, [])

  const handleMissionComplete = useCallback((missionId, photoThumb = null) => {
    if (!activeTour) return
    const mission = activeTour.missions.find(m => m.id === missionId)
    const nextMission = activeTour.missions.find(m => m.id === missionId + 1) ?? null

    setAllProgress(prev => {
      const tourProg = prev[selectedTourId]
      const newMissions = { ...tourProg.missions }
      newMissions[missionId] = {
        status: 'completed',
        score: mission.points,
        completedAt: new Date().toISOString(),
        photoThumb,
      }
      if (nextMission) {
        newMissions[nextMission.id] = { ...newMissions[nextMission.id], status: 'unlocked' }
      }
      const allDone = activeTour.missions.every(m => newMissions[m.id]?.status === 'completed')
      const newTotal = tourProg.totalScore + mission.points
      const newProg = {
        ...tourProg,
        missions: newMissions,
        totalScore: newTotal,
        completedAt: allDone ? new Date().toISOString() : tourProg.completedAt,
      }
      // Supabase sync (fire-and-forget)
      const cache = supabaseCache[selectedTourId]
      if (cache) {
        const stopId = cache.stopMap[missionId]
        if (stopId) {
          completeStop({ tourProgressId: cache.progressId, stopId, score: mission.points, attempts: 1 })
            .catch(e => console.warn('stop sync', e))
        }
        if (allDone) {
          completeTour(cache.progressId, newTotal).catch(e => console.warn('completion sync', e))
        }
      }
      return { ...prev, [selectedTourId]: newProg }
    })

    setSuccessData({ mission, nextMission, score: mission.points })
  }, [activeTour, selectedTourId, setAllProgress])

  const handleSuccessDismiss = useCallback(() => {
    const justCompletedId = successData?.mission?.id
    const allDone = activeTour?.missions.every(m => {
      if (m.id === justCompletedId) return true
      return activeTourProgress?.missions[m.id]?.status === 'completed'
    })
    setSuccessData(null)
    setScreen(allDone ? 'completion' : 'hub')
  }, [successData, activeTour, activeTourProgress])

  const handleBackToHub = useCallback(() => {
    setActiveMissionId(null)
    setScreen('hub')
  }, [])

  const handleBackToTourSelect = useCallback(() => {
    setSelectedTourId(null)
    setActiveMissionId(null)
    setScreen('tourSelect')
  }, [setSelectedTourId])

  const handleResetActiveTour = useCallback(() => {
    if (!selectedTourId || !activeTour) return
    setAllProgress(prev => ({
      ...prev,
      [selectedTourId]: {
        startTime: new Date().toISOString(),
        missions: buildDefaultMissions(activeTour),
        totalScore: 0,
        completedAt: null,
      },
    }))
    setSelectedTourId(null)
    setActiveMissionId(null)
    setScreen('tourSelect')
  }, [selectedTourId, activeTour, setAllProgress, setSelectedTourId])

  const handlePurchase = useCallback(async (tourId) => {
    // Optimistic local update
    setPurchases(prev => ({ ...prev, [tourId]: true }))
    const tour = tours.find(t => t.id === tourId)
    // Sync to Supabase in background
    try {
      const purchase = await createPurchase({
        tourId,
        teamName,
        amount: tour?.price ?? 0,
        deviceId: getDeviceId(),
      })
      purchaseIdRef.current[tourId] = purchase.id
    } catch (e) {
      console.warn('purchase sync', e)
    }
  }, [tours, setPurchases, teamName])

  const handleFullReset = useCallback(() => {
    setTeamName('')
    setAllProgress({})
    setSelectedTourId(null)
    setPurchases({})
    setActiveMissionId(null)
    setSuccessData(null)
    setScreen('welcome')
  }, [setTeamName, setAllProgress, setSelectedTourId, setPurchases])

  const activeMission = activeMissionId && activeTour
    ? activeTour.missions.find(m => m.id === activeMissionId)
    : null

  const totalScore = activeTourProgress?.totalScore ?? 0

  return (
    <div className="relative flex justify-center min-h-screen bg-slate-950">
      <div className="relative w-full max-w-[430px] min-h-screen overflow-hidden bg-aegean-950">

        {screen === 'welcome' && (
          <WelcomeScreen onStart={handleStartTeam} />
        )}

        {screen === 'tourSelect' && (
          <TourSelectScreen
            teamName={teamName}
            tours={tours}
            allProgress={allProgress}
            purchases={purchases}
            onSelectTour={handleSelectTour}
            onPurchase={handlePurchase}
            onChangeName={handleFullReset}
          />
        )}

        {screen === 'hub' && activeTour && activeTourProgress && (
          <MissionHubScreen
            tour={activeTour}
            tourProgress={activeTourProgress}
            teamName={teamName}
            onOpenMission={handleOpenMission}
            onBackToSelect={handleBackToTourSelect}
            onResetTour={handleResetActiveTour}
          />
        )}

        {screen === 'mission' && activeMission && activeTourProgress && (
          <MissionScreen
            mission={activeMission}
            missionProgress={activeTourProgress.missions[activeMissionId]}
            missionIndex={activeTour.missions.findIndex(m => m.id === activeMissionId)}
            totalMissions={activeTour.missions.length}
            onComplete={handleMissionComplete}
            onBack={handleBackToHub}
          />
        )}

        {screen === 'completion' && activeTour && activeTourProgress && (
          <CompletionScreen
            tour={activeTour}
            tourProgress={activeTourProgress}
            teamName={teamName}
            onReset={handleResetActiveTour}
            onBackToSelect={handleBackToTourSelect}
          />
        )}

        {successData && (
          <SuccessOverlay
            mission={successData.mission}
            nextMission={successData.nextMission}
            score={successData.score}
            totalScore={totalScore + successData.score}
            onDismiss={handleSuccessDismiss}
          />
        )}

      </div>
    </div>
  )
}
