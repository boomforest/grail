import React, { useState, useEffect } from 'react'

const S = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #fef7ed, #fed7aa)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    padding: '1.5rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  title: { fontSize: '1.5rem', fontWeight: '800', color: '#8b4513', margin: 0 },
  card: {
    background: 'rgba(255,255,255,0.85)',
    borderRadius: '16px',
    padding: '1.5rem',
    marginBottom: '1.25rem',
    boxShadow: '0 4px 20px rgba(139,69,19,0.1)',
  },
  label: { display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#8b4513', marginBottom: '0.4rem' },
  input: {
    width: '100%', padding: '0.75rem 1rem', border: '1.5px solid rgba(210,105,30,0.3)',
    borderRadius: '10px', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.9)',
  },
  textarea: {
    width: '100%', padding: '0.75rem 1rem', border: '1.5px solid rgba(210,105,30,0.3)',
    borderRadius: '10px', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.9)', resize: 'vertical', minHeight: '80px',
  },
  btn: {
    padding: '0.75rem 1.5rem', borderRadius: '25px', border: 'none',
    fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer',
  },
  btnPrimary: { background: 'rgba(210,105,30,0.85)', color: 'white' },
  btnGhost: { background: 'transparent', border: '1px solid rgba(139,69,19,0.3)', color: '#8b4513' },
  row: { display: 'flex', gap: '1rem', marginBottom: '1rem' },
  flyerBox: {
    width: '100%', aspectRatio: '3/4', maxWidth: '220px', borderRadius: '12px',
    border: '2px dashed rgba(210,105,30,0.4)', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    background: 'rgba(255,255,255,0.5)', overflow: 'hidden',
  },
  sectionLabel: { fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#a0522d', fontWeight: '700', marginBottom: '1rem' },
}

