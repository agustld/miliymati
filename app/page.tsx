'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

export default function Home() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })
  const [isPlaying, setIsPlaying] = useState(true)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [showBankDetails, setShowBankDetails] = useState(false)
  const [showUsefulInfo, setShowUsefulInfo] = useState(false)
  const [showCalendarDropdown, setShowCalendarDropdown] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const weddingDate = new Date('2026-03-07T18:00:00').getTime()

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime()
      const distance = weddingDate - now

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        })
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [weddingDate])

  // Initialize audio and load user preference from localStorage
  useEffect(() => {
    const audioElement = audioRef.current
    if (!audioElement) return

    // Configure audio
    audioElement.volume = 0.5
    audioElement.loop = true

    // Event listeners for state management
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => setIsPlaying(false)
    const handleError = (e: Event) => {
      console.error('Audio error:', e)
      setIsPlaying(false)
    }

    audioElement.addEventListener('play', handlePlay)
    audioElement.addEventListener('pause', handlePause)
    audioElement.addEventListener('ended', handleEnded)
    audioElement.addEventListener('error', handleError)

    // Try to autoplay when audio is ready
    const tryAutoplay = async () => {
      try {
        await audioElement.play()
        setIsPlaying(true)
        localStorage.setItem('musicPreference', 'playing')
      } catch (error) {
        // If autoplay fails (browser restriction), try on first user interaction
        setIsPlaying(false)
        const startOnInteraction = async () => {
          try {
            await audioElement.play()
            setIsPlaying(true)
            localStorage.setItem('musicPreference', 'playing')
          } catch (err) {
            console.error('Failed to play audio:', err)
          }
          // Remove listeners after first interaction
          document.removeEventListener('click', startOnInteraction)
          document.removeEventListener('touchstart', startOnInteraction)
          document.removeEventListener('keydown', startOnInteraction)
          window.removeEventListener('scroll', startOnInteraction)
        }
        
        document.addEventListener('click', startOnInteraction, { once: true })
        document.addEventListener('touchstart', startOnInteraction, { once: true })
        document.addEventListener('keydown', startOnInteraction, { once: true })
        window.addEventListener('scroll', startOnInteraction, { once: true, passive: true })
      }
    }

    // Try autoplay when audio can play
    const handleCanPlay = () => {
      if (audioElement.paused) {
        tryAutoplay()
      }
    }

    audioElement.addEventListener('canplay', handleCanPlay, { once: true })
    audioElement.addEventListener('canplaythrough', handleCanPlay, { once: true })

    // Try immediately if already loaded
    if (audioElement.readyState >= 2) {
      tryAutoplay()
    } else {
      audioElement.load()
    }

    return () => {
      audioElement.removeEventListener('play', handlePlay)
      audioElement.removeEventListener('pause', handlePause)
      audioElement.removeEventListener('ended', handleEnded)
      audioElement.removeEventListener('error', handleError)
    }
  }, [])

  const toggleAudio = async () => {
    const audioElement = audioRef.current
    if (!audioElement) return

    try {
      if (isPlaying) {
        audioElement.pause()
        localStorage.setItem('musicPreference', 'paused')
      } else {
        await audioElement.play()
        localStorage.setItem('musicPreference', 'playing')
      }
    } catch (error) {
      console.error('Failed to toggle audio:', error)
      setIsPlaying(false)
      localStorage.setItem('musicPreference', 'paused')
    }
  }

  const addToCalendar = (type: 'google' | 'outlook' | 'office365' | 'apple' | 'yahoo') => {
    const event = {
      title: 'Nuestra Boda - Mili & Mati',
      description: 'Te esperamos para celebrar nuestro día especial\n\nUbicación: Hotel la secundina, Cerrillos, Salta\n\nCómo llegar: https://maps.app.goo.gl/GEyFo9Pbt83HELsc9',
      location: 'Hotel la secundina, Cerrillos, Salta',
      startDate: '20260307T180000',
      endDate: '20260307T230000'
    }

    const urls: Record<typeof type, string> = {
      google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${event.startDate}/${event.endDate}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`,
      outlook: `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(event.title)}&startdt=${event.startDate}&enddt=${event.endDate}&body=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`,
      office365: `https://outlook.office.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(event.title)}&startdt=${event.startDate}&enddt=${event.endDate}&body=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`,
      apple: `data:text/calendar;charset=utf8,BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${event.startDate}\nDTEND:${event.endDate}\nSUMMARY:${event.title}\nDESCRIPTION:${event.description}\nLOCATION:${event.location}\nEND:VEVENT\nEND:VCALENDAR`,
      yahoo: `https://calendar.yahoo.com/?v=60&view=d&type=20&title=${encodeURIComponent(event.title)}&st=${event.startDate}&dur=0500&desc=${encodeURIComponent(event.description)}&in_loc=${encodeURIComponent(event.location)}`
    }

    if (type === 'apple') {
      const link = document.createElement('a')
      link.href = urls[type]
      link.download = 'event.ics'
      link.click()
    } else {
      window.open(urls[type], '_blank')
    }
  }

  return (
    <main className="min-h-screen watercolor-bg text-gray-800">
      {/* Audio Element */}
      <audio
        ref={audioRef}
        src="/assets/teddy.mp3"
        preload="auto"
        style={{ display: 'none' }}
      />

      {/* Floating Play Music Button */}
      <button
        onClick={toggleAudio}
        className="fixed top-4 right-4 z-50 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all duration-300 flex items-center justify-center hover:shadow-xl"
        aria-label={isPlaying ? 'Pausar música' : 'Reproducir música'}
      >
        {isPlaying ? (
          <svg className="w-6 h-6 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
          </svg>
        ) : (
          <svg className="w-6 h-6 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        )}
      </button>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/assets/portada.jpg"
            alt="Portada"
            fill
            className="object-cover"
            priority
          />
        </div>
        
        {/* Floral decorative elements */}
        <div className="floral-top"></div>
        <div className="floral-bottom"></div>

        <div className="relative z-10 text-center max-w-4xl">
          {/* Names */}
          <div className="mb-8">
            <div className="relative w-full max-w-2xl mx-auto mb-6">
              <Image
                src="/assets/MiliMati.png"
                alt="Mili & Mati"
                width={340}
                height={450}
                className="w-[340px] h-[450px] object-contain mx-auto"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Countdown Timer Section */}
      <section className="py-12 md:py-16 px-4" style={{ backgroundColor: 'var(--color-secundario)' }}>
        <div className="container mx-auto max-w-6xl text-center">
          <p className="font-montserrat text-lg md:text-xl mb-8 text-white" style={{ fontWeight: 300 }}>
            Bienvenidos a nuestra boda
          </p>
          
          {/* Countdown Timer */}
          <div className="flex justify-center items-center gap-3 md:gap-4 text-center">
            <div className="flex flex-col items-center">
              <div className="font-light font-montserrat mb-2 text-white" style={{ fontSize: '45px', lineHeight: '1.2', fontWeight: 300 }}>{String(timeLeft.days).padStart(2, '0')}</div>
              <div className="text-white" style={{ fontSize: '14px', fontWeight: 300 }}>días</div>
            </div>
            <div className="font-light text-white" style={{ fontSize: '45px', lineHeight: '1.2', fontWeight: 300 }}>:</div>
            <div className="flex flex-col items-center">
              <div className="font-light font-montserrat mb-2 text-white" style={{ fontSize: '45px', lineHeight: '1.2', fontWeight: 300 }}>{String(timeLeft.hours).padStart(2, '0')}</div>
              <div className="text-white" style={{ fontSize: '14px', fontWeight: 300 }}>hs</div>
            </div>
            <div className="font-light text-white" style={{ fontSize: '45px', lineHeight: '1.2', fontWeight: 300 }}>:</div>
            <div className="flex flex-col items-center">
              <div className="font-light font-montserrat mb-2 text-white" style={{ fontSize: '45px', lineHeight: '1.2', fontWeight: 300 }}>{String(timeLeft.minutes).padStart(2, '0')}</div>
              <div className="text-white" style={{ fontSize: '14px', fontWeight: 300 }}>min</div>
            </div>
            <div className="font-light text-white" style={{ fontSize: '45px', lineHeight: '1.2', fontWeight: 300 }}>:</div>
            <div className="flex flex-col items-center">
              <div className="font-light font-montserrat mb-2 text-white" style={{ fontSize: '45px', lineHeight: '1.2', fontWeight: 300 }}>{String(timeLeft.seconds).padStart(2, '0')}</div>
              <div className="text-white" style={{ fontSize: '14px', fontWeight: 300 }}>seg</div>
            </div>
          </div>
        </div>
      </section>

      {/* Ceremony & Party Section */}
      <section id="ceremonia-fiesta" className="min-h-screen flex items-center py-8 md:py-12 px-4" style={{ backgroundColor: '#fff' }}>
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-start">
            {/* Ceremony Column */}
            <div id="ceremonia" className="flex flex-col items-center text-center h-full">
              <div className="mb-6">
                <Image src="/assets/icono-ceremonia.svg" alt="Ceremonia" width={150} height={150} />
              </div>
              <h2 className="font-montserrat text-3xl md:text-4xl font-light text-gray-800 mb-8 uppercase tracking-wider" style={{ letterSpacing: '3px' }}>
                Ceremonia
              </h2>
              <div className="space-y-3 mb-8 flex-grow">
                <p className="font-montserrat text-lg md:text-xl text-gray-800" style={{ fontWeight: 300 }}>7 de Marzo</p>
                <p className="font-montserrat text-lg md:text-xl text-gray-800" style={{ fontWeight: 300 }}>18:00 hs</p>
                <p className="font-montserrat text-lg md:text-xl text-gray-800" style={{ fontWeight: 300 }}>Hotel la secundina</p>
                <p className="font-montserrat text-lg md:text-xl text-gray-800" style={{ fontWeight: 300 }}>Cerrillos, Salta</p>
              </div>
              <a
                href="https://maps.app.goo.gl/GEyFo9Pbt83HELsc9"
                target="_blank"
                rel="noopener noreferrer"
                className="btn mt-auto inline-block"
                style={{ borderRadius: '30px', textDecoration: 'none' }}
              >
                LLEGAR A LA CEREMONIA
              </a>
            </div>

            {/* Party Column */}
            <div id="fiesta" className="flex flex-col items-center text-center h-full">
              <div className="mb-6">
                <Image src="/assets/icono-fiesta.svg" alt="Fiesta" width={150} height={150} />
              </div>
              <h2 className="font-montserrat text-3xl md:text-4xl font-light text-gray-800 mb-8 uppercase tracking-wider" style={{ letterSpacing: '3px' }}>
                Fiesta
              </h2>
              <div className="space-y-3 mb-8 flex-grow">
                <p className="font-montserrat text-lg md:text-xl text-gray-800" style={{ fontWeight: 300 }}>Después de la ceremonia</p>
                <p className="font-montserrat text-lg md:text-xl text-gray-800" style={{ fontWeight: 300 }}>Hotel la secundina</p>
                <p className="font-montserrat text-lg md:text-xl text-gray-800" style={{ fontWeight: 300 }}>Cerrillos, Salta</p>
                <p className="font-montserrat text-base md:text-lg text-gray-600 mt-4" style={{ fontWeight: 300 }}>
                  ¡Te esperamos!
                </p>
              </div>
              <a
                href="https://maps.app.goo.gl/GEyFo9Pbt83HELsc9"
                target="_blank"
                rel="noopener noreferrer"
                className="btn mt-auto inline-block"
                style={{ borderRadius: '30px', textDecoration: 'none' }}
              >
                LLEGAR A LA FIESTA
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Gifts Section */}
      <section id="regalos" className="min-h-screen py-16 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-3xl md:text-4xl font-light mb-12 text-gray-800 text-center" style={{ letterSpacing: '3px', fontFamily: 'Montserrat, sans-serif' }}>NOSOTROS...</h2>
          
          {/* Photo Gallery */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <div 
                key={num} 
                className="relative aspect-square overflow-hidden rounded-lg cursor-pointer"
                onClick={() => {
                  setSelectedImage(`/assets/Foto_${num}.jpeg`)
                  setCurrentImageIndex(num - 1)
                }}
              >
                <Image
                  src={`/assets/Foto_${num}.jpeg`}
                  alt={`Foto ${num}`}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                  style={{ filter: 'grayscale(100%)' }}
                />
              </div>
            ))}
          </div>

          {/* Image Viewer Modal - Styled like reference */}
          {selectedImage && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ backgroundColor: '#d4b896' }}
              onClick={() => setSelectedImage(null)}
            >
              {/* Background faded images */}
              <div className="absolute inset-0 overflow-hidden">
                {[1, 2, 3, 4, 5, 6].map((num, index) => {
                  if (index === currentImageIndex) return null;
                  const positions = [
                    { top: '10%', left: '5%', width: '120px', height: '150px', rotate: '-5deg' },
                    { top: '30%', left: '2%', width: '150px', height: '100px', rotate: '3deg' },
                    { top: '5%', left: '50%', width: '100px', height: '100px', rotate: '-3deg' },
                    { top: '8%', right: '10%', width: '110px', height: '140px', rotate: '5deg' },
                    { top: '15%', right: '5%', width: '130px', height: '100px', rotate: '-4deg' },
                    { bottom: '20%', right: '8%', width: '120px', height: '160px', rotate: '2deg' },
                  ];
                  const pos = positions[index] || positions[0];
                  return (
                    <div
                      key={num}
                      className="absolute opacity-30"
                      style={{
                        top: pos.top,
                        left: pos.left,
                        right: pos.right,
                        bottom: pos.bottom,
                        width: pos.width,
                        height: pos.height,
                        transform: `rotate(${pos.rotate})`,
                      }}
                    >
                      <Image
                        src={`/assets/Foto_${num}.jpeg`}
                        alt={`Foto ${num}`}
                        fill
                        className="object-cover"
                        style={{ filter: 'grayscale(100%)' }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Main image container */}
              <div className="relative z-10 flex items-center justify-center w-full h-full p-8">
                <div className="relative w-full max-w-4xl aspect-[4/3]">
                  <Image
                    src={selectedImage}
                    alt="Imagen ampliada"
                    fill
                    className="object-contain rounded-lg shadow-2xl"
                    style={{ filter: 'grayscale(100%)' }}
                  />
                </div>
              </div>

              {/* Navigation arrows */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newIndex = currentImageIndex === 0 ? 5 : currentImageIndex - 1;
                  setCurrentImageIndex(newIndex);
                  setSelectedImage(`/assets/Foto_${newIndex + 1}.jpeg`);
                }}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-gray-800/70 hover:bg-gray-800 text-white p-3 rounded"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newIndex = currentImageIndex === 5 ? 0 : currentImageIndex + 1;
                  setCurrentImageIndex(newIndex);
                  setSelectedImage(`/assets/Foto_${newIndex + 1}.jpeg`);
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-gray-800/70 hover:bg-gray-800 text-white p-3 rounded"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Counter */}
              <div className="absolute top-4 left-4 z-20 bg-white/80 px-4 py-2 rounded font-montserrat text-gray-800">
                {currentImageIndex + 1}/6
              </div>

              {/* Control icons */}
              <div className="absolute top-4 right-4 z-20 flex gap-2">
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white/80 hover:bg-white p-2 rounded"
                >
                  <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white/80 hover:bg-white p-2 rounded"
                >
                  <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white/80 hover:bg-white p-2 rounded"
                >
                  <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(null);
                  }}
                  className="bg-white/80 hover:bg-white p-2 rounded"
                >
                  <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Collaboration Section - Full Width */}
        <div className="w-full py-12 px-8" style={{ backgroundColor: 'var(--color-primario)' }}>
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col items-center text-center">
              <div className="mb-8">
                <Image src="/assets/icono-regalo.svg" alt="Regalo" width={150} height={150} className="brightness-0 invert" />
              </div>
              <p className="font-montserrat text-lg md:text-xl mb-8 text-white/90" style={{ fontWeight: 300 }}>
                Si deseás realizarnos un regalo podés colaborar con nuestra Luna de Miel...
              </p>
              <button
                onClick={() => setShowBankDetails(!showBankDetails)}
                className="btn-alt"
                style={{ borderRadius: '30px', padding: '10px 40px' }}
              >
                VER DATOS BANCARIOS
              </button>
            </div>

          {/* Modal de Datos Bancarios */}
          {showBankDetails && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowBankDetails(false)}>
              <div className="absolute inset-0 bg-black/50" onClick={(e) => e.stopPropagation()}></div>
              <div 
                className="relative bg-[#f5f0e8] rounded-lg p-8 max-w-md w-full shadow-2xl z-10"
                onClick={(e) => e.stopPropagation()}
                style={{ backgroundColor: '#f5f0e8' }}
              >
                <button
                  onClick={() => setShowBankDetails(false)}
                  className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 text-2xl font-light"
                  style={{ fontSize: '24px', lineHeight: '1' }}
                >
                  ×
                </button>
                
                <div className="space-y-8 mt-4">
                  <div>
                    <h3 className="font-montserrat text-2xl md:text-3xl font-light mb-4" style={{ letterSpacing: '3px', color: 'var(--color-primario)' }}>Datos Bancarios</h3>
                    <div className="space-y-3 font-montserrat text-base md:text-lg text-gray-800" style={{ fontWeight: 300 }}>
                      <p><span className="text-gray-600">* Nombre del Titular:</span> Matias Federico Genovese</p>
                      <p><span className="text-gray-600">Alias:</span> miliymatiboda.com</p>
                      <p><span className="text-gray-600">* DNI:</span> 32165089</p>
                      <p><span className="text-gray-600">* Banco:</span> LEMON</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </section>

      {/* RSVP Section */}
      <section id="rsvp" className="py-12 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="font-montserrat text-3xl md:text-4xl font-light mb-6 text-gray-800 uppercase tracking-wider" style={{ letterSpacing: '3px' }}>CONFIRMACIÓN DE ASISTENCIA</h2>
          <p className="font-montserrat text-base md:text-lg mb-8 text-gray-700" style={{ fontWeight: 300 }}>
            Esperamos que seas parte de esta gran celebración. ¡Confirmanos tu asistencia!
          </p>
          <a
            href="https://wa.me/5493874642108?text=Hola,%20Confirmo%20mi%20asistencia%20a%20la%20boda!"
            target="_blank"
            rel="noopener noreferrer"
            className="btn inline-block"
            style={{ borderRadius: '30px', textDecoration: 'none' }}
          >
            CONFIRMAR ASISTENCIA
          </a>
        </div>
      </section>

      {/* Calendar Integration */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="flex justify-center mb-6">
            <Image src="/assets/icono-calendario.svg" alt="Calendario" width={150} height={150} />
          </div>
          <h2 className="font-montserrat text-3xl md:text-4xl font-light mb-6 text-gray-800" style={{ fontWeight: 300 }}>¡Agendá la fecha en tu calendario!</h2>
          <div className="relative inline-block">
            <button 
              onClick={() => setShowCalendarDropdown(!showCalendarDropdown)}
              className="btn mb-8 flex items-center gap-2" 
              style={{ borderRadius: '30px' }}
            >
              AGENDAR EVENTO
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showCalendarDropdown && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[200px] z-10">
                <button
                  onClick={() => {
                    addToCalendar('google')
                    setShowCalendarDropdown(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left font-montserrat text-sm md:text-base text-gray-800 transition-colors"
                >
                  <Image src="/assets/icons8-calendario-de-google.svg" alt="Google" width={24} height={24} />
                  <span>Google</span>
                </button>
                <button
                  onClick={() => {
                    addToCalendar('outlook')
                    setShowCalendarDropdown(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left font-montserrat text-sm md:text-base text-gray-800 transition-colors"
                >
                  <Image src="/assets/icons8-ms-outlook.svg" alt="Outlook" width={24} height={24} />
                  <span>Outlook</span>
                </button>
                <button
                  onClick={() => {
                    addToCalendar('office365')
                    setShowCalendarDropdown(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left font-montserrat text-sm md:text-base text-gray-800 transition-colors"
                >
                  <Image src="/assets/icons8-oficina-365.svg" alt="Microsoft 365" width={24} height={24} />
                  <span>Microsoft 365</span>
                </button>
                <button
                  onClick={() => {
                    addToCalendar('apple')
                    setShowCalendarDropdown(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left font-montserrat text-sm md:text-base text-gray-800 transition-colors"
                >
                  <Image src="/assets/icons8-mac-os.svg" alt="Apple" width={24} height={24} />
                  <span>Apple</span>
                </button>
                <button
                  onClick={() => {
                    addToCalendar('yahoo')
                    setShowCalendarDropdown(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left font-montserrat text-sm md:text-base text-gray-800 transition-colors"
                >
                  <Image src="/assets/icons8-oficina-365.svg" alt="Yahoo" width={24} height={24} />
                  <span>Yahoo</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Useful Info */}
      <section id="info-util" className="w-full py-12 px-4" style={{ backgroundColor: 'var(--color-primario)' }}>
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="font-montserrat text-3xl md:text-4xl font-light mb-6 text-white uppercase tracking-wider" style={{ letterSpacing: '3px' }}>INFO ÚTIL</h2>
          <p className="font-montserrat text-base md:text-lg mb-8 text-white/90" style={{ fontWeight: 300 }}>
            Te dejamos sugerencias de alojamientos y traslados para que aproveches ese fin de semana al máximo.
          </p>
          <button
            onClick={() => setShowUsefulInfo(true)}
            className="btn-alt"
            style={{ borderRadius: '30px', padding: '10px 40px' }}
          >
            VER MÁS
          </button>
        </div>
      </section>

      {/* Modal de Info Útil */}
      {showUsefulInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowUsefulInfo(false)}>
          <div className="absolute inset-0 bg-black/50" onClick={(e) => e.stopPropagation()}></div>
          <div 
            className="relative bg-white rounded-lg p-8 max-w-2xl w-full shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowUsefulInfo(false)}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 text-2xl font-light"
              style={{ fontSize: '24px', lineHeight: '1' }}
            >
              ×
            </button>
            
            <div className="space-y-8 mt-4">
              <div>
                <h3 className="font-montserrat text-2xl md:text-3xl font-light mb-4" style={{ letterSpacing: '3px', color: 'var(--color-primario)' }}>Hoteles</h3>
                <div className="space-y-6 font-montserrat text-base md:text-lg text-gray-800" style={{ fontWeight: 300 }}>
                  <div>
                    <p className="font-semibold mb-1 text-gray-800" style={{ fontWeight: 600 }}>Hotel El Creston II</p>
                    <p className="text-gray-600">387154132844</p>
                    <a href="https://maps.app.goo.gl/W8Ub8wwWifU9yxpY6" target="_blank" rel="noopener noreferrer" className="mt-2 text-blue-600 hover:text-blue-800 underline block">Cómo llegar</a>
                  </div>
                  <div>
                    <p className="font-semibold mb-1 text-gray-800" style={{ fontWeight: 600 }}>Hostal Los Tarcos</p>
                    <p className="text-gray-600">3875378140</p>
                    <a href="https://maps.app.goo.gl/9Sod1fDejX6U9QfWA" target="_blank" rel="noopener noreferrer" className="mt-2 text-blue-600 hover:text-blue-800 underline block">Cómo llegar</a>
                  </div>
                  <div>
                    <p className="font-semibold mb-1 text-gray-800" style={{ fontWeight: 600 }}>Posta Ruiz Cabañas Urbanas</p>
                    <p className="text-gray-600">3875601617</p>
                    <a href="https://maps.app.goo.gl/gS1YecauKZXjPYoe9" target="_blank" rel="noopener noreferrer" className="mt-2 text-blue-600 hover:text-blue-800 underline block">Cómo llegar</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="pt-8 pb-4 md:pt-12 md:pb-6 px-4 text-center" style={{ backgroundColor: 'var(--color-secundario)' }}>
        <p className="font-montserrat text-lg md:text-xl mb-4 text-white" style={{ fontWeight: 300 }}>
          ¡Gracias por acompañarnos en este momento tan importante!
        </p>
      </footer>
    </main>
  )
}
