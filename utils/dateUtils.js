// --- Date Utility Functions ---
function getNYDateString(date) {
    if (!date || !(date instanceof Date) || isNaN(date)) {
        return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    }
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

function getNYWeekString(date) {
    const nyDate = new Date((date || new Date()).toLocaleString("en-US", {timeZone: "America/New_York"}));
    const d = new Date(Date.UTC(nyDate.getFullYear(), nyDate.getMonth(), nyDate.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

module.exports = { getNYDateString, getNYWeekString };
