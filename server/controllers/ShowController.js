
import axios from 'axios';
import Movie from '../models/Movie.js';
import Show from '../models/Show.js';



//api to get now playing movies from tmdb api
export const getNowPlayingMovies =async(req, res)=>{
  try{
    
            const { data } =await axios.get('https://api.themoviedb.org/3/movie/now_playing',{
            headers: {Authorization : `Bearer ${process.env.TMDB_API_KEY}`}
        })

      const movies =data.results;
      res.json({success: true,movies:movies || []})
  } catch(error){
    console.error(error);
    res.json({success: false, message:error.message})
  }
}

//api to add a new show to the database

export const addShow = async(req, res)=>{
    try{
              const {movieId,showsInput,showPrice}=req.body
              if (!movieId || !Array.isArray(showsInput) || showsInput.length === 0 || !Number(showPrice)) {
                return res.status(400).json({success: false, message: 'Missing required show details'})
              }

              let movie=await Movie.findById(movieId)
              if(!movie){
                if (!process.env.TMDB_API_KEY) {
                    return res.status(500).json({success: false, message: 'TMDB API key is not configured'})
                }
                //fetch movie details from tmdb api
                 const[movieDetailsResponse, movieCreditsResponse]=await Promise.all([

                    axios.get(`https://api.themoviedb.org/3/movie/${movieId}`,{
                        headers: {Authorization: `Bearer ${process.env.TMDB_API_KEY}`}  }),


                        axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`,{
                            headers: {Authorization: `Bearer ${process.env.TMDB_API_KEY}`} })
                 ]);

                 const movieApiData=movieDetailsResponse.data;
                const movieCreditsData=movieCreditsResponse.data;
                  

                const movieDetails={
                    _id:movieId,
                    title: movieApiData.title,
                    year: Number(movieApiData.release_date?.split('-')[0]) || new Date().getFullYear(),
                    overview:movieApiData.overview || "No overview available.",
                    poster_path:movieApiData.poster_path || "",
                    backdrop_path:movieApiData.backdrop_path || "",
                    genres:movieApiData.genres || [],
                    casts:movieCreditsData.cast || [],
                    release_date:movieApiData.release_date || "",
                    original_language:movieApiData.original_language,
                    tagline:movieApiData.tagline || "",
                    vote_average:movieApiData.vote_average || 0,
                    runtime:movieApiData.runtime || 0,
                    
                }

               // add movie to the database

                movie=await Movie.create(movieDetails);

              }
              const showsToCreate =[];
              showsInput.forEach(show=>{
                const showDate=show.date;
                if (!showDate || !Array.isArray(show.time)) return;
                show.time.forEach((time)=>{
const dateTimeString = `${showDate}T${time}:00+05:30`; // IST fix
                    const showDateTime = new Date(dateTimeString);
                    if (Number.isNaN(showDateTime.getTime())) return;
                    showsToCreate.push({
                        movie:movieId,
                        showDateTime,
                        showPrice,
                        occupiedSeats:{}
                })
              })
            });

            if(showsToCreate.length>0){
                await Show.insertMany(showsToCreate)
            } else {
                return res.status(400).json({success: false, message: 'Please select a valid date and time'})
            }

            res.json({success: true, message: 'Show Added successfully.'})

    } catch (error){
        console.error(error);
        res.json({success: false, message:error.message})
    }
}


//api to get all shows from the database
export const getShows = async(req,res)=>{
    try{
           const shows = await Show.find({}).populate('movie');
           const uniqueMovies = new Map();

        shows.forEach(show=>{
            if (show.movie) {
                uniqueMovies.set(show.movie._id.toString(), show.movie);
            }
        });

        return res.json({
            success:true,
            shows: Array.from(uniqueMovies.values())
        });
    } catch(error){
         console.error(error);
         res.json({success:false, message:error.message})
         
    }
}
//api to get a single show from the database

export const getShow=async(req,res)=>{
 try{
    const {movieId}=req.params;
   //get all upcoming shows for the movie
const shows = await Show.find({
   movie: movieId
});

    const movie=await Movie.findById(movieId);
    if (!movie) {
        return res.status(404).json({success:false, message:"Movie not found"})
    }
    const dateTime={};

    shows.forEach((show)=>{

    const date = show.showDateTime.toISOString().split('T')[0];
        if(!dateTime[date]){
            dateTime[date]=[];
        }
        dateTime[date].push({time: show.showDateTime, showId: show._id});
    })
    res.json({success:true,movie,dateTime})

 }catch (error){
    console.error(error);
    res.json({success:false, message:error.message})
    
 }
}
