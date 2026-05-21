import React, { useEffect } from 'react'
import toast from 'react-hot-toast'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'

const Loading = () => {

  const {nextUrl}=useParams()
  const {axios, authLoaded, getToken}=useAppContext()
  const location=useLocation()
  const navigate=useNavigate()

  useEffect(()=>{
    const confirmPayment = async () => {
      if (!authLoaded) return

      const sessionId = new URLSearchParams(location.search).get('session_id')

      if(sessionId){
        try{
          const token = await getToken()
          if(!token){
            toast.error('Please sign in to confirm your payment')
          } else {
            const { data } = await axios.get(`/api/booking/confirm-payment?session_id=${sessionId}`, {
              headers: { Authorization: `Bearer ${token}` }
            })
            if (data?.warning) {
              toast.error(data.warning)
            }
          }
        }catch(error){
          toast.error(error.response?.data?.message || error.message)
        }
      }

      if(nextUrl){
        navigate('/'+nextUrl, { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    }

    const timeoutId = setTimeout(confirmPayment, 2500)
    return () => clearTimeout(timeoutId)
  },[authLoaded, axios, getToken, location.search, navigate, nextUrl])
    
  return (
    <div className='flex justify-center items-center h-[80vh]'>
     <div className='animate-spin rounded-full h-14 w-14 border-2 border-t-primary'></div>
    </div>
  )
}

export default Loading