export default function PromoterDashboard({ user, profile, supabase, onBack, onLogout }) {
  const [shows, setShows]     = useState([])
  const [view, setView]       = useState('list') // list | new | edit
  const [editing, setEditing] = useState(null)
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState('')

  const blank = {
    title: '', venue: '', date: '', time: '', price: '', capacity: '',
    description: '', flyer_url: '', ticket_url: '',
  }
  const [form, setForm] = useState(blank)
  const [flyerFile, setFlyerFile] = useState(null)
  const [flyerPreview, setFlyerPreview] = useState(null)

  useEffect(() => { fetchShows() }, [])

  const fetchShows = async () => {
    const { data } = await supabase
      .from('promoter_shows')
      .select('*')
      .eq('promoter_id', user.id)
      .order('date', { ascending: true })
    setShows(data || [])
  }

  const handleFlyerChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFlyerFile(file)
    setFlyerPreview(URL.createObjectURL(file))
  }

  const uploadFlyer = async () => {
    if (!flyerFile) return form.flyer_url || null
    const ext = flyerFile.name.split('.').pop()
    const path = `flyers/${user.id}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('promoter-assets').upload(path, flyerFile)
    if (error) throw new Error('Flyer upload failed: ' + error.message)
    const { data } = supabase.storage.from('promoter-assets').getPublicUrl(path)
    return data.publicUrl
  }

  const handleSave = async () => {
    if (!form.title || !form.date) { setMsg('Title and date are required.'); return }
    setSaving(true)
    setMsg('')
    try {
      const flyer_url = await uploadFlyer()
      const payload = { ...form, flyer_url: flyer_url || form.flyer_url, promoter_id: user.id }

      if (editing) {
        await supabase.from('promoter_shows').update(payload).eq('id', editing)
      } else {
        await supabase.from('promoter_shows').insert([payload])
      }
      await fetchShows()
      setView('list')
      setForm(blank)
      setFlyerFile(null)
      setFlyerPreview(null)
      setEditing(null)
    } catch (err) {
      setMsg(err.message)
    }
    setSaving(false)
  }

  const handleEdit = (show) => {
    setForm({ ...show })
    setFlyerPreview(show.flyer_url || null)
    setEditing(show.id)
    setView('edit')
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this show?')) return
    await supabase.from('promoter_shows').delete().eq('id', id)
    fetchShows()
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const ShowForm = () => (
    <div style={S.card}>
      <div style={S.sectionLabel}>{editing ? 'Edit Show' : 'New Show'}</div>

      {/* Flyer Upload */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
        <label style={{ ...S.flyerBox }} htmlFor="flyer-upload">
          {flyerPreview
            ? <img src={flyerPreview} alt="flyer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🖼</div>
                <div style={{ fontSize: '0.78rem', color: '#a0522d', textAlign: 'center' }}>Upload flyer</div>
              </>
          }
        </label>
        <input id="flyer-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFlyerChange} />

        <div style={{ flex: 1 }}>
          <label style={S.label}>Show title *</label>
          <input style={{ ...S.input, marginBottom: '0.75rem' }} placeholder="e.g. Noche de Jazz" value={form.title} onChange={set('title')} />
          <label style={S.label}>Venue</label>
          <input style={{ ...S.input, marginBottom: '0.75rem' }} placeholder="Casa de Copas" value={form.venue} onChange={set('venue')} />
        </div>
      </div>

      <div style={S.row}>
        <div style={{ flex: 1 }}>
          <label style={S.label}>Date *</label>
          <input style={S.input} type="date" value={form.date} onChange={set('date')} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={S.label}>Time</label>
          <input style={S.input} type="time" value={form.time} onChange={set('time')} />
        </div>
      </div>

      <div style={{ ...S.row, marginTop: '0.75rem' }}>
        <div style={{ flex: 1 }}>
          <label style={S.label}>Ticket price (MXN)</label>
          <input style={S.input} type="number" placeholder="200" value={form.price} onChange={set('price')} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={S.label}>Capacity</label>
          <input style={S.input} type="number" placeholder="100" value={form.capacity} onChange={set('capacity')} />
        </div>
      </div>

      <div style={{ marginTop: '0.75rem', marginBottom: '0.75rem' }}>
        <label style={S.label}>Description</label>
        <textarea style={S.textarea} placeholder="Tell people about the show..." value={form.description} onChange={set('description')} />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={S.label}>Ticket link (optional)</label>
        <input style={S.input} placeholder="https://..." value={form.ticket_url} onChange={set('ticket_url')} />
      </div>

      {msg && <div style={{ color: '#c0392b', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{msg}</div>}

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button style={{ ...S.btn, ...S.btnPrimary }} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Create show'}
        </button>
        <button style={{ ...S.btn, ...S.btnGhost }} onClick={() => { setView('list'); setForm(blank); setEditing(null); setFlyerPreview(null) }}>
          Cancel
        </button>
      </div>
    </div>
  )

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Promoter Dashboard</h1>
          <div style={{ fontSize: '0.82rem', color: '#a0522d', marginTop: '0.2rem' }}>{profile?.username || user.email}</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button style={{ ...S.btn, ...S.btnGhost, fontSize: '0.82rem', padding: '0.5rem 1rem' }} onClick={onBack}>← Back</button>
          <button style={{ ...S.btn, ...S.btnGhost, fontSize: '0.82rem', padding: '0.5rem 1rem' }} onClick={onLogout}>Sign out</button>
        </div>
      </div>

      {view === 'list' && (
        <>
          <button style={{ ...S.btn, ...S.btnPrimary, marginBottom: '1.5rem' }} onClick={() => { setForm(blank); setView('new') }}>
            + New Show
          </button>

          {shows.length === 0
            ? <div style={{ ...S.card, textAlign: 'center', color: '#a0522d', padding: '3rem' }}>
                No shows yet — create your first one above.
              </div>
            : shows.map(show => (
                <div key={show.id} style={S.card}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    {show.flyer_url && (
                      <img src={show.flyer_url} alt="flyer" style={{ width: '70px', borderRadius: '8px', objectFit: 'cover', aspectRatio: '3/4' }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', color: '#8b4513', fontSize: '1rem' }}>{show.title}</div>
                      <div style={{ fontSize: '0.85rem', color: '#a0522d', marginTop: '0.2rem' }}>
                        {show.venue && `${show.venue} · `}{show.date}{show.time && ` · ${show.time}`}
                      </div>
                      {show.price && <div style={{ fontSize: '0.82rem', color: '#a0522d', marginTop: '0.2rem' }}>MXN ${show.price}</div>}
                      {show.description && <div style={{ fontSize: '0.82rem', color: '#c0854d', marginTop: '0.4rem' }}>{show.description}</div>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <button style={{ ...S.btn, ...S.btnGhost, padding: '0.4rem 0.9rem', fontSize: '0.8rem' }} onClick={() => handleEdit(show)}>Edit</button>
                      <button style={{ ...S.btn, background: 'rgba(192,57,43,0.1)', color: '#c0392b', border: 'none', padding: '0.4rem 0.9rem', fontSize: '0.8rem', borderRadius: '25px', cursor: 'pointer' }} onClick={() => handleDelete(show.id)}>Delete</button>
                    </div>
                  </div>
                </div>
              ))
          }
        </>
      )}

      {(view === 'new' || view === 'edit') && <ShowForm />}
    </div>
  )
}
