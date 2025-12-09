import { db } from "./firebaseConfig";
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, limit, updateDoc, doc } from "firebase/firestore";

export const recordAttendance = async (uid, type, location) => {
    try {
        const attendanceRef = collection(db, "attendance");
        const docRef = await addDoc(attendanceRef, {
            uid,
            type, // 'in' or 'out'
            timestamp: serverTimestamp(),
            location,
            date: new Date().toISOString().split('T')[0] // Simple date string for filtering
        });

        // Update user's lastActive timestamp
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            lastActive: serverTimestamp()
        });

        return { success: true, id: docRef.id };
    } catch (e) {
        console.error("Error recording attendance: ", e);
        return { success: false, error: e.message };
    }
};

export const getTodayAttendance = async (uid) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        // Simplified query: Fetch by UID only, then filter & sort in JS
        // This avoids the need for a Firestore Composite Index
        const q = query(
            collection(db, "attendance"),
            where("uid", "==", uid)
        );
        const querySnapshot = await getDocs(q);
        const allLogs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Filter for today AND Sort by timestamp desc locally
        return allLogs
            .filter(log => log.date === today)
            .sort((a, b) => b.timestamp - a.timestamp);
    } catch (e) {
        console.error("Error getting today's attendance: ", e);
        return [];
    }
};

export const getAllAttendance = async (startDate = null, endDate = null) => {
    try {
        let q = collection(db, "attendance");

        if (startDate && endDate) {
            // Range query
            q = query(q,
                where("date", ">=", startDate),
                where("date", "<=", endDate),
                orderBy("date", "desc"),
                orderBy("timestamp", "desc")
            );
        } else if (startDate) {
            // Single date (backward compatibility or just start date)
            q = query(q, where("date", "==", startDate), orderBy("timestamp", "desc"));
        } else {
            // Default: Last 100 records
            q = query(q, orderBy("timestamp", "desc"), limit(100));
        }

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.error("Error getting all attendance: ", e);
        return [];
    }
};

// --- User Management ---

export const getAllUsers = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.error("Error getting all users: ", e);
        return [];
    }
};

export const updateUserStatus = async (uid, isActive) => {
    try {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, { isActive });
        return { success: true };
    } catch (e) {
        console.error("Error updating user status: ", e);
        return { success: false, error: e.message };
    }
};
