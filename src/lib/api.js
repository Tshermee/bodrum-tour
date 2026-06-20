import { supabase, supabaseAdmin } from './supabase'

// ─── Supabase → component format transformer ──────────────────────────────────

function emojiForTags(tags = []) {
  if (tags.includes('food')) return '🍽️'
  if (tags.includes('photography')) return '📸'
  if (tags.includes('nature') || tags.includes('active')) return '🌊'
  if (tags.includes('history') || tags.includes('architecture')) return '🏛️'
  if (tags.includes('culture')) return '🎭'
  return '🗺️'
}

const STOP_EMOJI = { photo: '📸', riddle: '🔍', code: '🔢', multiple_choice: '🎯', image_hunt: '🔎' }

function transformStop(stop, tour, lang = 'en') {
  const tx = stop.translations?.[lang] ?? {}
  const challenge = {
    type: stop.challenge_type || 'photo',
    instruction: tx.challenge_prompt || stop.challenge_prompt || '',
    hint: tx.challenge_hint || stop.challenge_hint || '',
  }
  if (stop.challenge_type === 'riddle') challenge.answer = stop.challenge_answer || ''
  if (stop.challenge_type === 'code') challenge.code = stop.challenge_answer || ''
  if (stop.challenge_type === 'multiple_choice') {
    challenge.answer = stop.challenge_answer || ''
    challenge.options = (stop.challenge_options || '').split('\n').map(s => s.trim()).filter(Boolean)
  }
  if (stop.challenge_type === 'image_hunt') {
    challenge.answer = stop.challenge_answer || ''
    challenge.huntImage = stop.photo_url || null
  }

  return {
    id: stop.order_index,
    title: tx.name || stop.name,
    location: stop.location_name || stop.name,
    emoji: STOP_EMOJI[stop.challenge_type] || '📍',
    gradient: [tour.gradient_from || '#1e3a8a', tour.gradient_to || '#0e7490'],
    accentColor: tour.accent_color || '#38bdf8',
    mapsQuery: stop.location_name ? `${stop.location_name}, Bodrum, Turkey` : 'Bodrum, Turkey',
    coordinates: stop.lat && stop.lng ? { lat: Number(stop.lat), lng: Number(stop.lng) } : null,
    story: tx.story || stop.story || '',
    points: stop.points || 100,
    photoUrl: stop.photo_url || null,
    audioUrl: stop.audio_url || null,
    // for image_hunt the challenge component always shows the photo — keep map visible in the header
    showPhoto: stop.challenge_type === 'image_hunt' ? false : !!stop.show_photo,
    challenge,
  }
}

export function transformTour(raw, lang = 'en') {
  const tx = raw.translations?.[lang] ?? {}
  const stops = (raw.tour_stops || []).sort((a, b) => a.order_index - b.order_index)
  return {
    id: raw.id,
    title: tx.name || raw.name,
    tagline: tx.subtitle || raw.subtitle || raw.description || '',
    coverEmoji: emojiForTags(raw.tags),
    gradient: [raw.gradient_from || '#1e3a8a', raw.gradient_to || '#0e7490'],
    accentColor: raw.accent_color || '#38bdf8',
    durationMin: Math.round(parseFloat(raw.duration_min || 1) * 60),
    durationLabel: raw.duration_min && raw.duration_max
      ? `${raw.duration_min} – ${raw.duration_max} hrs`
      : `${raw.duration_min || 1} hrs`,
    stops: stops.length,
    totalPossibleScore: stops.reduce((sum, s) => sum + (s.points || 0), 0),
    difficulty: (raw.difficulty || 'moderate').toLowerCase(),
    tourType: raw.tour_type === 'free_roam' ? 'free_roam' : 'sequential',
    tags: raw.tags || [],
    price: Number(raw.price || 0),
    kidFriendly: raw.kid_friendly || false,
    bypassGps: raw.bypass_gps || false,
    previewToken: raw.preview_token || null,
    coverImageUrl: raw.cover_image_url || null,
    showCoverImage: !!raw.show_cover_image,
    missions: stops.map(s => transformStop(s, raw, lang)),
  }
}

export async function fetchAllToursForApp(lang = 'en') {
  const { data, error } = await supabase
    .from('tours')
    .select('*, tour_stops(*)')
    .eq('published', true)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data.map(raw => transformTour(raw, lang))
}

// ─── Tours ────────────────────────────────────────────────────────────────────

export async function fetchTours() {
  const { data, error } = await supabase
    .from('tours')
    .select('*, tour_stops(count)')
    .eq('published', true)
    .order('created_at')
  if (error) throw error
  return data
}

export async function fetchTourWithStops(tourId) {
  const { data, error } = await supabase
    .from('tours')
    .select('*, tour_stops(*)')
    .eq('id', tourId)
    .single()
  if (error) throw error
  data.tour_stops.sort((a, b) => a.order_index - b.order_index)
  return data
}

// ─── Purchases ────────────────────────────────────────────────────────────────

