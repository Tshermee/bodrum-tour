import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ALL_TOURS } from './data/toursData'
import { useLocalStorage } from './hooks/useLocalStorage'
import { fetchAllToursForApp, fetchTourByPreviewToken, createPurchase, upsertTourProgress, completeStop, completeTour, fetchTourWithStops, reportSkip } from './lib/api'
import WelcomeScreen from './components/screens/WelcomeScreen'
import TourSelectScreen from './components/screens/TourSelectScreen'
import MissionHubScreen from './components/screens/MissionHubScreen'
import MissionScreen from './components/screens/MissionScreen'
import CompletionScreen from './components/screens/CompletionScreen'
import SuccessOverlay from './components/ui/SuccessOverlay'
import { getDeviceId } from './lib/deviceId'

function buildDefaultMissions(tour) {
  // Free-roam tours unlock every stop at once; sequential tours unlock only the first.
  const freeRoam = tour.tourType === 'free_roam'
  return tour.missions.reduce((acc, m, idx) => {
    acc[m.id] = {
      status: freeRoam || idx === 0 ? 'unlocked' : 'locked',
      score: 0, completedAt: null, photoThumb: null,
    }
    return acc
  }, {})
}

// Cache: tourId → { progressId, stopMap: { orderIndex → stopUUID } }
const supabaseCache = {}

