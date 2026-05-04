
const timeFormat=(minutes)=>{
    if (!Number.isFinite(Number(minutes)) || Number(minutes) <= 0) return 'N/A';
    minutes = Number(minutes);
    const hours=Math.floor(minutes/60);
    const minutesRemainder = minutes%60;
    return `${hours}h ${minutesRemainder}m`
}
export default timeFormat;
