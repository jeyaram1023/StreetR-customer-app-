// js_profiles.js

document.addEventListener('DOMContentLoaded', async () => {
    const profileForm = document.getElementById('profile-form');

    async function handleProfileSave(event) {
        event.preventDefault();
        showLoader();

        const updates = {
            full_name: document.getElementById('customer-name').value,
            mobile_number: document.getElementById('mobile-number').value,
            street_name: document.getElementById('street-name').value,
            nearby_landmark: document.getElementById('nearby-landmark').value,
            district: document.getElementById('district').value,
            state: document.getElementById('state').value,
            pincode: document.getElementById('pincode').value,
        };

        try {
            const { data, error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', window.currentUser.id)
                .select()
                .single();

            if (error) throw error;

            window.userProfile = data; // Update global profile
            navigateToPage('main-app-view'); // Redirect to main app
        } catch (error) {
            console.error('Error updating profile:', error.message);
            alert('Failed to update profile: ' + error.message);
        } finally {
            hideLoader();
        }
    }

    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileSave);
    }
});
