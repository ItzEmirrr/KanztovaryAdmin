import { useEffect, useRef, useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import type { IScannerControls } from '@zxing/browser'

interface CameraScannerProps {
  onDetected: (code: string) => void
}

type ScanState = 'idle' | 'loading' | 'scanning' | 'error'

export function CameraScanner({ onDetected }: CameraScannerProps) {
  const videoRef    = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)

  const [scanState, setScanState] = useState<ScanState>('idle')
  const [errorMsg,  setErrorMsg]  = useState('')

  // Stop camera on unmount
  useEffect(() => () => { controlsRef.current?.stop() }, [])

  async function startCamera() {
    setScanState('loading')
    setErrorMsg('')
    try {
      const reader = new BrowserMultiFormatReader()
      const controls = await reader.decodeFromVideoDevice(
        undefined,          // use default / rear camera
        videoRef.current!,
        (result, _err, ctrl) => {
          if (result) {
            ctrl.stop()
            controlsRef.current = null
            setScanState('idle')
            onDetected(result.getText())
          }
        }
      )
      controlsRef.current = controls
      setScanState('scanning')
    } catch {
      setScanState('error')
      setErrorMsg('Не удалось получить доступ к камере. Проверьте разрешения браузера.')
    }
  }

  function stopCamera() {
    controlsRef.current?.stop()
    controlsRef.current = null
    setScanState('idle')
  }

  return (
    <div className="space-y-3">
      {scanState === 'idle' && (
        <button onClick={startCamera} className="btn-primary w-full justify-center gap-2">
          <Camera size={16} />
          Включить камеру
        </button>
      )}

      {/* Video always rendered (hidden when not active) so ref stays valid */}
      <div
        className={`relative rounded-xl overflow-hidden bg-black ${
          scanState === 'loading' || scanState === 'scanning' ? '' : 'hidden'
        }`}
        style={{ aspectRatio: '4/3' }}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {scanState === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <Loader2 size={36} className="text-white animate-spin" />
          </div>
        )}

        {scanState === 'scanning' && (
          <>
            {/* Targeting frame */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-52 h-52">
                <div className="absolute inset-0 border border-white/15 rounded-lg" />
                <div className="absolute top-0 left-0  w-6 h-6 border-t-2 border-l-2 border-violet-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-violet-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0  w-6 h-6 border-b-2 border-l-2 border-violet-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-violet-400 rounded-br-lg" />
                <div
                  className="absolute inset-x-4 h-px bg-violet-400/70"
                  style={{ animation: 'scanLine 2s ease-in-out infinite', top: '50%' }}
                />
              </div>
            </div>
            <p className="absolute bottom-3 inset-x-0 text-center">
              <span className="text-xs text-white bg-black/70 px-3 py-1 rounded-full">
                Наведите на штрих-код или QR
              </span>
            </p>
            <button
              onClick={stopCamera}
              className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
            >
              Остановить
            </button>
          </>
        )}
      </div>

      {scanState === 'error' && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-5 text-center space-y-3">
          <p className="text-sm text-red-400">{errorMsg}</p>
          <button
            onClick={startCamera}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      )}
    </div>
  )
}
