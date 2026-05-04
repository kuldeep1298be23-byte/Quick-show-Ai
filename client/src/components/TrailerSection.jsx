import React, { useState } from 'react'
import { dummyTrailers } from '../assets/assets'
import BlurCircle from './BlurCircle'
import { PlayCircleIcon } from 'lucide-react'

const TrailerSection = () => {
  const [currentTrailer, setCurrentTrailer] = useState(dummyTrailers[0])

  return (
    <div className='px-6 md:px-16 lg:px-24 xl:px-44 py-20'>
      <p className='text-gray-300 font-medium text-lg max-w-[960px] mx-auto'>
        Trailers
      </p>

      <div className='relative mt-6'>
        <BlurCircle top='-100px' right='-100px' />

        <div className='mx-auto max-w-[960px] aspect-video bg-black rounded-lg overflow-hidden'>
          <iframe
            key={currentTrailer.videoUrl}
            src={currentTrailer.videoUrl}
            className='w-full h-full'
            frameBorder='0'
            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
            allowFullScreen
          />
        </div>
      </div>

      <div className='grid grid-cols-4 gap-4 md:gap-8 mt-8 max-w-3xl mx-auto'>
        {dummyTrailers.map(trailer => (
          <div
            key={trailer.image}
            onClick={() => setCurrentTrailer(trailer)}
            className='relative cursor-pointer hover:-translate-y-1 transition'
          >
            <img
              src={trailer.image}
              className='rounded-lg w-full h-full object-cover brightness-75'
            />
            <PlayCircleIcon
              className='absolute top-1/2 left-1/2 w-6 h-6 md:w-12 md:h-12 -translate-x-1/2 -translate-y-1/2'
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default TrailerSection
