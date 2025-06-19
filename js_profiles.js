// js_profiles.js

document.addEventListener('DOMContentLoaded', async () => {
    const profileDetailsView = document.getElementById('profile-details-view');
    const profileEditForm = document.getElementById('profile-edit-form');
    const profileToggleButton = document.getElementById('profile-toggle-edit-button');
    const saveProfileChangesButton = document.getElementById('save-profile-changes-button');

    // Display elements
    const displayName = document.getElementById('profile-display-name');
    const displayMobile = document.getElementById('profile-display-mobile');
    const displayStreet = document.getElementById('profile-display-street');
    const displayLandmark = document.getElementById('profile-display-landmark');
    const displayDistrict = document.getElementById('profile-display-district');
    const displayState = document.getElementById('profile-display-state');
    const displayPincode = document.getElementById('profile-display-pincode');

    // Edit form elements
    const editName = document.getElementById('edit-customer-name');
    const editMobile = document.getElementById('edit-mobile-number');
    const editStreet = document.getElementById('edit-street-name');
    const editLandmark = document.getElementById('edit-nearby-landmark');
    const editDistrict = document.getElementById('edit-district');
    const editState = document.getElementById('edit-state');
    const editPincode = document.getElementById('edit-pincode');

    // Function to load and display profile data
    async function loadProfileData() {
        showLoader();
        try {
            const user = window.currentUser;
            if (!user) {
                console.error('User not logged in, cannot load profile.');
                return;
            }
            const profile = await window.fetchProfile(user.id); // Assuming fetchProfile is in js_main or js_supabase

            if (profile) {
                window.userProfile = profile; // Update global userProfile
                displayName.textContent = profile.customer_name || 'N/A';
                displayMobile.textContent = profile.mobile_number || 'N/A';
                displayStreet.textContent = profile.street_name || 'N/A';
                displayLandmark.textContent = profile.nearby_landmark || 'N/A';
                displayDistrict.textContent = profile.district || 'N/A';
                displayState.textContent = profile.state || 'N/A';
                displayPincode.textContent = profile.pincode || 'N/A';

                // Populate edit form fields
                editName.value = profile.customer_name || '';
                editMobile.value = profile.mobile_number || '';
                editStreet.value = profile.street_name || '';
                editLandmark.value = profile.nearby_landmark || '';
                editDistrict.value = profile.district || '';
                editState.value = profile.state || '';
                editPincode.value = profile.pincode || '';

                // Show view, hide form
                profileDetailsView.classList.remove('hidden');
                profileEditForm.classList.add('hidden');
                profileToggleButton.textContent = 'Edit Profile';
            } else {
                console.warn('Profile not found for user.');
                profileDetailsView.innerHTML = '<p>No profile data found. Please set up your profile.</p>';
                profileEditForm.classList.remove('hidden'); // Prompt to set up
                profileToggleButton.textContent = 'Save Profile'; // Adjust button text
            }
        } catch (error) {
            console.error('Error loading profile data:', error.message);
            profileDetailsView.innerHTML = '<p>Error loading profile data.</p>';
        } finally {
            hideLoader();
        }
    }

    // Toggle between view and edit modes
    profileToggleButton.addEventListener('click', () => {
        if (profileDetailsView.classList.contains('hidden')) {
            // Currently in edit mode, switch to view mode (cancel edit)
            profileDetailsView.classList.remove('hidden');
            profileEditForm.classList.add('hidden');
            profileToggleButton.textContent = 'Edit Profile';
            // Reload data to discard unsaved changes
            loadProfileData();
        } else {
            // Currently in view mode, switch to edit mode
            profileDetailsView.classList.add('hidden');
            profileEditForm.classList.remove('hidden');
            profileToggleButton.textContent = 'Cancel Edit';
        }
    });

    // Save profile changes
    saveProfileChangesButton.addEventListener('click', async () => {
        showLoader();
        try {
            const user = window.currentUser;
            if (!user) {
                alert('You must be logged in to update your profile.');
                return;
            }

            const updates = {
                customer_name: editName.value,
                mobile_number: editMobile.value,
                street_name: editStreet.value,
                nearby_landmark: editLandmark.value,
                district: editDistrict.value,
                state: editState.value,
                pincode: editPincode.value,
            };

            const { data, error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id)
                .select() // Return updated data
                .single();

            if (error) {
                if (error.code === '23505') { // Unique violation
                    alert('Mobile number or email already exists. Please use a different one.');
                } else {
                    throw error;
                }
            }

            if (data) {
                window.userProfile = data; // Update global profile
                alert('Profile updated successfully!');
                loadProfileData(); // Reload to show updated data and switch back to view mode
            }
        } catch (error) {
            console.error('Error updating profile:', error.message);
            alert('Failed to update profile: ' + error.message);
        } finally {
            hideLoader();
        }
    });

    // Attach event listener to the Profile button in the bottom navigation
    const profileNavButton = document.querySelector('button[data-page="profile-page-content"]');
    if (profileNavButton) {
        profileNavButton.addEventListener('click', () => {
            navigateToPage('main-app-view', 'profile-page-content');
            loadProfileData(); // Load data when profile page is active
        });
    }

    // Initial load if profile page is the default or becomes active
    if (document.getElementById('profile-page-content').classList.contains('active')) {
        loadProfileData();
    }
});
