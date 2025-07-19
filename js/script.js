// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

// Set default date range to last 20 days (from 19 days ago to today)
const today = new Date();
const twentyDaysAgo = new Date();
twentyDaysAgo.setDate(today.getDate() - 19);
startInput.value = formatDate(twentyDaysAgo);
endInput.value = formatDate(today);

// Get references to the gallery and button elements
const gallery = document.getElementById('gallery');
const button = document.querySelector('.filters button');

// NASA APOD API key
const apiKey = 'rOXk6TQLPtowvvCdQ5jwuXcCM7OAcrq4IM1W2DIl';

// Function to format date as YYYY-MM-DD
function formatDate(date) {
  // Pads month and day with leading zeros if needed
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Function to create a card for each APOD item (image or video)
function createCard(apod) {
  const card = document.createElement('div');
  card.className = 'gallery-item';

  // If the item is an image
  if (apod.media_type === 'image') {
    card.innerHTML = `
      <img src="${apod.url}" alt="${apod.title}" />
      <h2>${apod.title}</h2>
      <p>${apod.date}</p>
    `;
    card.addEventListener('click', () => openModal(apod));
  }
  // If the item is a video (YouTube/Vimeo with thumbnail)
  else if (apod.media_type === 'video' && apod.thumbnail_url && (
    apod.url.includes('youtube.com') || apod.url.includes('youtu.be') || apod.url.includes('vimeo.com')
  )) {
    // Add a play icon overlay and a "Video" label
    card.innerHTML = `
      <div style="position:relative;width:100%;height:180px;">
        <img src="${apod.thumbnail_url}" alt="${apod.title}" style="width:100%;height:180px;object-fit:cover;border-radius:6px;">
        <span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:48px;color:#fc3d21;pointer-events:none;">&#9658;</span>
        <span style="position:absolute;top:8px;left:8px;background:#fc3d21;color:#fff;font-size:12px;font-weight:bold;padding:2px 8px;border-radius:4px;letter-spacing:1px;">VIDEO</span>
      </div>
      <h2>${apod.title}</h2>
      <p>${apod.date}</p>
    `;
    card.addEventListener('click', () => openModal(apod));
  }
  // Skip/hide unsupported videos (no thumbnail or not YouTube/Vimeo)
  else {
    return null;
  }
  return card;
}

// Function to open the modal with image or video details
function openModal(apod) {
  // Get modal elements from the main HTML file
  const modal = document.getElementById('modal');
  const modalImg = document.getElementById('modalImg');
  const modalTitle = document.getElementById('modalTitle');
  const modalDate = document.getElementById('modalDate');
  const modalExplanation = document.getElementById('modalExplanation');

  // Remove any previous iframe
  const oldIframe = modal.querySelector('iframe');
  if (oldIframe) oldIframe.remove();

  // Set modal content for images
  if (apod.media_type === 'image') {
    modalImg.style.display = 'block';
    modalImg.src = apod.hdurl || apod.url;
    modalImg.alt = apod.title;
  }
  // Set modal content for embeddable videos
  else if (apod.media_type === 'video' && (
    apod.url.includes('youtube.com') || apod.url.includes('youtu.be') || apod.url.includes('vimeo.com')
  )) {
    modalImg.style.display = 'none';
    let iframe = document.createElement('iframe');
    iframe.width = "100%";
    iframe.height = "340";
    iframe.frameBorder = "0";
    iframe.allowFullscreen = true;
    // YouTube
    if (apod.url.includes('youtube.com') || apod.url.includes('youtu.be')) {
      let videoId = '';
      if (apod.url.includes('youtube.com')) {
        const urlObj = new URL(apod.url);
        videoId = urlObj.searchParams.get('v');
      } else if (apod.url.includes('youtu.be')) {
        videoId = apod.url.split('/').pop();
      }
      iframe.src = `https://www.youtube.com/embed/${videoId}`;
    }
    // Vimeo
    else if (apod.url.includes('vimeo.com')) {
      const match = apod.url.match(/vimeo\.com\/(\d+)/);
      if (match) {
        const videoId = match[1];
        iframe.src = `https://player.vimeo.com/video/${videoId}`;
      }
    }
    modalImg.parentNode.insertBefore(iframe, modalImg);
  }

  modalTitle.textContent = apod.title;
  modalDate.textContent = apod.date;
  modalExplanation.textContent = apod.explanation;

  // Show the modal
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Hide the modal and clean up
function closeModal() {
  const modal = document.getElementById('modal');
  const modalImg = document.getElementById('modalImg');
  // Remove any dynamically added iframe
  const oldIframe = modal.querySelector('iframe');
  if (oldIframe) oldIframe.remove();
  modal.classList.remove('active');
  document.body.style.overflow = '';
  modalImg.src = '';
  modalImg.alt = '';
}

// Function to fetch and display APOD items for a date range
function fetchAPODs(startDate, endDate) {
  // Build the API URL with thumbs=true for video thumbnails
  const url = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}&start_date=${startDate}&end_date=${endDate}&thumbs=true`;

  // Show loading message
  gallery.innerHTML = '<div class="placeholder"><p>🔄 Loading space photos…</p></div>';

  // Fetch data from NASA API
  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      // Accept both arrays and single objects
      const items = Array.isArray(data) ? data : [data];
      // Filter out unsupported videos and media types
      const cards = items.map(createCard).filter(Boolean);

      // If there are no cards, show a message
      if (cards.length === 0) {
        gallery.innerHTML = '<div class="placeholder"><p>No images found for this date range.</p></div>';
        return;
      }

      // Clear the gallery and add cards
      gallery.innerHTML = '';
      cards.forEach(card => gallery.appendChild(card));
    })
    .catch(error => {
      gallery.innerHTML = `<div class="placeholder"><p>Failed to load images. Please try again later.</p></div>`;
      console.error('Error fetching APODs:', error);
    });
}

// Event listener for the button
button.addEventListener('click', () => {
  // Get the selected start and end dates from the inputs
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  const startDate = startDateInput.value;
  const endDate = endDateInput.value;

  // If either date is missing, show an error and return
  if (!startDate || !endDate) {
    gallery.innerHTML = '<p>Please select both a start and end date.</p>';
    return;
  }

  // Fetch and display the APOD images for the selected date range
  fetchAPODs(startDate, endDate);
});

// Add modal close event listeners (if not already present)
const modalCloseBtn = document.getElementById('modalCloseBtn');
const modal = document.getElementById('modal');
modalCloseBtn.addEventListener('click', closeModal);
modal.addEventListener('click', function(event) {
  if (event.target === modal) {
    closeModal();
  }
});
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape' && modal.classList.contains('active')) {
    closeModal();
  }
});
