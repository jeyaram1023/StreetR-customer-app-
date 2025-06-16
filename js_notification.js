// js_notification.js

const popup1 = document.getElementById('notification-popup-1');
const popup2 = document.getElementById('notification-popup-2');

function showPopUpNotifications() {
    // Show first popup after 2 seconds
    setTimeout(() => {
        popup1?.classList.remove('hidden');
    }, 2000);

    // Show second popup after 5 seconds
    setTimeout(() => {
        popup2?.classList.remove('hidden');
    }, 5000);

    // Add event listeners to close buttons
    document.querySelectorAll('.close-popup-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.popup-notification').classList.add('hidden');
        });
    });
}

function requestPushNotifications() {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                console.log("Notification permission granted.");
                // In a real app, you would now get the FCM token and save it to the user's profile
            } else {
                console.log("Notification permission denied.");
            }
        });
    } else {
        console.log("This browser does not support notifications.");
    }
}

// Example of how to call it (e.g., after user logs in)
// requestPushNotifications();
