// --- Date Utility Functions ---
function getNYDateString(date) {
    if (!date || !(date instanceof Date) || isNaN(date)) {
        return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    }
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

module.exports = { getNYDateString };
