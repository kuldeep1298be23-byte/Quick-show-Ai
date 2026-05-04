import { createContext, useCallback, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";


axios.defaults.baseURL = import.meta.env.VITE_BASE_URL || "http://localhost:3000"

export const AppContext=createContext()

export const AppProvider=({ children })=>{

    const [isAdmin, setIsAdmin]=useState(false)
    const [shows, setShows]=useState([])
    const [favoriteMovies, setFavoriteMovies]=useState([])

    const image_base_url =
      import.meta.env.VITE_TMDB_IMAGE_BASE_URL ||
      import.meta.env.VITE_TMDB_IMAGE_url ||
      "https://image.tmdb.org/t/p/original";

    const { user, isLoaded, isSignedIn } = useUser()
    const {getToken}=useAuth()
    const location=useLocation()
    const navigate=useNavigate()

    const getAuthConfig = useCallback(async () => {
        const token = await getToken();
        if (!token) return null;
        return { headers: { Authorization: `Bearer ${token}` } };
    }, [getToken]);

    const fetchIsAdmin = useCallback(async()=>{
        if (!isSignedIn) {
            setIsAdmin(false);
            return;
        }
        if (!location.pathname.startsWith('/admin')) {
            setIsAdmin(false);
            return;
        }
        try{
            const config = await getAuthConfig();
            if (!config) {
                setIsAdmin(false);
                return;
            }

            const {data}=await axios.get('/api/admin/is-admin', config)
            const adminStatus = Boolean(data?.isAdmin && data?.success !== false);
            setIsAdmin(adminStatus)

            if(!adminStatus && location.pathname.startsWith('/admin')){
               navigate('/')
               toast.error('You are not authorized to access admin dashboard')
            }
        } catch (error){
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                setIsAdmin(false);
                return;
            }
            console.error(error)
        }
    }, [getAuthConfig, isSignedIn, location.pathname, navigate])


    const fetchShows=async()=>{
        try{
            const { data }=await axios.get('/api/show/all')
            if(data.success){
                setShows(data.shows)
            }else{
                toast.error(data.message)
            }
        }catch (error){
            console.error(error)
        }
    }

          const fetchFavoriteMovies = useCallback(async ()=>{
            if (!isSignedIn) {
                setFavoriteMovies([]);
                return;
            }
            try{
                const config = await getAuthConfig();
                if (!config) {
                    setFavoriteMovies([]);
                    return;
                }

                const { data }=await axios.get('/api/user/favorites', config)

                if(data.success){
                    setFavoriteMovies(data.movies || [])
                }else{
                    setFavoriteMovies([])
                }
            } catch(error){
                if (axios.isAxiosError(error) && error.response?.status === 401) {
                    setFavoriteMovies([]);
                    return;
                }
                console.error(error)
            }
          }, [getAuthConfig, isSignedIn])



useEffect(()=>{
    fetchShows()
},[])

    useEffect(()=>{
        if(!isLoaded) return;
        fetchFavoriteMovies()
        fetchIsAdmin()
    },[isLoaded, user?.id, location.pathname, fetchFavoriteMovies, fetchIsAdmin])

    const value={
        axios,
        fetchIsAdmin,
        user,
        authLoaded: isLoaded,
        isSignedIn,
        getToken,
        navigate,
        isAdmin,
        shows,
        favoriteMovies,
        fetchFavoriteMovies,
        image_base_url
    }

    return (
        <AppContext.Provider value={value}>
            { children } 
        </AppContext.Provider>
    )
}

export const useAppContext = ()=> useContext(AppContext)
