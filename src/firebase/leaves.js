import { db } from "./firebaseConfig";
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, doc, updateDoc, getDoc, runTransaction } from "firebase/firestore";

// --- Constants ---
export const LEAVE_QUOTA = {
    annual: 12,
    sick: 5
};

// --- Leave Application ---

/**
 * Apply for a leave.
 * @param {string} uid User ID
 * @param {string} type 'annual' | 'sick' | 'emergency'
 * @param {string} startDate YYYY-MM-DD
 * @param {string} endDate YYYY-MM-DD
 * @param {number} daysCount Number of days
 * @param {string} reason Reason for leave
 */
export const applyForLeave = async (uid, type, startDate, endDate, daysCount, reason) => {
    try {
        // 1. Validate Balance locally first (Optional but good UX, real check is in transaction)
        // ... handled in UI or here. Let's do a transaction check to be safe.

        await runTransaction(db, async (transaction) => {
            const userRef = doc(db, "users", uid);
            const userDoc = await transaction.get(userRef);

            if (!userDoc.exists()) {
                throw new Error("User does not exist!");
            }

            const userData = userDoc.data();
            const currentBalance = userData.leaveBalance || { ...LEAVE_QUOTA }; // Default if not set

            // Check Quota (Only for Annual?)
            // Requirement: "No fancy carry forward". "Auto reject if balance tak cukup."
            if (type === 'annual' && (currentBalance.annual || 0) < daysCount) {
                throw new Error(`Insufficient Annual Leave balance. Available: ${currentBalance.annual || 0}, Requested: ${daysCount}`);
            }
            if (type === 'sick' && (currentBalance.sick || 0) < daysCount) {
                // Policy on sick leave overflow? Usually unpaid or emergency. 
                // Simple rule: Reject if not enough.
                throw new Error(`Insufficient Sick Leave balance. Available: ${currentBalance.sick || 0}, Requested: ${daysCount}`);
            }

            // Create Leave Request
            const leaveRef = doc(collection(db, "leaves"));
            transaction.set(leaveRef, {
                uid,
                type,
                startDate,
                endDate,
                daysCount,
                reason,
                status: 'pending',
                appliedAt: serverTimestamp(),
                userName: userData.name || 'Unknown', // Denormalize name for easier display
                userEmail: userData.email
            });

            // Note: We DO NOT deduct balance yet. Balance is deducted upon APPROVAL.
        });

        return { success: true };
    } catch (e) {
        console.error("Error applying for leave:", e);
        return { success: false, error: e.message };
    }
};

// --- Fetching Leaves ---

export const getMyLeaves = async (uid) => {
    try {
        const q = query(
            collection(db, "leaves"),
            where("uid", "==", uid),
            orderBy("appliedAt", "desc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.error("Error fetching my leaves:", e);
        return [];
    }
};

export const getAllLeaves = async (statusFilter = null) => {
    try {
        let q = collection(db, "leaves");
        if (statusFilter) {
            q = query(q, where("status", "==", statusFilter), orderBy("appliedAt", "desc"));
        } else {
            q = query(q, orderBy("appliedAt", "desc"));
        }
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.error("Error fetching all leaves:", e);
        return [];
    }
};

// --- Approval Process ---

/**
 * Approve or Reject a leave request.
 * @param {string} leaveId 
 * @param {string} status 'approved' | 'rejected'
 * @param {string} adminUid ID of admin performing action
 */
export const updateLeaveStatus = async (leaveId, status, adminUid) => {
    if (!['approved', 'rejected'].includes(status)) return { success: false, error: "Invalid status" };

    try {
        await runTransaction(db, async (transaction) => {
            const leaveRef = doc(db, "leaves", leaveId);
            const leaveDoc = await transaction.get(leaveRef);

            if (!leaveDoc.exists()) throw new Error("Leave request not found");
            const leaveData = leaveDoc.data();

            if (leaveData.status !== 'pending') throw new Error("Leave request is already processed");

            if (status === 'approved') {
                // Deduct Balance
                const userRef = doc(db, "users", leaveData.uid);
                const userDoc = await transaction.get(userRef);

                if (!userDoc.exists()) throw new Error("User not found");
                const userData = userDoc.data();
                const balance = userData.leaveBalance || { ...LEAVE_QUOTA };

                if (leaveData.type === 'annual') {
                    if (balance.annual < leaveData.daysCount) throw new Error("User has insufficient Annual Leave balance");
                    balance.annual -= leaveData.daysCount;
                } else if (leaveData.type === 'sick') {
                    if (balance.sick < leaveData.daysCount) throw new Error("User has insufficient Sick Leave balance");
                    balance.sick -= leaveData.daysCount;
                }

                // Update User Balance
                transaction.update(userRef, { leaveBalance: balance });
            }

            // Update Leave Status
            transaction.update(leaveRef, {
                status: status,
                processedBy: adminUid,
                processedAt: serverTimestamp()
            });
        });

        return { success: true };
    } catch (e) {
        console.error("Error updating leave status:", e);
        return { success: false, error: e.message };
    }
};

// --- Balance Helper ---
export const initializeLeaveBalance = async (uid) => {
    try {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            leaveBalance: { ...LEAVE_QUOTA }
        });
        return { success: true };
    } catch (e) {
        console.error("Error init balance:", e);
        return { success: false, error: e.message };
    }
}
