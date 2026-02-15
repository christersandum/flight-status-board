// Flight Status Board Application
console.log('Flight Status Board loaded');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    
    // Check backend connectivity
    checkBackendStatus();
});

function checkBackendStatus() {
    console.log('Checking backend status...');
    // In a real app, this would fetch from the backend API
    // For now, just log that the frontend is working
    const boardElement = document.getElementById('flight-board');
    if (boardElement) {
        console.log('Flight board element found and ready');
    }
}
