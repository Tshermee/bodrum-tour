import { useRef, useState } from 'react'
import { Camera, CheckCircle2, RotateCcw, Lightbulb, ChevronDown, ChevronUp, Upload } from 'lucide-react'

async function resizeImage(file, maxDim = 400) {
  return new Promise(resolve => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const ratio = Math.min(maxDim / img.width, maxDim / img.height, 1)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * ratio)
      canvas.height = Math.round(img.height * ratio)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.72))
    }
    img.src = url
  })
}

export default function PhotoChallenge({ challenge, isCompleted, completedThumb, accentColor, gradient, onComplete }) {
  const [preview, setPreview] = useState(completedThumb ?? null)
  const [hintOpen, setHintOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef(null)

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    const thumb = await resizeImage(file)
    setPreview(thumb)
    setLoading(false)
  }

  const handleSubmit = () => {
    onComplete(preview)
  }

  const handleRetake = () => {
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  if (isCompleted && completedThumb) {
    return (
      <div className="animate-scale-in">
        <div
          className="rounded-2xl overflow-hidden relative"
          style={{ border: '2px solid rgba(34,197,94,0.4)' }}
        >
          <img src={completedThumb} alt="Submitted" className="w-full object-cover" style={{ maxHeight: 240 }} />
          <div className="absolute inset-0 flex items-end p-4"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-white font-semibold text-sm">Photo submitted!</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isCompleted) {
    return (
      <div
        className="rounded-2xl p-5 flex items-center gap-3 animate-scale-in"
        style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}
      >
        <CheckCircle2 className="w-8 h-8 text-green-400 flex-shrink-0" />
        <div>
          <div className="text-green-400 font-semibold">Challenge Complete!</div>
          <div className="text-white/50 text-sm">Photo submitted successfully.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Instruction card */}
      <div
        className="rounded-2xl p-4"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Camera className="w-4 h-4" style={{ color: accentColor }} />
          <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: accentColor }}>
            Photo Challenge
          </span>
        </div>
        <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">
          {challenge.instruction}
        </p>
      </div>

      {/* Hint */}
      {challenge.hint && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(251,191,36,0.2)' }}
        >
          <button
            onClick={() => setHintOpen(v => !v)}
            className="w-full flex items-center gap-3 px-4 py-3 active:opacity-80"
            style={{ background: 'rgba(251,191,36,0.08)' }}
          >
            <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="text-amber-400 text-sm font-medium flex-1 text-left">Need a hint?</span>
            {hintOpen ? <ChevronUp className="w-4 h-4 text-amber-400/60" /> : <ChevronDown className="w-4 h-4 text-amber-400/60" />}
          </button>
          {hintOpen && (
            <div className="px-4 pb-3 pt-1 animate-fade-in"
              style={{ background: 'rgba(251,191,36,0.05)' }}>
              <p className="text-white/60 text-sm leading-relaxed">{challenge.hint}</p>
            </div>
          )}
        </div>
      )}

      {/* Photo area */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {preview ? (
        <div className="space-y-3">
          {/* Preview */}
          <div
            className="rounded-2xl overflow-hidden relative"
            style={{ border: `2px solid ${accentColor}44` }}
          >
            <img src={preview} alt="Preview" className="w-full object-cover" style={{ maxHeight: 280 }} />
            <button
              onClick={handleRetake}
              className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium"
              style={{ background: 'rgba(0,0,0,0.6)' }}
            >
              <RotateCcw className="w-3.5 h-3.5 text-white" />
              <span className="text-white">Retake</span>
            </button>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            className="w-full py-4 rounded-xl font-bold text-white text-base flex items-center justify-center gap-2 active:scale-95 transition-transform"
            style={{
              background: 'linear-gradient(135deg, #16a34a, #22c55e)',
              boxShadow: '0 4px 16px rgba(34,197,94,0.3)',
            }}
          >
            <CheckCircle2 className="w-5 h-5" />
            Submit Photo
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          className="w-full py-5 rounded-2xl flex flex-col items-center gap-3 active:scale-[0.98] transition-transform"
          style={{
            background: `linear-gradient(135deg, ${gradient[0]}55, ${gradient[1]}55)`,
            border: `2px dashed ${accentColor}55`,
          }}
        >
          {loading ? (
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: `${accentColor}66`, borderTopColor: accentColor }} />
          ) : (
            <>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: `${accentColor}22` }}
              >
                <Camera className="w-7 h-7" style={{ color: accentColor }} />
              </div>
              <div className="text-center">
                <div className="text-white font-semibold">Take Photo</div>
                <div className="text-white/40 text-xs mt-0.5 flex items-center justify-center gap-1">
                  <Upload className="w-3 h-3" />
                  or tap to upload from library
                </div>
              </div>
            </>
          )}
        </button>
      )}
    </div>
  )
}
