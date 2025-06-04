window.onload = () => {
    updateTotalPrice(1); // Initialize total price with 1 ticket

    // EVENTS  

    document.getElementById('btn-increment').addEventListener('click', () => {
        const inputQuantity = document.getElementById('input-quantity');
        let currentValue = parseInt(inputQuantity.value) || inputQuantity.defaultValue;

        if (currentValue < inputQuantity.max) {
            inputQuantity.value = currentValue + 1;

            updateTotalPrice(currentValue + 1);
        }
    });

    document.getElementById('btn-decrement').addEventListener('click', () => {
        const inputQuantity = document.getElementById('input-quantity');
        let currentValue = parseInt(inputQuantity.value) || inputQuantity.defaultValue;

        if (currentValue > inputQuantity.min) {
            inputQuantity.value = currentValue - 1;

            updateTotalPrice(currentValue - 1);
        }
    });

    document.querySelectorAll('.btn-copy').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            copyToClipboard(targetId);
        });
    });

    document.getElementById('contact-form').addEventListener('submit', event => {
        event.preventDefault();

        const formData = new FormData(event.target);

        const file = document.getElementById('payment-proof');
        
        if (!validateFile(file)) return;

        formData.append('payment-proof', file.files[0]);

        formData.append('tickets-quantity', document.getElementById('input-quantity').value);
        formData.append('timestamp', new Date().toISOString());

        // TODO: Send formData to the server

        console.log('Form submitted:', Object.fromEntries(formData.entries()));
    });
}

function updateTotalPrice(updatedQuantity) {
    const totalPrice = document.getElementById('total-price');
    const pricePerTicket = parseFloat(totalPrice.dataset.price);
    
    totalPrice.textContent = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP'
    }).format(updatedQuantity * pricePerTicket);
}

function validateFile(fileInput) {
    if (fileInput.files.length === 0) {
        return false;
    }
    
    return true;
}

function copyToClipboard(targetId) {
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
        const textToCopy = targetElement.textContent || targetElement.innerText;
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                console.log('Text copied to clipboard');
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
            });
    } else {
        console.error('Target element not found');
    }
}