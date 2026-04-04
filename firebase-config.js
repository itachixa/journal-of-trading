// Firebase Configuration
// Remplacez par vos propres identifiants Firebase

const firebaseConfig = {
    apiKey: "VOTRE_API_KEY",
    authDomain: "votre-projet.firebaseapp.com",
    projectId: "votre-projet",
    storageBucket: "votre-projet.appspot.com",
    messagingSenderId: "VOTRE_SENDER_ID",
    appId: "VOTRE_APP_ID"
};

// Initialize Firebase
// Note: Ces fonctions seront définies par le SDK Firebase loaded
// Cette config est un placeholder - voir les instructions ci-dessous

/*
INSTRUCTIONS DE CONFIGURATION:
============================

1. Créez un projet sur https://console.firebase.google.com

2. Activez l'authentification:
   - Firebase Console → Authentication → Méthode de connexion
   - Activer "Email/Password"

3. Créez une base de données Firestore:
   - Firebase Console → Firestore Database → Créer une base de données
   - Règles: allow read, write: if request.auth != null;

4. Obtenez vos identifiants:
   - Paramètres du projet → Vos apps → Web app (</>)
   - Copiez la configuration

5. Remplacez les valeurs ci-dessus par vos identifiants réels
*/

// Variable globale pour Firebase
var firebaseApp = null;
var auth = null;
var db = null;
var currentUser = null;
var isAdmin = false;

// Fonctions d'authentification
function initFirebase() {
    if (typeof firebase !== 'undefined' && firebase.apps.length === 0) {
        firebaseApp = firebase.initializeApp(firebaseConfig);
        auth = firebaseApp.auth();
        db = firebaseApp.firestore();
        
        // Configurer la persistence
        auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
        
        // Listener d'état d'authentification
        auth.onAuthStateChanged(handleAuthChange);
    }
}

function handleAuthChange(user) {
    currentUser = user;
    if (user) {
        console.log("Utilisateur connecté:", user.email);
        checkAdminStatus(user);
    } else {
        console.log("Aucun utilisateur");
        showLoginScreen();
    }
}

function checkAdminStatus(user) {
    if (db) {
        db.collection("admins").doc(user.uid).get()
            .then(function(doc) {
                isAdmin = doc.exists;
                showMainApp();
            })
            .catch(function(error) {
                console.error("Erreur admin:", error);
                isAdmin = false;
                showMainApp();
            });
    }
}

// Inscription
function signUp(email, password) {
    return auth.createUserWithEmailAndPassword(email, password)
        .then(function(userCredential) {
            // Créer le profil utilisateur
            return db.collection("users").doc(userCredential.user.uid).set({
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                initialCapital: 10000,
                role: "user"
            });
        });
}

// Connexion
function signIn(email, password) {
    return auth.signInWithEmailAndPassword(email, password);
}

// Déconnexion
function signOut() {
    return auth.signOut();
}

// Créer un nouveau trade pour l'utilisateur
function saveTradeToUser(trade) {
    if (!currentUser) return Promise.reject("Non connecté");
    
    trade.userId = currentUser.uid;
    trade.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    
    return db.collection("trades").add(trade);
}

// Charger les trades de l'utilisateur
function loadUserTrades(callback) {
    if (!currentUser) return;
    
    db.collection("trades")
        .where("userId", "==", currentUser.uid)
        .orderBy("createdAt", "desc")
        .onSnapshot(function(snapshot) {
            var trades = [];
            snapshot.forEach(function(doc) {
                var trade = doc.data();
                trade.id = doc.id;
                trades.push(trade);
            });
            callback(trades);
        });
}

// Sauvegarder les settings utilisateur
function saveUserSettings(settings) {
    if (!currentUser) return Promise.reject("Non connecté");
    
    return db.collection("users").doc(currentUser.uid).update(settings);
}

// Charger les settings utilisateur
function loadUserSettings(callback) {
    if (!currentUser) return;
    
    db.collection("users").doc(currentUser.uid).get()
        .then(function(doc) {
            if (doc.exists) {
                callback(doc.data());
            }
        });
}

// ADMIN: Charger tous les utilisateurs
function loadAllUsers(callback) {
    if (!isAdmin) return;
    
    db.collection("users").get()
        .then(function(snapshot) {
            var users = [];
            snapshot.forEach(function(doc) {
                users.push({id: doc.id, ...doc.data()});
            });
            callback(users);
        });
}

// ADMIN: Modifier un utilisateur
function updateUser(userId, data) {
    if (!isAdmin) return Promise.reject("Non autorisé");
    
    return db.collection("users").doc(userId).update(data);
}

// ADMIN: Supprimer un utilisateur
function deleteUser(userId) {
    if (!isAdmin) return Promise.reject("Non autorisé");
    
    // Supprimer d'abord tous les trades
    return db.collection("trades").where("userId", "==", userId).get()
        .then(function(snapshot) {
            var batch = db.batch();
            snapshot.forEach(function(doc) {
                batch.delete(doc.ref);
            });
            return batch.commit();
        })
        .then(function() {
            return db.collection("users").doc(userId).delete();
        });
}

// ADMIN: Charger tous les trades
function loadAllTrades(callback) {
    if (!isAdmin) return;
    
    db.collection("trades").orderBy("createdAt", "desc").get()
        .then(function(snapshot) {
            var trades = [];
            snapshot.forEach(function(doc) {
                trades.push({id: doc.id, ...doc.data()});
            });
            callback(trades);
        });
}