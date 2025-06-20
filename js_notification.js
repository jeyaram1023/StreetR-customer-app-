// js_notification.js
const popup1 = document.getElementById('notification-popup-1');
const popup2 = document.getElementById('notification-popup-2');
const popup3 = document.getElementById('notification-popup-3'); // Get the 3rd popup
const dontShowAgainCheckbox = document.getElementById('dont-show-again'); // Get the checkbox

function showPopUpNotifications() {
    // Show first popup after 2 seconds
    setTimeout(() => {
        popup1?.classList.remove('hidden');
    }, 2000);

    // Show second popup after 5 seconds
    setTimeout(() => {
        popup2?.classList.remove('hidden');
    }, 5000);

    // *** ADDED: Logic for the third popup ***
    const dontShow = localStorage.getItem('hidePromoPopup3');
    if (!dontShow) {
        setTimeout(() => {
            popup3?.classList.remove('hidden');
        }, 8000); // Show after 8 seconds
    }

    // Add event listeners to close buttons
    document.querySelectorAll('.close-popup-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.popup-notification').classList.add('hidden');
        });
    });

    // *** ADDED: Logic for the "Don't show this again" checkbox ***
    if (dontShowAgainCheckbox) {
        dontShowAgainCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                // If checked, save preference to localStorage
                localStorage.setItem('hidePromoPopup3', 'true');
            } else {
                // If unchecked, remove the preference
                localStorage.removeItem('hidePromoPopup3');
            }
        });
    }
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
