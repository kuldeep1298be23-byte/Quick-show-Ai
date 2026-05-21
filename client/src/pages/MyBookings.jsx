import React from 'react'
import { useState, useEffect, useCallback } from 'react'
import Loading from '../components/Loading'
import BlurCircle from '../components/BlurCircle'
import timeFormat from '../lib/timeFormat'
import {dateFormat} from '../lib/dateFormat'
import { useAppContext } from '../context/AppContext'

const MyBookings = () => {
  const currency=import.meta.env.VITE_CURRENCY

  const { axios,getToken ,user,authLoaded,isSignedIn,image_base_url}= useAppContext();

    const[bookings, setBookings]=useState([])
    const[isLoading, setIsLoading]=useState(true)

    const getMyBookings = useCallback(async ()=>{
      try{
        const token = await getToken();
        if (!token) {
          setBookings([]);
          return;
        }
        const {data} = await axios.get('/api/user/bookings',{
          headers: {Authorization: `Bearer ${token}`}
        })

        if(data.success){
          setBookings(data.bookings || [])
        } else {
          setBookings([])
        }
      }catch(error){
      console.log(error)
      setBookings([])
      } finally {
        setIsLoading(false)
      }
    }, [axios, getToken])

    useEffect(()=>{
      if(!authLoaded){
        return
      }

      if(user && isSignedIn){
        getMyBookings()
      } else {
        setBookings([])
        setIsLoading(false)
      }
    },[authLoaded, user, isSignedIn, getMyBookings])
  
  return  !isLoading ? (
    <div className='relative px-6 md:px-16 lg:px-40 pt-30 md:pt-40 min-h-[80vh]'>
   <BlurCircle top='100px' left='100px' />
   <div>
     <BlurCircle bottom='0px' left='600px' />
   </div>
        <h1 className='text-lg font-semibold mb-4'>My Bookings</h1>

      {bookings.map((item,index)=>{
        const movie = item.show?.movie
        const posterUrl = movie?.poster_path
          ? movie.poster_path.startsWith('http') ? movie.poster_path : image_base_url + movie.poster_path
          : ''
        const bookedSeats = Array.isArray(item.bookedSeats) ? item.bookedSeats : []

        return (
        <div key={index} className='flex flex-col md:flex-row justify-between bg-primary/8 border border-primary/20 rounded-lg mt-4 p-2 max-w-3xl'>

          <div className='flex flex-col md:flex-row'> 
            {posterUrl ? (
              <img src={posterUrl} alt="" className='md:max-w-45 aspect-video h-auto object-cover object-bottom rounded'/>
            ) : (
              <div className='md:w-45 aspect-video rounded bg-primary/10 flex items-center justify-center text-sm text-gray-400'>
                No poster
              </div>
            )}

            <div className="flex flex-col p-4">
               <p className='text-lg font-semibold'> {movie?.title || 'Movie unavailable'}</p>
               <p className='text-gray-400 text-sm'>{movie?.runtime ? timeFormat(movie.runtime) : 'Runtime unavailable'}</p>
               <p className='text-gray-400 text-sm mt-auto'>
                {item.show?.showDateTime ? dateFormat(item.show.showDateTime) : 'Show time unavailable'}
               </p>
            </div>
            </div>
            
            <div className='flex flex-col md:items-end md:text-right justify-between p-4'>
              <div className='flex items-center gap-4'>
                <p className='text-2xl font-semibold mb-3'>{currency}{item.amount}</p>
                 {!item.isPaid && <button className='bg-primary px-4 py-1.5 mb-3 text-sm rounded-full font-medium cursor-pointer'>Pay Now</button>}
              </div>
                    <div>
                           <p><span>Total Tickets:</span>{bookedSeats.length}</p>
                           <p><span className='text-gray-400'> SeatNumber:</span>{bookedSeats.length ? bookedSeats.join(", ") : 'N/A'}</p>
                    </div>
            </div>
          </div>
        )
      })}

      {bookings.length === 0 && isSignedIn && (
        <p className='text-sm text-gray-400'>No bookings found</p>
      )}

      {!isSignedIn && (
        <p className='text-sm text-gray-400'>Please sign in to view your bookings</p>
      )}







    </div>
  ) : <Loading />
}

export default MyBookings 
