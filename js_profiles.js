// js_profiles.js
const profileForm = document.getElementById('profile-form');
const saveProfileButton = document.getElementById('save-profile-button');
const profileMessage = document.getElementById('profile-message');

// Form inputs
const customerNameInput = document.getElementById('customer-name');
const mobileNumberInput = document.getElementById('mobile-number');
const streetNameInput = document.getElementById('street-name');
const nearbyLandmarkInput = document.getElementById('nearby-landmark');
const districtInput = document.getElementById('district');
const stateInput = document.getElementById('state');
const pincodeInput = document.getElementById('pincode');

async function saveProfile() {
    const user = window.currentUser;
    if (!user) {
        profileMessage.textContent = 'You must be logged in.';
        profileMessage.className = 'message error';
        return;
    }

    const profileData = {
        id: user.id,
        user_type: 'Customer',
        full_name: customerNameInput.value.trim(), // Assuming 'full_name' column exists or needs to be added
        mobile_number: mobileNumberInput.value.trim(),
        street_name: streetNameInput.value.trim(),
        nearby_landmark: nearbyLandmarkInput.value.trim(), // Assuming 'nearby_landmark' column
        district: districtInput.value.trim(),
        state: stateInput.value.trim(),
        pincode: pincodeInput.value.trim(),
        updated_at: new Date().toISOString()
    };
    
    // Simple validation
    if (!profileData.full_name || !profileData.mobile_number || !profileData.pincode) {
        profileMessage.textContent = 'Name, Mobile, and Pincode are required.';
        profileMessage.className = 'message error';
        return;
    }

    showLoader();
    saveProfileButton.disabled = true;

    try {
        const { data, error } = await supabase
            .from('profiles')
            .upsert(profileData, { onConflict: 'id' })
            .select()
            .single();

        if (error) throw error;
        
        localStorage.setItem('userProfile', JSON.stringify(data));
        window.userProfile = data;
        
        displayProfileSummary(data);
        navigateToPage('lets-go-page');

    } catch (error) {
        console.error('Error saving profile:', error);
        profileMessage.textContent = `Error: ${error.message}`;
        profileMessage.className = 'message error';
    } finally {
        hideLoader();
        saveProfileButton.disabled = false;
    }
}

async function fetchProfile(userId) {
    try {
        const { data, error, status } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error && status !== 406) {
            throw error;
        }
        
        if (data) {
            localStorage.setItem('userProfile', JSON.stringify(data));
            window.userProfile = data;
            return data;
        }
        return null;
    } catch (error) {
        console.error('Error fetching profile:', error.message);
        return null;
    }
}

function displayProfileSummary(profile) {
    const summaryDiv = document.getElementById('user-details-summary');
    if (profile && summaryDiv) {
        summaryDiv.innerHTML = `
            <p><strong>Name:</strong> ${profile.full_name || ''}</p>
            <p><strong>Mobile:</strong> ${profile.mobile_number || ''}</p>
            <p><strong>Address:</strong> ${profile.street_name || ''}, ${profile.district || ''}</p>
            <p><strong>Pincode:</strong> ${profile.pincode || ''}</p>
        `;
    }
}

function populateProfileForEditing(profile) {
    if (profile) {
        customerNameInput.value = profile.full_name || '';
        mobileNumberInput.value = profile.mobile_number || '';
        streetNameInput.value = profile.street_name || '';
        nearbyLandmarkInput.value = profile.nearby_landmark || '';
        districtInput.value = profile.district || '';
        stateInput.value = profile.state || '';
        pincodeInput.value = profile.pincode || '';
    }
}


if (profileForm) {
    profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveProfile();
    });
}
