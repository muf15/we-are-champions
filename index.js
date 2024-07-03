import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, push, onValue, update } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

// Firebase configuration
const appSettings = {
    databaseURL: "https://we-are-the-champions-a3bf9-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

// Initialize Firebase
const app = initializeApp(appSettings);
const database = getDatabase(app);
const endorsementListInDB = ref(database, "endorsementList");

// DOM Elements
const inputFromEl = document.getElementById("input-from");
const inputToEl = document.getElementById("input-to");
const inputEndorsementEl = document.getElementById("input-endorsement");
const publishButtonEl = document.getElementById("publish");
const userEndorseEl = document.getElementById("user-endorse");
const emptyMessageEl = document.getElementById("empty-message");

// Get or set a unique user ID in localStorage
const userId = localStorage.getItem("userId") || (localStorage.setItem("userId", generateUUID()), localStorage.getItem("userId"));

// Function to generate a UUID (Unique User ID)
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Event listener for the Enter key to submit endorsement
inputEndorsementEl.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        publishButtonEl.click();
    }
});

// Event listener for the Publish button
publishButtonEl.addEventListener("click", function () {
    let fromValue = inputFromEl.value.trim();
    let toValue = inputToEl.value.trim();
    let endorsementValue = inputEndorsementEl.value.trim();

    if (fromValue !== "" && toValue !== "" && endorsementValue !== "") {
        push(endorsementListInDB, {
            from: fromValue,
            to: toValue,
            endorsement: endorsementValue,
            likes: {}, // Initialize empty likes object
            likeCount: 0 // Initialize like count
        });
        clearInputFields();
    }
});

// Real-time listener for endorsement list updates
onValue(endorsementListInDB, function (snapshot) {
    if (snapshot.exists()) {
        let endorsements = snapshot.val();
        clearEndorsementList();
        emptyMessageEl.style.display = "none";

        Object.keys(endorsements).forEach((key) => {
            appendMessageToEndorsementList(key, endorsements[key]);
        });
    } else {
        clearEndorsementList();
        emptyMessageEl.style.display = "block";
    }
});

// Clear the endorsement list
function clearEndorsementList() {
    userEndorseEl.innerHTML = "";
}

// Clear the input fields
function clearInputFields() {
    inputFromEl.value = "";
    inputToEl.value = "";
    inputEndorsementEl.value = "";
}

// Append a message to the endorsement list
function appendMessageToEndorsementList(endorsementId, endorsementData) {
    let newDiv = document.createElement("div");
    newDiv.className = "full-message";

    let toEl = document.createElement("h4");
    toEl.textContent = `To: ${endorsementData.to}`;

    let endorsementEl = document.createElement("p");
    endorsementEl.textContent = endorsementData.endorsement;

    let fromEl = document.createElement("h4");
    fromEl.textContent = `From: ${endorsementData.from}`;

    let likeContainer = document.createElement("div");
    likeContainer.className = "like-container";

    let likeButton = document.createElement("i");
    likeButton.className = `fa-heart like-button ${endorsementData.likes && endorsementData.likes[userId] ? 'fas liked' : 'far'}`;
    likeButton.addEventListener("click", function (event) {
        event.stopPropagation();
        toggleLike(endorsementId, endorsementData.likes, endorsementData);
    });

    newDiv.addEventListener("dblclick", function () {
        toggleLike(endorsementId, endorsementData.likes, endorsementData);
    });

    let likeCountEl = document.createElement("span");
    likeCountEl.textContent = endorsementData.likeCount; // Display like count
    likeCountEl.className = "like-count";

    likeContainer.appendChild(likeButton);
    likeContainer.appendChild(likeCountEl);

    newDiv.appendChild(toEl);
    newDiv.appendChild(endorsementEl);
    newDiv.appendChild(fromEl);
    newDiv.appendChild(likeContainer);

    userEndorseEl.appendChild(newDiv);
}

// Function to toggle like/unlike
function toggleLike(endorsementId, likes, endorsementData) {
    if (!likes || !likes[userId]) {
        // User hasn't liked, so like it
        const updates = {};
        updates[`endorsementList/${endorsementId}/likes/${userId}`] = true;
        updates[`endorsementList/${endorsementId}/likeCount`] = (endorsementData.likeCount || 0) + 1; // Increment like count
        update(ref(database), updates);
    } else {
        // User already liked, so unlike it
        const updates = {};
        updates[`endorsementList/${endorsementId}/likes/${userId}`] = null;
        updates[`endorsementList/${endorsementId}/likeCount`] = (endorsementData.likeCount || 0) - 1; // Decrement like count
        update(ref(database), updates);
    }
}
