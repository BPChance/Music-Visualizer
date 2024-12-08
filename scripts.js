// Add click event listeners to buttons
document.querySelectorAll('.mood-button').forEach(button => {
    button.addEventListener('click', () => {
        // Get the button text and convert to lowercase for the file name
        const mood = button.textContent.toLowerCase();
        
        // Navigate to the corresponding page
        window.location.href = `${mood}.html`;
    });
});