import { db } from "./firebaseConfig";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const SETTINGS_DOC_ID = "general"; // Single document for global settings

export const getSettings = async () => {
    try {
        const docRef = doc(db, "settings", SETTINGS_DOC_ID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            // Return default settings or create them
            return { officeLocation: { lat: 3.1390, lng: 101.6869 }, radius: 100 };
        }
    } catch (e) {
        console.error("Error getting settings: ", e);
        return null;
    }
};

export const updateSettings = async (newSettings) => {
    try {
        const docRef = doc(db, "settings", SETTINGS_DOC_ID);
        await setDoc(docRef, newSettings, { merge: true });
        return true;
    } catch (e) {
        console.error("Error updating settings: ", e);
        return false;
    }
};
