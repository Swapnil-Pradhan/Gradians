import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app-check.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-analytics.js";
import { getStorage, ref } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";
import { getFirestore, collection, onSnapshot, setDoc, doc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, onAuthStateChanged, TwitterAuthProvider, signInAnonymously, updateProfile, sendEmailVerification, sendPasswordResetEmail, deleteUser, OAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyArLoHYg4rvwuAivpUrHJY0ogqbTCWc4TQ",
  authDomain: "gradians-ai.firebaseapp.com",
  projectId: "gradians-ai",
  storageBucket: "gradians-ai.appspot.com",
  messagingSenderId: "185960299199",
  appId: "1:185960299199:web:7254023a0b50f7f57c640a",
  measurementId: "G-SBRNB56Z1R"
}, app = initializeApp(firebaseConfig), appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider("6LdNP6kpAAAAAJsZk10ZrVwOdiquE2MFWqROm_Wj"),
  isTokenAutoRefreshEnabled: true
}), auth = getAuth(), analytics = getAnalytics(app), db = getFirestore(app), storage = getStorage(),
  name = document.getElementById("newName"), mail = document.getElementById("newMail");

var dbRef, storRef;

export function delAcc() {
  deleteUser(auth.currentUser).then(() => {
    localStorage.clear();
    alert(`Your account is deleted from Gradians AI.`);
    history.go(0);
  }).catch((err) => alert(err.code.substring(5)));
}

auth.useDeviceLanguage();

//Logged in or out?
onAuthStateChanged(auth, (user) => {
  if (user) {
    user.isAnonymous ? Date.now() - user.createdAt > 172800000 ? delAcc() : null : null;
    if (user.emailVerified || user.isAnonymous) {
      mail.value = user.email;
      name.value = user.displayName;
      sign.style.display = "none";

      dbRef = doc(db, "userData", auth.currentUser.uid);
      storRef = ref(storage, auth.currentUser.uid);

      fetch("https://api.ipify.org?format=json").then(response => response.json()).then(async data => {
        await setDoc(dbRef, { IP: data.ip });
      });

      document.getElementById("resetPass").addEventListener("click", () => changePass(auth.currentUser.email));
      name.addEventListener("change", e => changeName(e.target.value, true));

      showHistory();
      //sign out
      document.getElementById("signOut").addEventListener("click", () => confirm(`Do you want to sign out of ${auth.currentUser.email}`) ? auth.signOut().then(() => {
        alert("You're signed out of Gradians AI successfully.");
        localStorage.clear();
        history.go(0);
      }).catch((err) => alert(err.code.substring(5))) : null);
    } else {
      confirm(`If you want to keep this account, you'll need to verify this email address: ${user.email}. Do you want to continue?`) ? sendEmailVerification(auth.currentUser).then(() => alert("Email verification mail sent.")).catch(err => alert(err.code.substring(5))) : delAcc();
      document.getElementById("deleteAcc").addEventListener("click", () => confirm(`Do you want to delete your account? (${auth.currentUser.email})`) ? delAcc() : null);
    }
  } else {
    sign.style.display = "flex";

    //MNC provider login
    document.querySelectorAll(".loginBtns > button").forEach((elm) => {
      elm.addEventListener("click", () => {
        const providers = {
          google: new GoogleAuthProvider(),
          microsoft: new OAuthProvider("microsoft.com"),
          github: new GithubAuthProvider(),
          x: new TwitterAuthProvider(),
          yahoo: new OAuthProvider("yahoo.com")
        };

        signInWithPopup(auth, providers[elm.id]).then(() => alert(auth.currentUser.displayName + " signed in successfully.")).catch((err) => alert(err.code.substring(5)));
      });
    });

    //anonymous login
    document.getElementById("guest").addEventListener("click", () => signInAnonymously(auth).then(() => alert("You're signed in as Guest successfully.")).catch(err => alert(err.code.substring(5))));

    //manual register
    document.getElementById("createUser").addEventListener("submit", event => {
      event.preventDefault();
      const formData = new FormData(event.target);
      if (!formData.getAll("new-password").every((value, _, arr) => value === arr[0] || value == null)) {
        if (confirm("Your passwords didn't match. Do want a password-less log in?")) {
          emailLinkLogIn(formData.get("email"));
        } else {
          alert("Please enter the same password in both fields.")
          document.querySelectorAll("[name='new-password']").forEach(elm => elm.value = null);
        }
      } else {
        //sign in with email & pass
        createUserWithEmailAndPassword(auth, formData.get("email"), formData.get("new-password")).then(() => {
          changeName(formData.get("name"), false);
          alert("User created successfully.");
        }).catch(err => alert(err.code.substring(5)));
      }
    });

    //manual login
    document.getElementById("signInUser").addEventListener("submit", event => {
      event.preventDefault();
      const formData = new FormData(event.target);
      //sign in with email & pass
      signInWithEmailAndPassword(auth, formData.get("email"), formData.get("current-password")).then(() => {
        changeName(formData.get("name"), false);
        alert("User signed in successfully.");
      }).catch(err => {
        alert(err.code.substring(5));
        confirm("Want a password-less sign in?") ? emailLinkLogIn(formData.get("email")) : null;
      });
    });

    //sign in with email link
    function emailLinkLogIn(email) {
      sendSignInLinkToEmail(auth, email, {
        url: window.location.href,
        handleCodeInApp: true
      }).then(() => {
        localStorage.setItem("emailForSignIn", email);
        alert("Check your email for the sign in link.");
      }).catch(err => alert(err.code.substring(5)));
    }

    //check if sign in with email link
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = localStorage.emailForSignIn, naa = localStorage.nameForSignIn;
      if (!email) {
        email = prompt("Looks like you're logging in with a different browser. Enter your email to confirm its you.");
        naa = prompt("Enter your name");
      }
      signInWithEmailLink(auth, email, window.location.href).then(() => {
        localStorage.removeItem("emailForSignIn");
        naa ? changeName(naa, true) : null;
        localStorage.removeItem("nameForSignIn");
        window.location.href = "index.html";
      }).catch(err => alert(err.code.substring(5)));
    }
    document.getElementById("resetPassMail").addEventListener("click", () => changePass(document.getElementById("tempmail").value));
  }
});

