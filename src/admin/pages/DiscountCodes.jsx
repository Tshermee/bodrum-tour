import { useState, useEffect } from 'react'
import { adminFetchDiscountCodes, adminUpsertDiscountCode, adminDeleteDiscountCode } from '../../lib/api'
import { Loader2, Plus, Trash2, Pencil, Tag, Check, X } from 'lucide-react'

const EMPTY = { code: '', description: '', discount_type: 'percent', amount: 10, active: true }

const inputCls = "w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 text-sm"

function savingsLabel(dc) {
  return dc.discount_type === 'fixed' ? `€${dc.amount} off` : `${dc.amount}% off`
}

export default function DiscountCodes() {
  const [codes, setCodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])
  async function load() {
    setLoading(true)
    try { setCodes(await adminFetchDiscountCodes()) } finally { setLoading(false) }
  }

  function set(field, value) { setForm(prev => ({ ...prev, [field]: value })) }

  function startEdit(dc) {
    setEditingId(dc.id)
    setForm({ code: dc.code, description: dc.description || '', discount_type: dc.discount_type, amount: dc.amount, active: dc.active })
  }
  function resetForm() { setEditingId(null); setForm(EMPTY); setError('') }

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    if (!form.code.trim()) { setError('Code is required.'); return }
    setSaving(true)
    try {
      const payload = { ...form, amount: Number(form.amount) || 0 }
      if (editingId) payload.id = editingId
      await adminUpsertDiscountCode(payload)
      resetForm()
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(dc) {
    await adminUpsertDiscountCode({ id: dc.id, code: dc.code, description: dc.description, discount_type: dc.discount_type, amount: dc.amount, active: !dc.active })
    await load()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this discount code?')) return
    await adminDeleteDiscountCode(id)
    if (editingId === id) resetForm()
    await load()
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Discount Codes</h1>
        <p className="text-gray-400 mt-0.5 text-sm">Codes apply to any tour at checkout. Percentage or fixed amount off.</p>
      </div>

      {/* Create / edit form */}
      <form onSubmit={handleSave} className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-4">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <Tag className="w-4 h-4 text-blue-400" /> {editingId ? 'Edit code' : 'New code'}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Code</label>
            <input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} className={inputCls} placeholder="SUMMER25" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Description (optional)</label>
            <input value={form.description} onChange={e => set('description', e.target.value)} className={inputCls} placeholder="Summer promo" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Type</label>
            <select value={form.discount_type} onChange={e => set('discount_type', e.target.value)} className={inputCls}>
              <option value="percent">Percentage (%)</option>
              <option value="fixed">Fixed (€)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">{form.discount_type === 'fixed' ? 'Amount (€)' : 'Percent (%)'}</label>
            <input type="number" min="0" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} className={inputCls} />
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer px-3 py-2.5 rounded-xl"
            style={form.active ? { background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' } : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} className="w-4 h-4 rounded accent-green-500" />
            <span className="text-gray-300 text-sm">Active</span>
          </label>
        </div>
        {error && <div className="bg-red-900/40 border border-red-700 rounded-xl p-3 text-red-300 text-sm">{error}</div>}
        <div className="flex gap-2">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {editingId ? 'Save changes' : 'Add code'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm}
              className="px-4 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 text-sm font-medium transition-colors">
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* List */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>
        ) : codes.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">No discount codes yet.</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {codes.map(dc => (
              <div key={dc.id} className="flex items-center gap-4 px-4 py-3.5">
                <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <Tag className={`w-4 h-4 ${dc.active ? 'text-green-400' : 'text-gray-600'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono font-bold">{dc.code}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>{savingsLabel(dc)}</span>
                    {!dc.active && <span className="text-xs text-gray-500">inactive</span>}
                  </div>
                  {dc.description && <p className="text-gray-400 text-xs truncate mt-0.5">{dc.description}</p>}
                </div>
                <button onClick={() => toggleActive(dc)} title={dc.active ? 'Deactivate' : 'Activate'}
                  className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                  style={{ color: dc.active ? '#4ade80' : '#6b7280' }}>
                  {dc.active ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </button>
                <button onClick={() => startEdit(dc)} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(dc.id)} className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-800 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
