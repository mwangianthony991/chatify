const getLocalTimeFromFirestoreDateObj = (date) => {
    // Given a Firestore Date object get the local timezone time
    try {
        return date.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    } catch (err) {
        return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    }
}

const getLocalDateFromFirestoreDateObj = (date) => {
    try {
        let dateStr = date.toDate().toLocaleDateString()
        let todayDateStr = new Date().toLocaleDateString()
        if (dateStr === todayDateStr) {
            return "TODAY"
        }
        return dateStr
    } catch (err) {
        let dateStr = date.toLocaleDateString()
        let todayDateStr = new Date().toLocaleDateString()
        if (dateStr === todayDateStr) {
            return "TODAY"
        }
        return dateStr
    }
}

export { getLocalDateFromFirestoreDateObj, getLocalTimeFromFirestoreDateObj };
