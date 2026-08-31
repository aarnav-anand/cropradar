'use client'
import { useEffect, useRef, useState } from 'react'

type Props = {
  onChange: (geojson: any, lat: number, lng: number) => void
}

export default function FarmMap({ onChange }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const drawnLayersRef = useRef<any>(null)
  const [drawn, setDrawn] = useState(false)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Dynamically import Leaflet
    const initMap = async () => {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')

      // Fix default icon issue
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!, {
        center: [20.5937, 78.9629],
        zoom: 5,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map)

      mapInstanceRef.current = map

      // Simple polygon drawing tool
      let points: [number, number][] = []
      let tempMarkers: any[] = []
      let polygon: any = null

      const updatePolygon = () => {
        if (polygon) { map.removeLayer(polygon); polygon = null }
        if (points.length >= 3) {
          polygon = L.polygon(points, {
            color: '#2D6A4F',
            fillColor: '#52B788',
            fillOpacity: 0.3,
            weight: 2,
          }).addTo(map)

          const center = polygon.getBounds().getCenter()
          const geojson = polygon.toGeoJSON()
          onChange(geojson, center.lat, center.lng)
          setDrawn(true)
        }
      }

      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng
        points.push([lat, lng])
        const marker = L.circleMarker([lat, lng], {
          radius: 5, color: '#2D6A4F', fillColor: '#52B788', fillOpacity: 1, weight: 2
        }).addTo(map)
        tempMarkers.push(marker)
        updatePolygon()
      })

      // Clear button
      const ClearControl = L.Control.extend({
        onAdd: () => {
          const btn = L.DomUtil.create('button')
          btn.innerHTML = '✕ Clear farm'
          btn.style.cssText = 'background:white;border:1px solid #ccc;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:12px;'
          L.DomEvent.on(btn, 'click', (ev) => {
            L.DomEvent.stopPropagation(ev)
            points = []
            tempMarkers.forEach(m => map.removeLayer(m))
            tempMarkers = []
            if (polygon) { map.removeLayer(polygon); polygon = null }
            setDrawn(false)
          })
          return btn
        }
      })
      new ClearControl({ position: 'topright' }).addTo(map)
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  return (
    <div className="relative">
      <div ref={mapRef} style={{ height: '380px', width: '100%', borderRadius: '12px', zIndex: 0 }} />
      {!drawn && (
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-xs text-gray-500 px-3 py-1.5 rounded-lg shadow-sm pointer-events-none">
          Click on the map to outline your farm
        </div>
      )}
      {drawn && (
        <div className="absolute bottom-3 left-3 bg-green-600/90 backdrop-blur-sm text-xs text-white px-3 py-1.5 rounded-lg shadow-sm pointer-events-none flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Farm area mapped
        </div>
      )}
    </div>
  )
}