async function initSupabaseTour(tourId, teamName, purchaseId) {
  try {
    const deviceId = getDeviceId()
    const [progress, stopsData] = await Promise.all([
      upsertTourProgress({ purchaseId: purchaseId ?? null, tourId, teamName, deviceId }),
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
  const [lifetimePoints, setLifetimePoints] = useLocalStorage('bodrum-lifetime-pts', 0)
  const [redeemedRewards, setRedeemedRewards] = useLocalStorage('bodrum-redeemed', [])

  const isPreviewMode = useRef(false)
  const { i18n } = useTranslation()

  const [tours, setTours] = useState(ALL_TOURS)
  useEffect(() => {
    const lang = (i18n.language || 'en').split('-')[0]
    const previewToken = new URLSearchParams(window.location.search).get('preview')

    fetchAllToursForApp(lang)
      .then(async loaded => {
        if (loaded.length > 0) setTours(loaded)
        if (previewToken) {
          try {
            const previewTour = await fetchTourByPreviewToken(previewToken, lang)
            isPreviewMode.current = true
            setTours(prev => {
              const exists = prev.some(t => t.id === previewTour.id)
              return exists
                ? prev.map(t => t.id === previewTour.id ? previewTour : t)
                : [...prev, previewTour]
            })
            setPurchases(prev => ({ ...prev, [previewTour.id]: true }))
            setSelectedTourId(previewTour.id)
            setAllProgress(prev => {
              if (prev[previewTour.id]) return prev
              return {
                ...prev,
                [previewTour.id]: {
                  startTime: new Date().toISOString(),
                  missions: buildDefaultMissions(previewTour),
                  totalScore: 0,
                  completedAt: null,
                },
              }
            })
            if (teamName) setScreen('hub')
          } catch (e) {
            console.warn('Preview tour not found', e)
          }
        }
      })
      .catch(() => {})
  }, [i18n.language])

  const [screen, setScreen] = useState(() => {
    if (!teamName) return 'welcome'
    if (!selectedTourId) return 'tourSelect'
    return 'hub'
  })
  const [activeMissionId, setActiveMissionId] = useState(null)
  const [successData, setSuccessData] = useState(null)

  const activeTour = selectedTourId ? (tours.find(t => t.id === selectedTourId) ?? null) : null
  const activeTourProgress = selectedTourId ? allProgress[selectedTourId] ?? null : null

  const welcomeStats = useMemo(() => ({
    tours: tours.length,
    stops: tours.reduce((s, t) => s + t.stops, 0),
    points: tours.reduce((s, t) => s + t.totalPossibleScore, 0),
  }), [tours])

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleStartTeam = useCallback((name) => {
    setTeamName(name)
    setScreen(isPreviewMode.current ? 'hub' : 'tourSelect')
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
    // Always sync to Supabase — device_id is the unique key so re-selecting is idempotent
    if (teamName) {
      initSupabaseTour(tourId, teamName, purchaseIdRef.current[tourId])
    }
  }, [tours, setSelectedTourId, setAllProgress, teamName])

  const handleOpenMission = useCallback((missionId) => {
    setActiveMissionId(missionId)
    setScreen('mission')
  }, [])

  const handleMissionComplete = useCallback((missionId, photoThumb = null, penalty = 0) => {
    if (!activeTour) return
    const mission = activeTour.missions.find(m => m.id === missionId)
    // Free-roam has no fixed "next" — the player picks from the hub.
    const nextMission = activeTour.tourType === 'free_roam'
      ? null
      : activeTour.missions.find(m => m.id === missionId + 1) ?? null
    const earnedPoints = Math.max(0, mission.points - penalty)

    setAllProgress(prev => {
      const tourProg = prev[selectedTourId]
      const newMissions = { ...tourProg.missions }
      newMissions[missionId] = {
        status: 'completed',
        score: earnedPoints,
        completedAt: new Date().toISOString(),
        photoThumb,
      }
      if (nextMission) {
        newMissions[nextMission.id] = { ...newMissions[nextMission.id], status: 'unlocked' }
      }
      const allDone = activeTour.missions.every(m => newMissions[m.id]?.status === 'completed')
      const newTotal = tourProg.totalScore + earnedPoints
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
          completeStop({ tourProgressId: cache.progressId, stopId, score: earnedPoints, attempts: 1 })
            .catch(e => console.warn('stop sync', e))
        }
        if (allDone) {
          completeTour(cache.progressId, newTotal).catch(e => console.warn('completion sync', e))
        }
      }
      return { ...prev, [selectedTourId]: newProg }
    })
    setLifetimePoints(prev => prev + earnedPoints)

    setSuccessData({ mission, nextMission, score: earnedPoints })
  }, [activeTour, selectedTourId, setAllProgress, setLifetimePoints])

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
    if (!window.confirm(`Reset "${activeTour.title}"?\n\nYour earned lifetime points are kept, but all stop progress will be cleared.`)) return
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

  const handleSkipMission = useCallback((missionId, reason, note) => {
    if (!activeTour) return
    const mission = activeTour.missions.find(m => m.id === missionId)
    const nextMission = activeTour.tourType === 'free_roam'
      ? null
      : activeTour.missions.find(m => m.id === missionId + 1) ?? null

    setAllProgress(prev => {
      const tourProg = prev[selectedTourId]
      const newMissions = { ...tourProg.missions }
      newMissions[missionId] = {
        status: 'completed',
        score: 0,
        completedAt: new Date().toISOString(),
        photoThumb: null,
        skipped: true,
      }
      if (nextMission) {
        newMissions[nextMission.id] = { ...newMissions[nextMission.id], status: 'unlocked' }
      }
      const allDone = activeTour.missions.every(m => newMissions[m.id]?.status === 'completed')
      return {
        ...prev,
        [selectedTourId]: {
          ...tourProg,
          missions: newMissions,
          completedAt: allDone ? new Date().toISOString() : tourProg.completedAt,
        },
      }
    })

    // Fire-and-forget — skip works offline too
    reportSkip({
      tourId: selectedTourId,
      stopOrder: missionId,
      stopName: mission?.title ?? '',
      teamName,
      reason: reason || null,
      note: note || null,
    }).catch(e => console.warn('skip report', e))

    setActiveMissionId(null)
    setScreen('hub')
  }, [activeTour, selectedTourId, setAllProgress, teamName])

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

  const handleRedeem = useCallback((reward) => {
    setRedeemedRewards(prev => [...prev, { id: reward.id, redeemedAt: new Date().toISOString() }])
    setLifetimePoints(prev => Math.max(0, prev - reward.points))
  }, [setRedeemedRewards, setLifetimePoints])

  const activeMission = activeMissionId && activeTour
    ? activeTour.missions.find(m => m.id === activeMissionId)
    : null

  const totalScore = activeTourProgress?.totalScore ?? 0

  return (
    <div className="relative flex justify-center min-h-screen bg-slate-950">
      <div className="relative w-full max-w-[430px] min-h-screen overflow-hidden bg-aegean-950">

        {screen === 'welcome' && (
          <WelcomeScreen onStart={handleStartTeam} stats={welcomeStats} />
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
            lifetimePoints={lifetimePoints}
            redeemedRewards={redeemedRewards}
            onRedeem={handleRedeem}
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
            bypassGps={activeTour.bypassGps || false}
            onComplete={handleMissionComplete}
            onSkip={handleSkipMission}
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