function showHistory() {
  const delHis = document.querySelector("[tip='Delete History']"), parentElm = document.querySelector("nav > div");
  
  onSnapshot(collection(dbRef, "History"), snap => {
    delHis.classList.remove("scale0");
    const changes = snap.docChanges();
    changes.reverse().forEach((change, index) => {
      if (change.type === "removed") {
        snap.docChanges().length < 2 ? delHis.classList.add("scale0") : null;
        document.getElementById(change.doc.id).remove();
      } else {
        const pouch = document.createElement("div"), ss = change.doc.data();
        pouch.classList.add("pouch");
        pouch.style.animationDelay = `${index * 0.2}s`;
        pouch.setAttribute("id", change.doc.id);
        pouch.innerHTML = `${ss.Title ? ss.Title : "🚫 No Title"}<time>${timeAgo(change.doc.id)}</time>`;
        console.log(index)
        changes.length > 1 ? parentElm.appendChild(pouch) : parentElm.insertBefore(pouch, parentElm.firstChild);

        let timeoutId;
        const samePouch = document.querySelector(".pouch:last-child"), startHold = id => timeoutId = setTimeout(() => {
          document.getElementById(id).remove();

        }, 1000), endHold = () => clearTimeout(timeoutId);

        samePouch.onclick = () => {
          textarea.value = ss.Prompt.Text;
          reply.innerHTML = ss.Response;
          [reply, ansSubmit, ttsBtn].forEach(elm => elm.classList.remove("scale0"));
          load.classList.add("scale0");
        }

        samePouch.onmouseup = event => startHold(event.target.id);
        samePouch.onmouseup = () => endHold();
      }
    });
  });

  delHis.addEventListener("click", async () => {
      const batch = db.batch();
      const querySnapshot = await dbRef.get();

      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    });
}

export async function history(title, prompt, analysis) {
  try {
    await setDoc(doc(dbRef, "History", Date.now().toString()), {
      Title: title,
      Prompt: {
        Text: prompt,
        Images: null
      },
      Response: analysis
    });
  } catch (err) {
    console.error(err);
  }
}

function changeName(naam, toast) {
  updateProfile(auth.currentUser, {
    displayName: naam, photoURL: auth.currentUser.photoURL
  }).then(() => toast ? alert(`Name changed to '${auth.currentUser.displayName}'`) : null).catch(err => alert(err.code.substring(5)));
}

function changePass(cmail) {
  if (confirm("Do you want to change your password?")) {
    sendPasswordResetEmail(auth, cmail).then(() => {
      alert(`Password reset mail sent to ${cmail}`);
      auth.signOut().then(() => alert("Sign in here again after changing your password.")).catch((err) => alert(err.code.substring(5)));
    }).catch(err => alert(err.code.substring(5)));
  }
}