export async function createPurchase({ tourId, teamName, email, amount, deviceId }) {
  const { data, error } = await supabase
    .from('purchases')
    .insert({
      tour_id: tourId,
      team_name: teamName,
      email: email || null,
      amount,
      device_id: deviceId,
      status: 'completed',
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function checkPurchase(tourId, deviceId) {
  const { data, error } = await supabase
    .from('purchases')
    .select('id')
    .eq('tour_id', tourId)
    .eq('device_id', deviceId)
    .eq('status', 'completed')
    .maybeSingle()
  if (error) throw error
  return !!data
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export async function upsertTourProgress({ purchaseId, tourId, teamName, deviceId }) {
  const { data, error } = await supabase
    .from('tour_progress')
    .upsert(
      { purchase_id: purchaseId ?? null, tour_id: tourId, team_name: teamName, device_id: deviceId, last_active_at: new Date().toISOString() },
      { onConflict: 'tour_id,device_id', ignoreDuplicates: false }
    )
    .select()
    .single()
  if (error) throw error
  return data
}

// Heartbeat: bump last_active_at so the dashboard can tell who's playing now.
// Fire-and-forget from the player app; failures are ignored (offline is fine).
export async function touchTourProgress(tourProgressId) {
  if (!tourProgressId) return
  await supabase
    .from('tour_progress')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', tourProgressId)
}

export async function completeStop({ tourProgressId, stopId, score, photoUrl, attempts }) {
  const { error } = await supabase
    .from('stop_progress')
    .upsert({
      tour_progress_id: tourProgressId,
      stop_id: stopId,
      completed_at: new Date().toISOString(),
      score,
      photo_url: photoUrl || null,
      attempts,
    }, { onConflict: 'tour_progress_id,stop_id' })
  if (error) throw error
}

export async function completeTour(tourProgressId, totalScore) {
  const { error } = await supabase
    .from('tour_progress')
    .update({ completed_at: new Date().toISOString(), total_score: totalScore })
    .eq('id', tourProgressId)
  if (error) throw error
}

// ─── Admin: Tours ─────────────────────────────────────────────────────────────

export async function adminFetchTours() {
  const { data, error } = await supabaseAdmin
    .from('tours')
    .select('*, tour_stops(count)')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data
}

export async function adminUpsertTour(tour) {
  // Strip any joined relations (e.g. tour_stops from adminFetchTours select) before upserting
  const { tour_stops, ...payload } = tour
  const { data, error } = await supabaseAdmin
    .from('tours')
    .upsert({ ...payload, updated_at: new Date().toISOString() })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function adminDeleteTour(id) {
  const { error } = await supabaseAdmin.from('tours').delete().eq('id', id)
  if (error) throw error
}

export async function adminDuplicateTour(id) {
  // Fetch source tour + stops
  const { data: src, error: fetchErr } = await supabaseAdmin
    .from('tours')
    .select('*, tour_stops(*)')
    .eq('id', id)
    .single()
  if (fetchErr) throw fetchErr

  // Build new tour: unpublished, no preview token yet, fresh ID
  const newId = `${src.id}-copy-${Date.now()}`
  const { tour_stops, created_at, updated_at, preview_token, sort_order, ...rest } = src
  const { data: newTour, error: tourErr } = await supabaseAdmin
    .from('tours')
    .insert({
      ...rest,
      id: newId,
      name: `${src.name} (Copy)`,
      published: false,
      bypass_gps: false,
      sort_order: (src.sort_order || 0) + 1,
      preview_token: crypto.randomUUID(),
    })
    .select()
    .single()
  if (tourErr) throw tourErr

  // Duplicate stops
  if (tour_stops?.length) {
    const newStops = tour_stops.map(({ id: _id, created_at: _ca, tour_id: _ti, ...stop }) => ({
      ...stop,
      tour_id: newTour.id,
    }))
    const { error: stopsErr } = await supabaseAdmin.from('tour_stops').insert(newStops)
    if (stopsErr) throw stopsErr
  }

  return newTour
}

export async function fetchTourByPreviewToken(token, lang = 'en') {
  const { data, error } = await supabase
    .from('tours')
    .select('*, tour_stops(*)')
    .eq('preview_token', token)
    .single()
  if (error) throw error
  return transformTour(data, lang)
}

// ─── Admin: Stops ─────────────────────────────────────────────────────────────

export async function adminFetchStops(tourId) {
  const { data, error } = await supabaseAdmin
    .from('tour_stops')
    .select('*')
    .eq('tour_id', tourId)
    .order('order_index')
  if (error) throw error
  return data
}

export async function adminUpsertStop(stop) {
  const { data, error } = await supabaseAdmin
    .from('tour_stops')
    .upsert({ ...stop, updated_at: new Date().toISOString() })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function adminDeleteStop(id) {
  const { error } = await supabaseAdmin.from('tour_stops').delete().eq('id', id)
  if (error) throw error
}

// ─── Admin: Purchases ─────────────────────────────────────────────────────────

export async function adminFetchPurchases({ page = 0, pageSize = 50, tourId } = {}) {
  let query = supabaseAdmin
    .from('purchases')
    .select('*, tours(name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1)
  if (tourId) query = query.eq('tour_id', tourId)
  const { data, error, count } = await query
  if (error) throw error
  return { data, count }
}

// ─── Admin: Analytics ─────────────────────────────────────────────────────────

export async function adminFetchTourStats() {
  const { data, error } = await supabaseAdmin.from('tour_stats').select('*')
  if (error) throw error
  return data
}

export async function adminFetchStopDropoff(tourId) {
  const { data, error } = await supabaseAdmin
    .from('stop_dropoff_stats')
    .select('*')
    .eq('tour_id', tourId)
  if (error) throw error
  return data
}

export async function adminFetchLiveProgress() {
  const { data, error } = await supabaseAdmin
    .from('tour_progress')
    .select(`
      id, team_name, tour_id, created_at:started_at, completed_at, total_score, last_active_at,
      tours ( name, tour_stops ( count ) ),
      stop_progress ( count )
    `)
    .order('started_at', { ascending: false })
    .limit(200)
  if (error) throw error
  return data ?? []
}

// ─── Skip Reports ─────────────────────────────────────────────────────────────

export async function reportSkip({ tourId, stopOrder, stopName, teamName, reason, note }) {
  const { error } = await supabaseAdmin
    .from('skip_reports')
    .insert({ tour_id: tourId, stop_order: stopOrder, stop_name: stopName, team_name: teamName, reason, note: note || null })
  if (error) throw error
}

// ─── Admin: Skip Reports ──────────────────────────────────────────────────────

export async function adminFetchSkipReports() {
  const { data, error } = await supabaseAdmin
    .from('skip_reports')
    .select('*, tours(name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function fetchAppConfig(key) {
  const { data, error } = await supabase
    .from('app_config')
    .select('data')
    .eq('key', key)
    .maybeSingle()
  if (error) throw error
  return data?.data ?? null
}

export async function adminSaveAppConfig(key, data) {
  const { error } = await supabaseAdmin
    .from('app_config')
    .upsert({ key, data, updated_at: new Date().toISOString() })
  if (error) throw error
}

// ─── Storage: Photo Upload ────────────────────────────────────────────────────

export async function uploadStopPhoto(file, stopId) {
  const ext = file.name.split('.').pop()
  const path = `stops/${stopId}.${ext}`
  const { error } = await supabaseAdmin.storage
    .from('tour-media')
    .upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw error
  const { data } = supabaseAdmin.storage.from('tour-media').getPublicUrl(path)
  return data.publicUrl
}

// Deletes a previously uploaded object from the tour-media bucket, given its
// public URL. No-op for empty/foreign URLs. Throws if nothing was removed —
// supabase-js reports an RLS-blocked remove() as success-with-empty-result,
// so we treat an empty result as a failure to surface it instead of silently
// leaving an orphaned file.
export async function deleteStopPhoto(photoUrl) {
  if (!photoUrl) return
  const marker = '/tour-media/'
  const idx = photoUrl.indexOf(marker)
  if (idx === -1) return // not a tour-media URL — nothing to remove
  const path = decodeURIComponent(photoUrl.slice(idx + marker.length).split('?')[0])
  const { data, error } = await supabaseAdmin.storage.from('tour-media').remove([path])
  if (error) throw error
  if (!data || data.length === 0) {
    throw new Error('nothing was deleted (permission denied or file already gone)')
  }
}

export async function uploadStopAudio(file, stopId) {
  const ext = file.name.split('.').pop()
  const path = `audio/${stopId}.${ext}`
  const { error } = await supabaseAdmin.storage
    .from('tour-media')
    .upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw error
  const { data } = supabaseAdmin.storage.from('tour-media').getPublicUrl(path)
  return data.publicUrl
}

export async function deleteStopAudio(audioUrl) {
  if (!audioUrl) return
  const marker = '/tour-media/'
  const idx = audioUrl.indexOf(marker)
  if (idx === -1) return
  const path = decodeURIComponent(audioUrl.slice(idx + marker.length).split('?')[0])
  await supabaseAdmin.storage.from('tour-media').remove([path])
}

// Uploads a tour cover image to tour-media and returns its public URL.
export async function uploadTourCover(file, tourId) {
  const ext = file.name.split('.').pop()
  const path = `tours/${tourId}.${ext}`
  const { error } = await supabaseAdmin.storage
    .from('tour-media')
    .upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw error
  const { data } = supabaseAdmin.storage.from('tour-media').getPublicUrl(path)
  return data.publicUrl
}

export async function uploadUserPhoto(file, progressId, stopId) {
  const ext = file.name.split('.').pop()
  const path = `user-submissions/${progressId}/${stopId}.${ext}`
  const { error } = await supabase.storage
    .from('tour-media')
    .upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw error
  const { data } = supabase.storage.from('tour-media').getPublicUrl(path)
  return data.publicUrl
}
