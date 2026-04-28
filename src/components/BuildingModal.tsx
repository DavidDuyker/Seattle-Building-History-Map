import { useEffect } from 'react'
import type { Building } from '../types/building'

type BuildingModalProps = {
  building: Building | null
  isClosing: boolean
  onClose: () => void
}

export function BuildingModal({ building, isClosing, onClose }: BuildingModalProps) {
  useEffect(() => {
    if (!building) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [building, onClose])

  if (!building) return null

  return (
    <div
      className={`modal-backdrop ${isClosing ? 'modal-closing' : 'modal-open'}`}
      role="presentation"
      onClick={onClose}
    >
      <div className="modal-stack">
        <button
          type="button"
          className="modal-close-outside"
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          aria-label="Close"
        >
          <span className="modal-close-outside-icon" aria-hidden="true">
            ×
          </span>
        </button>
        <div
          className="modal-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="building-modal-title"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="modal-header">
            <div className="modal-header-text">
              <h2 id="building-modal-title">{building.name}</h2>
              {building.address ? (
                <p className="modal-address">{building.address}</p>
              ) : null}
              {building.year ? (
                <p className="modal-address">Built {building.year}</p>
              ) : null}
            </div>
          </header>
          {building.imageUrl ? (
            <img
              className="modal-image"
              src={building.imageUrl}
              alt=""
            />
          ) : null}
          <div
            className="modal-body building-prose"
            // Trusted repo-authored Markdown compiled at build time
            dangerouslySetInnerHTML={{ __html: building.html }}
          />
        </div>
      </div>
    </div>
  )
}
