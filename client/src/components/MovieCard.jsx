import { StarIcon } from 'lucide-react'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import timeFormat from '../lib/timeFormat'
import { useAppContext } from '../context/AppContext'

const MovieCard = ({movie}) => {
    const navigate = useNavigate()
    const {image_base_url}=useAppContext()
    const movieId = movie?._id || movie?.id
    const backdropUrl = movie?.backdrop_path
        ? movie.backdrop_path.startsWith('http') ? movie.backdrop_path : image_base_url + movie.backdrop_path
        : ''
    const releaseYear = movie?.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'
    const genres = Array.isArray(movie?.genres) ? movie.genres.slice(0, 2).map(genre => genre.name).join(' | ') : 'N/A'
    const runtime = movie?.runtime ? timeFormat(movie.runtime) : 'N/A'
    const rating = Number(movie?.vote_average || 0).toFixed(1)

  return (
    <div className='flex flex-col justify-between p-3 bg-gray-800 rounded-2xl hover:-translate-y-1 transition duration-300 w-66'>

        {backdropUrl ? (
            <img onClick={()=>{navigate(`/movies/${movieId}`); scrollTo(0,0)}}  
            src={backdropUrl} alt="" className='rounded-lg h-52 w-full object-cover object-right-bottom cursor-pointer'/>
        ) : (
            <div onClick={()=>{navigate(`/movies/${movieId}`); scrollTo(0,0)}} className='rounded-lg h-52 w-full bg-primary/10 flex items-center justify-center text-sm text-gray-400 cursor-pointer'>
                No image
            </div>
        )}

        <p className='font-semibold mt-2 truncate'>{movie?.title || 'Movie unavailable'}</p>
        <p className='text-sm text-gray-400 mt-2'>
            {releaseYear} . {genres} . {runtime}
            </p> 

            <div className='flex items-center justify-between mt-4 pb-3'>
                <button  onClick={()=>{navigate(`/movies/${movieId}`); scrollTo(0,0)}}   className='px-4 py-2 text-xs bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer'> Buy Tickets</button>
                <p className='flex items-center gap-1'>
                    <StarIcon className='w-4 h-4 text-primary fill-primary'/>
                    {rating}
                </p>
            </div>

    </div>
  )
}

export default MovieCard
