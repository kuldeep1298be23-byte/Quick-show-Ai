import React from 'react'
import { useState, useEffect, useCallback } from 'react';
import Loading from '../../components/Loading';
import Title from '../../components/admin/Title';
import { dateFormat } from '../../lib/dateFormat';
import { useAppContext } from '../../context/AppContext';

const ListBookings = () => {
  const currency=import.meta.env.VITE_CURRENCY

  const { axios, getToken, user}= useAppContext()

  const[bookings,setBookings]=useState([]);
  const[isloading,setIsLoading]=useState(true);
  
  const getAllBookings=useCallback(async()=>{
    try{
       const {data}= await axios.get("/api/admin/all-bookings",{
        headers: { Authorization: `Bearer ${await getToken()}`}
       });
       setBookings(data.success ? data.bookings || [] : [])
    } catch (error){
        console.error(error);
        setBookings([]);
    } finally {
      setIsLoading(false)
    }
  }, [axios, getToken]);

useEffect(()=>{
  if(user){
  getAllBookings();
  }
}, [user, getAllBookings]);


  return !isloading?(
    <>
      < Title text1="List" text2="Bookings"/>
      <div className='max-w-4xl mt-6 overflow-x-auto'>
      <table className='w-full border-collapse rounded-md overflow-hidden text-nowrap'>
  <thead>
    <tr className='bg-primary/20 text-left text-white'>
      <th className='p-2 font-medium pl-5'>User Name</th>
      <th className='p-2 font-medium pl-5'>Movie Name</th>
      <th className='p-2 font-medium'>Show Time</th>
      <th className='p-2 font-medium'>Seats Booked</th>
      <th className='p-2 font-medium'> Amount</th>
    </tr>
  </thead>
  <tbody className='text-sm font-light'>
    {bookings.map((item,index)=>(
      <tr key={index} className='border-b border-primary/20 bg-primary/5 even:bg-primary/10'>
        <td className='p-2 min-w-45 pl-5'>{item.user?.name || 'Unknown user'}</td>
        <td className='p-2'>{item.show?.movie?.title || 'Show unavailable'}</td>
        <td className='p-2'>
          {item.show?.showDateTime ? dateFormat(item.show.showDateTime) : 'N/A'}
        </td>
        <td className='p-2'>
          {Array.isArray(item.bookedSeats) ? item.bookedSeats.join(", ") : 'N/A'}
        </td> 
        <td className='p-2'>{currency + item.amount}</td>
      </tr>
    ))}
    {bookings.length === 0 && (
      <tr className='border-b border-primary/20 bg-primary/5'>
        <td className='p-4 text-center text-gray-400' colSpan={5}>
          No bookings found
        </td>
      </tr>
    )}

  </tbody>
  </table>
  </div>
    </>
  ) : <Loading/>
}

export default ListBookings 
