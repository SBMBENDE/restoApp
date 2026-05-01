'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { UtensilsCrossed, Download } from 'lucide-react'

const TABLE_COUNT = 10

export default function QRPage() {
  const [baseUrl, setBaseUrl] = useState('')

  useEffect(() => {
    setBaseUrl(window.location.origin)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 shadow-sm flex items-center gap-2">
        <UtensilsCrossed className="text-amber-500" size={24} />
        <h1 className="text-xl font-bold text-gray-800">Le KIRA — QR Codes</h1>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {Array.from({ length: TABLE_COUNT }, (_, i) => i + 1).map((tableId) => (
          <QRCard key={tableId} tableId={String(tableId)} baseUrl={baseUrl} />
        ))}
      </main>
    </div>
  )
}

function QRCard({ tableId, baseUrl }: { tableId: string; baseUrl: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const url = `${baseUrl}/menu/${tableId}`

  useEffect(() => {
    if (!canvasRef.current || !baseUrl) return
    QRCode.toCanvas(canvasRef.current, url, { width: 160, margin: 1 })
  }, [url, baseUrl])

  function download() {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `table-${tableId}-qr.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  return (
    <div className="bg-white rounded-2xl p-4 flex flex-col items-center gap-3 shadow-sm border border-gray-100">
      <p className="font-semibold text-gray-700 text-sm">Table {tableId}</p>
      <canvas ref={canvasRef} className="rounded-lg" />
      <button
        onClick={download}
        className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-800 font-medium"
      >
        <Download size={13} />
        Download
      </button>
    </div>
  )
}
