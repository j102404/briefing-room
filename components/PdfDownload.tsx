'use client'

import { useState } from 'react'

interface PdfDownloadProps {
  targetRef: React.RefObject<HTMLDivElement>
  subject: string
  onBeforeCapture?: () => Promise<void>
}

export default function PdfDownload({ targetRef, subject, onBeforeCapture }: PdfDownloadProps) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    if (!targetRef.current) return
    setLoading(true)

    try {
      // Expand drawer + allow re-render before capture
      if (onBeforeCapture) {
        await onBeforeCapture()
        await new Promise(r => setTimeout(r, 350))
      }

      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])

      const canvas = await html2canvas(targetRef.current, {
        backgroundColor: '#070f1e',
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
      })

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const PAGE_W = pdf.internal.pageSize.getWidth()   // 210 mm
      const PAGE_H = pdf.internal.pageSize.getHeight()  // 297 mm
      const HEADER_H = 24
      const FOOTER_H = 12
      const CONTENT_H = PAGE_H - HEADER_H - FOOTER_H   // usable content height per page

      const date = new Date().toISOString().split('T')[0]
      const mmPerPx = PAGE_W / canvas.width
      const contentHpx = Math.floor(CONTENT_H / mmPerPx)
      const totalPages = Math.ceil(canvas.height / contentHpx)

      const drawHeader = (doc: typeof pdf) => {
        doc.setFillColor(7, 15, 30)
        doc.rect(0, 0, PAGE_W, HEADER_H, 'F')

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(232, 168, 56)
        doc.text('THE BRIEFING ROOM', PAGE_W / 2, 10, { align: 'center' })

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        doc.setTextColor(80, 100, 140)
        doc.text(`${subject.toUpperCase()} · ${date}`, PAGE_W / 2, 17, { align: 'center' })
      }

      const drawFooter = (doc: typeof pdf, pageNum: number) => {
        const y = PAGE_H - 4
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(6)
        doc.setTextColor(50, 70, 100)
        doc.text(
          'Powered by Claude · The Briefing Room · For informational purposes only',
          10,
          y
        )
        doc.text(`${pageNum} / ${totalPages}`, PAGE_W - 10, y, { align: 'right' })
      }

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) pdf.addPage()

        drawHeader(pdf)

        const sliceStartPx = page * contentHpx
        const sliceHeightPx = Math.min(contentHpx, canvas.height - sliceStartPx)

        const sliceCanvas = document.createElement('canvas')
        sliceCanvas.width = canvas.width
        sliceCanvas.height = sliceHeightPx
        const ctx = sliceCanvas.getContext('2d')!
        ctx.drawImage(
          canvas,
          0, sliceStartPx,           // source x,y
          canvas.width, sliceHeightPx, // source w,h
          0, 0,                        // dest x,y
          canvas.width, sliceHeightPx  // dest w,h
        )

        const sliceH = sliceHeightPx * mmPerPx
        pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', 0, HEADER_H, PAGE_W, sliceH)

        drawFooter(pdf, page + 1)
      }

      const safeName = subject.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      pdf.save(`briefing-room-${safeName}-${date}.pdf`)
    } catch (err) {
      console.error('[BriefingRoom] PDF generation failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      aria-label="Download brief as PDF"
      className="flex items-center gap-2 px-4 py-2 border border-white/[0.08] bg-navy-800/50 hover:bg-navy-700/50 text-slate-400 hover:text-slate-300 font-display text-[10px] tracking-[0.14em] uppercase rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <span className="inline-block w-3 h-3 border border-slate-600 border-t-slate-400 rounded-full animate-spin" />
          Generating…
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          Download PDF
        </>
      )}
    </button>
  )
}
