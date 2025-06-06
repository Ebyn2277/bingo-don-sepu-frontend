window.onload = () => {
    let formData = null;
    updateTotalPrice(1); // Initialize total price with 1 ticket
    handleChangeFile(); // Initialize file input state

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

    document.getElementById('payment-proof').addEventListener('change', event => handleChangeFile());

    document.getElementById('contact-form').addEventListener('submit', event => {
        event.preventDefault();

        formData = new FormData(event.target);

        const file = document.getElementById('payment-proof').files[0];
        
        if (!validateFile(file)) return;

        formData.append('payment-proof', file);

        formData.append('tickets-quantity', document.getElementById('input-quantity').value);
        formData.append('timestamp', new Date().toISOString());

        document.getElementById('confirmation-name').textContent = formData.get('name') || 'Nombre no proporcionado';
        document.getElementById('confirmation-phone').textContent = formData.get('phone') || 'Teléfono no proporcionado';
        document.getElementById('confirmation-quantity').textContent = document.getElementById('input-quantity').value || '0';
        document.getElementById('confirmation-total-price').textContent = document.getElementById('total-price').textContent || '0 COP';
        showImage(file, 'proof-image');

        window.scrollTo({
            bottom: 0,
            behavior: 'smooth'
        });

        document.getElementById('confirmation-modal').classList.remove('hidden');
        document.getElementById('overlay').classList.remove('hidden');
        document.getElementById('confirmation-modal-container').classList.remove('hidden');
    });

    document.getElementById('btn-close-confirmation-modal').addEventListener('click', () => {
        document.getElementById('confirmation-modal').classList.add('hidden');
        document.getElementById('overlay').classList.add('hidden');
        formData = null; // Reset formData

        setTimeout(() => {
            document.getElementById('confirmation-modal-container').classList.add('hidden');
        }, 300);
    });

    document.getElementById('btn-finish-buying').addEventListener('click', () => {
        // TODO: Send formData to the server
        console.log('Form submitted:', Object.fromEntries(formData.entries()));
    });
}

function handleChangeFile() {
    const file = document.getElementById('payment-proof').files[0];
    const fileNameElement = document.getElementById('payment-proof-preview-text');

    if (file) {
        if (validateFile(file)) {
            fileNameElement.textContent = file.name;
            fileNameElement.classList.remove('hidden');
            document.getElementById('payment-proof-preview-image').classList.remove('hidden');
            showImage(file, 'payment-proof-preview-image');
        } else {
            fileNameElement.textContent = 'Archivo no válido. Por favor, sube una imagen.';
            fileNameElement.classList.add('hidden');
            event.target.value = '';
        }
    } else {
        fileNameElement.textContent = 'No se ha seleccionado ningún archivo.';
        fileNameElement.classList.add('hidden');
    }
}

function showImage(file, previewElementId) {
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById(previewElementId).src = e.target.result;
    }
    reader.readAsDataURL(file);
}

function updateTotalPrice(updatedQuantity) {
    const totalPrice = document.getElementById('total-price');
    const pricePerTicket = parseFloat(totalPrice.dataset.price);
    
    totalPrice.textContent = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP'
    }).format(updatedQuantity * pricePerTicket);

    console.log(`Total price updated: ${totalPrice.textContent}`);
}

function validateFile(file) {
    if (file.type.startsWith('image/')) {
        return true;
    }

    return false
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