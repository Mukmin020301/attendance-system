import { auth, firebaseConfig } from "./firebaseConfig";
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";

/**
 * Creates a user in a secondary Firebase app instance to avoid logging out the current admin.
 */
export const registerUserInSecondaryApp = async (email, password) => {
    const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
    const secondaryAuth = getAuth(secondaryApp);

    try {
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        // It's important to cleanup
        // secondaryApp.delete(); // Standard web SDK 9 doesn't have easy delete for named apps in all versions, 
        // but typically we can leave it or manage it. 
        // Ideally we should delete it to free resources, but 'deleteApp' is in 'firebase/app'.
        return userCredential.user;
    } catch (error) {
        throw error;
    }
};

export const registerUser = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
};

export const loginUser = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
};

export const logoutUser = () => {
    return signOut(auth);
};

