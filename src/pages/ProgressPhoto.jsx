import { useState, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { Image, Upload, Trash2, X, ChevronLeft, ChevronRight, Calendar, RefreshCw } from 'lucide-react'
import { formatDateShort } from '../utils/helpers'

export default function ProgressPhoto() {
  const { state, dispatch } = useApp()
  const { progressPhotos } = state
  const fileInputRef = useRef(null)
  const [compareMode, setCompareMode] = useState(false)
  const [selectedBefore, setSelectedBefore] = useState(null)
  const [selectedAfter, setSelectedAfter] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [sliderPos, setSliderPos] = useState(50)
  const [note, setNote] = useState('')
  const [showUploadForm, setShowUploadForm] = useState(false)

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        dispatch({
          type: 'ADD_PROGRESS_PHOTO',
          payload: {
            imageUrl: reader.result,
            date: new Date().toISOString().split('T')[0],
            note: note,
          }
        })
        setNote('')
        setShowUploadForm(false)
        setUploading(false)
      }
      reader.readAsDataURL(file)
    })
  }

  const sortedPhotos = [...progressPhotos].sort((a, b) => new Date(a.date) - new Date(b.date))

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title text-xl">Progress Photo</h1>
          <p className="section-subtitle">Dokumentasi perjalanan bulkingmu secara visual</p>
        </div>
        <div className="flex gap-2">
          {progressPhotos.length >= 2 && (
            <button onClick={() => setCompareMode(!compareMode)}
              className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${compareMode ? 'border-blue-500 text-blue-500' : 'border-[var(--border-color)] text-[var(--text-secondary)]'}`}
              style={{ background: compareMode ? 'rgba(59,130,246,0.08)' : 'var(--bg-secondary)' }}>
              <span className="flex items-center gap-1.5"><RefreshCw size={14} /> Compare</span>
            </button>
          )}
          <button onClick={() => setShowUploadForm(true)} className="btn-primary px-3 py-2">
            <Upload size={16} />
          </button>
        </div>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <div className="card p-5 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Upload Foto Progress</h3>
            <button onClick={() => setShowUploadForm(false)}>
              <X size={18} style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="label">Catatan (opsional)</label>
              <input type="text" className="input-field" placeholder="Contoh: Bulan pertama bulking"
                value={note} onChange={e => setNote(e.target.value)} />
            </div>
            <div
              className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors"
              style={{ borderColor: 'var(--border-color)' }}
              onClick={() => fileInputRef.current?.click()}>
              <div className="w-14 h-14 rounded-2xl gradient-green flex items-center justify-center mx-auto mb-3"
                   style={{ boxShadow: '0 4px 16px rgba(34,197,94,0.3)' }}>
                <Image size={26} color="white" />
              </div>
              <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>Pilih Foto</div>
              <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>JPG, PNG, WEBP · Bisa multiple</div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                   onChange={handleFileChange} />
          </div>
        </div>
      )}

      {/* Compare Mode */}
      {compareMode && progressPhotos.length >= 2 && (
        <div className="card p-5 animate-slide-up">
          <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Before vs After Comparison</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="label">Before (Sebelum)</label>
              <select className="input-field" value={selectedBefore || ''}
                onChange={e => setSelectedBefore(e.target.value)}>
                <option value="">Pilih foto...</option>
                {sortedPhotos.map((p, i) => (
                  <option key={p.id} value={i}>{formatDateShort(p.date)} {p.note ? `- ${p.note}` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">After (Sesudah)</label>
              <select className="input-field" value={selectedAfter || ''}
                onChange={e => setSelectedAfter(e.target.value)}>
                <option value="">Pilih foto...</option>
                {sortedPhotos.map((p, i) => (
                  <option key={p.id} value={i}>{formatDateShort(p.date)} {p.note ? `- ${p.note}` : ''}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedBefore !== null && selectedAfter !== null && selectedBefore !== selectedAfter && (
            <div>
              {/* Side by side comparison */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="badge badge-blue mb-2">Before</div>
                  <img src={sortedPhotos[selectedBefore]?.imageUrl} alt="before"
                    className="w-full rounded-xl object-cover" style={{ height: '250px' }} />
                  <div className="text-xs mt-1 text-center" style={{ color: 'var(--text-muted)' }}>
                    {formatDateShort(sortedPhotos[selectedBefore]?.date)}
                  </div>
                </div>
                <div>
                  <div className="badge badge-green mb-2">After</div>
                  <img src={sortedPhotos[selectedAfter]?.imageUrl} alt="after"
                    className="w-full rounded-xl object-cover" style={{ height: '250px' }} />
                  <div className="text-xs mt-1 text-center" style={{ color: 'var(--text-muted)' }}>
                    {formatDateShort(sortedPhotos[selectedAfter]?.date)}
                  </div>
                </div>
              </div>

              {/* Slider comparison */}
              <div className="mt-4">
                <label className="label">Slider Comparison ({sliderPos}%)</label>
                <input type="range" min={0} max={100} value={sliderPos}
                  onChange={e => setSliderPos(Number(e.target.value))}
                  className="w-full accent-green-500" />
                <div className="mt-3 relative overflow-hidden rounded-xl" style={{ height: '280px' }}>
                  <img src={sortedPhotos[selectedAfter]?.imageUrl} alt="after"
                    className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
                    <img src={sortedPhotos[selectedBefore]?.imageUrl} alt="before"
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ width: `${10000/sliderPos}%` }} />
                  </div>
                  <div className="absolute top-0 bottom-0 flex flex-col items-center justify-center"
                       style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}>
                    <div className="w-0.5 h-full bg-white opacity-80" />
                    <div className="absolute w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg"
                         style={{ top: '50%', transform: 'translateY(-50%)' }}>
                      <ChevronLeft size={12} style={{ color: '#1a1a1a' }} />
                      <ChevronRight size={12} style={{ color: '#1a1a1a' }} />
                    </div>
                  </div>
                  <div className="absolute top-2 left-2 badge badge-blue text-xs">BEFORE</div>
                  <div className="absolute top-2 right-2 badge badge-green text-xs">AFTER</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Photo Grid */}
      {progressPhotos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {sortedPhotos.map((photo, i) => (
            <div key={photo.id} className="relative group animate-scale-in"
                 style={{ animationDelay: `${i * 60}ms` }}>
              <div className="rounded-2xl overflow-hidden"
                   style={{ aspectRatio: '3/4' }}>
                <img src={photo.imageUrl} alt={`Progress ${i + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3 rounded-b-2xl"
                   style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}>
                <div className="flex items-center gap-1">
                  <Calendar size={11} color="white" />
                  <span className="text-white text-xs font-semibold">{formatDateShort(photo.date)}</span>
                </div>
                {photo.note && (
                  <div className="text-white/70 text-xs mt-0.5 truncate">{photo.note}</div>
                )}
              </div>
              <button
                onClick={() => dispatch({ type: 'DELETE_PROGRESS_PHOTO', payload: photo.id })}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 size={12} color="white" />
              </button>
              <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center">
                <span className="text-white text-xs font-bold">{i + 1}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card empty-state py-16">
          <div className="w-16 h-16 rounded-2xl gradient-green flex items-center justify-center mx-auto mb-4"
               style={{ boxShadow: '0 8px 24px rgba(34,197,94,0.3)' }}>
            <Image size={30} color="white" />
          </div>
          <div className="font-semibold text-lg mb-1" style={{ color: 'var(--text-secondary)' }}>
            Belum ada foto progress
          </div>
          <div className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            Dokumentasikan perjalanan bulkingmu dengan foto!
          </div>
          <button onClick={() => setShowUploadForm(true)} className="btn-primary mx-auto flex items-center gap-2">
            <Upload size={16} />
            Upload Foto Pertama
          </button>
        </div>
      )}
    </div>
  )
}
