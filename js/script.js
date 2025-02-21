// Constants at the top
const DEFAULT_EMAIL = 'aqi@ptis.ac.th';
const DEFAULT_PIN = '7VR2fSLR';
const CORS_PROXY = "http://127.0.0.1:8080/";


function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}


// Authentication function
async function authenticate() {
    try {
        const response = await fetch('https://app.freshnergy.com/api/v2/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: DEFAULT_EMAIL,
                pin: DEFAULT_PIN
            })
        });

        if (response.ok) {
            const data = await response.json();
            document.cookie = `token=${data.token}; path=/; secure; samesite=strict; max-age=86400`;
            document.cookie = `email=${DEFAULT_EMAIL}; path=/; secure; samesite=strict; max-age=86400`;
            return data.token;
        } else {
            console.error('Authentication failed');
            return null;
        }
    } catch (error) {
        console.error('Authentication error:', error);
        return null;
    }
}

// Main initialization
document.addEventListener('DOMContentLoaded', async () => {
    // Get or create new token
    let token = getCookie('token');
    if (!token) {
        token = await authenticate();
    }

    // Initialize with the token
    const result = await getUID(DEFAULT_PIN, token, DEFAULT_EMAIL);
    if (result.success) {
        const data = result.data;
        getDevices(data.device);
    } else {
        console.error(result.error);
        // If there's an error, try re-authenticating
        const newToken = await authenticate();
        if (newToken) {
            const retryResult = await getUID(DEFAULT_PIN, newToken, DEFAULT_EMAIL);
            if (retryResult.success) {
                const data = retryResult.data;
                getDevices(data.device);
            }
        }
    }
});






// // Function to get cookie by name
// function getCookie(name) {
//     const value = `; ${document.cookie}`;
//     const parts = value.split(`; ${name}=`);
//     if (parts.length === 2) return parts.pop().split(';').shift();
//     return null;
// }

// const token = getCookie('token');
// const email = getCookie('email');
// const pin = getCookie('pin');


// if (!token) {
//     window.location.href = 'login.html';
// }

// const modal = document.getElementById('modal');
// setTimeout(async () => {
//     if (pin) {
//         modal.style.display = 'none';
//         // Fetch with existing pin
//         const result = await getUID(pin, token, email);
//         if (result.success) {
//             const data = result.data;
//             getDevices(data.device); 
//         } else {
//             console.error(result.error);
//         }
//     } else {
//         modal.style.display = 'flex';
//     }
// }, 1000); 

// function signOut() { 
//     document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
//     document.cookie = "email=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
//     document.cookie = "pin=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
//     window.location.href = '/login.html';
// }


// Fetch API logic moved to a new function
async function getUID(pin, token, email) {
    try {
        const response = await fetch('https://app.freshnergy.com/api/v2/uid', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({
                email: email,
                pin: pin
            })
        });

        if (response.ok) {
            const data = await response.json();
            generateCard(data);
            return { success: true, data }; // Return success and data
        } else {
            const errorData = await response.json();
            return { success: false, error: errorData.msg }; // Return error message
        }
    } catch (error) {
        console.error('Error:', error);
        return { success: false, error: 'Network error. Please try again.' }; // Return network error
    }
}

// Event listener for form submission
// document.querySelector('.form-pin').addEventListener('submit', async (e) => {
//     e.preventDefault();

//     // Get the button element
//     const submitButton = document.querySelector('#submit-btn');

//     // Change button text to loading state
//     submitButton.innerHTML = '<div class="spinner"></div>';
//     submitButton.disabled = true;

//     const pin = document.getElementById('pin').value;

//     // Call the getUID function
//     const result = await getUID(pin, token, email);

//     if (result.success) {
//         const data = result.data;

//         // Set cookie for pin
//         document.cookie = `pin=${pin}; path=/; secure; samesite=strict; max-age=86400`;

//         // Hide the modal
//         const modal = document.getElementById('modal');
//         if (modal) {
//             modal.style.display = 'none';
//         }
//         // Fetch and display device data
//         getDevices(data.device);
//     } else {
//         // Handle errors
//         console.log(result.error);
//         const pinInput = document.getElementById('pin');
//         pinInput.style.border = '2px solid red';
//         submitButton.innerHTML = 'SUBMIT';
//         submitButton.disabled = false;

//         const errorMessage = document.querySelector('.error-message');
//         errorMessage.textContent = result.error;
//     }
// });



async function getDevices(devices = []) {
    const cidArray = devices.map(item => item.cid);
    const requestBody = {
        cid: cidArray,
    };
    try {
        const response = await fetch('https://app.freshnergy.com/api/v2/device', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token, // Ensure `token` is defined
            },
            body: JSON.stringify(requestBody),
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Device data successfully sent:', data.data);
            // Handle the response data as needed
            generateData( data.data );
        } else {
            const errorData = await response.json();
            console.error('Failed to send device data:', errorData);
        }
    } catch (error) {
        console.error('Network error:', error);
    }
}


function generateCard(data) { 
    const contentElement = document.getElementById('content');
    let elem = '';

    // Add average card first
    elem += `<div class="card" id="average-card">
                <div class="card-label">LOCATION</div>
                <h2 class="card-title">Average of All Locations</h2>
                <div class="s-grid -d5 -m2">
                    <div class="box -pm2_5">
                        <div class="box-icon">
                            <img src="./img/pm25.svg" />
                        </div>
                        <div class="data"><span class="data-pm2_5">0</span></div>
                        <div class="label">PM2.5</div>
                        <img src="./img/pm25.svg" class="box-bg" />
                    </div>
                    <div class="box -co2">
                        <div class="box-icon">
                            <img src="./img/co2.svg" />
                        </div>
                        <div class="data"><span class="data-co2">0</span></div>
                        <div class="label">CO₂</div>
                        <img src="./img/co2.svg" class="box-bg" />
                    </div>
                    <div class="box -pm1">
                        <div class="box-icon">
                            <img src="./img/pm1.svg" />
                        </div>
                        <div class="data"><span class="data-pm1">0</span></div>
                        <div class="label">PM1</div>
                        <img src="./img/pm1.svg" class="box-bg" />
                    </div>
                    <div class="box -pm4">
                        <div class="box-icon">
                            <img src="./img/pm4.svg" />
                        </div>
                        <div class="data"><span class="data-pm4">0</span></div>
                        <div class="label">PM4</div>
                        <img src="./img/pm4.svg" class="box-bg" />
                    </div>
                    <div class="box -pm10">
                        <div class="box-icon">
                            <img src="./img/pm10.svg" />
                        </div>
                        <div class="data"><span class="data-pm10">0</span></div>
                        <div class="label">PM10</div>
                        <img src="./img/pm10.svg" class="box-bg" />
                    </div>
                </div>
            </div>`;

    data.device.forEach(element => {
        elem += ` <div class="card" id="${element.cid}">
                    <div class="card-label">LOCATION</div>
                    <h2 class="card-title">${element.room || element.name}</h2>
                    <div class="s-grid -d5 -m2">
                        <div class="box -pm2_5">
                            <div class="box-icon">
                                <img src="./img/pm25.svg" />
                            </div>
                            <div class="data"><span class="data-pm2_5">0</span></div>
                            <div class="label">PM2.5</div>
                            <img src="./img/pm25.svg" class="box-bg" />
                        </div>
                        <div class="box -co2">
                            <div class="box-icon">
                                <img src="./img/co2.svg" />
                            </div>
                            <div class="data"><span class="data-co2">0</span></div>
                             <div class="label">CO₂</div>
                            <img src="./img/co2.svg" class="box-bg" />
                        </div>
                        <div class="box -pm1">
                            <div class="box-icon">
                                <img src="./img/pm1.svg" />
                            </div>
                            <div class="data"><span class="data-pm1">0</span></div>
                            <div class="label">PM1</div>
                            <img src="./img/pm1.svg" class="box-bg" />
                        </div>
                        <div class="box -pm4">
                            <div class="box-icon">
                                <img src="./img/pm4.svg" />
                            </div>
                            <div class="data"><span class="data-pm4">0</span></div>
                            <div class="label">PM4</div>
                            <img src="./img/pm4.svg" class="box-bg" />
                        </div>
                        <div class="box -pm10">
                            <div class="box-icon">
                                <img src="./img/pm10.svg" />
                            </div>
                            <div class="data"><span class="data-pm10"></span></div>
                            <div class="label">PM10</div>
                            <img src="./img/pm10.svg" class="box-bg" />
                        </div>
                    </div>
                </div>`;
    });
    contentElement.innerHTML = elem;
}

function generateData(data = []) { 
    const pm25Values = []; 
    // Calculate averages
    let totalCo2 = 0;
    let totalPm1 = 0;
    let totalPm25 = 0;
    let totalPm4 = 0;
    let totalPm10 = 0;
    let visibleLocations = 0;

    data.forEach(element => {
        const cardElem = document.getElementById(element.cid);

        if (cardElem && !cardElem.classList.contains('hide')) {
            visibleLocations++;
            totalCo2 += parseFloat(element.sensor.co2) || 0;
            totalPm1 += parseFloat(element.sensor.pm1) || 0;
            totalPm25 += parseFloat(element.sensor.pm2_5) || 0;
            totalPm4 += parseFloat(element.sensor.pm4) || 0;
            totalPm10 += parseFloat(element.sensor.pm10) || 0;
        }

        // Update individual cards
        if (cardElem) {
            if (cardElem.classList.contains('hide')) {
                cardElem.classList.remove('hide');
            }
            cardElem.querySelector('.data-co2').innerHTML = element.sensor.co2;
            cardElem.querySelector('.data-pm1').innerHTML = element.sensor.pm1;
            cardElem.querySelector('.data-pm2_5').innerHTML = element.sensor.pm2_5;
            cardElem.querySelector('.data-pm4').innerHTML = element.sensor.pm4;
            cardElem.querySelector('.data-pm10').innerHTML = element.sensor.pm10;

            // Check if the card is for Canteen and retrieve PM2.5
            const cardTitle = cardElem.querySelector('.card-title').innerText;
            if (cardTitle === 'Canteen') {
                const pm25Value = parseFloat(cardElem.querySelector('.data-pm2_5').innerText);
                pm25Values.push({ cid: element.cid, pm2_5: pm25Value });
            }
        }

        // if (cardElem.classList.contains('hide')) {
        //     cardElem.classList.remove('hide');
        // }
        // cardElem.querySelector('.data-co2').innerHTML = element.sensor.co2;
        // cardElem.querySelector('.data-pm1').innerHTML = element.sensor.pm1;
        // cardElem.querySelector('.data-pm2_5').innerHTML = element.sensor.pm2_5;
        // cardElem.querySelector('.data-pm4').innerHTML = element.sensor.pm4;
        // cardElem.querySelector('.data-pm10').innerHTML = element.sensor.pm10;


        // // Check if the card is for Canteen and retrieve PM2.5
        // const cardTitle = cardElem.querySelector('.card-title').innerText;
        // if (cardTitle === 'Canteen') {
        //     const pm25Value = parseFloat(cardElem.querySelector('.data-pm2_5').innerText);
        //     pm25Values.push({ cid: element.cid, pm2_5: pm25Value });
        // }
    })
    // [AVERAGE] Update average card
     if (visibleLocations > 0) {
        const averageCard = document.getElementById('average-card');
        if (averageCard) {
            averageCard.querySelector('.data-co2').innerHTML = (totalCo2 / visibleLocations).toFixed(1);
            averageCard.querySelector('.data-pm1').innerHTML = (totalPm1 / visibleLocations).toFixed(1);
            averageCard.querySelector('.data-pm2_5').innerHTML = (totalPm25 / visibleLocations).toFixed(1);
            averageCard.querySelector('.data-pm4').innerHTML = (totalPm4 / visibleLocations).toFixed(1);
            averageCard.querySelector('.data-pm10').innerHTML = (totalPm10 / visibleLocations).toFixed(1);
        }
    }

     // Find the lowest PM2.5 value and its CID
    const lowestPm25 = pm25Values.reduce((lowest, current) => {
        return current.pm2_5 < lowest.pm2_5 ? current : lowest;
    }, pm25Values[0]);

    pm25Values.forEach(device => {
        const cardElem = document.getElementById(device.cid);
        if (cardElem) {
            if (device.cid === lowestPm25.cid) {
                cardElem.classList.remove('hide'); // Show the card with the lowest PM2.5
            } else {
                cardElem.classList.add('hide'); // Hide other Canteen cards
            }
        }
    });
}

function updateLastUpdated() {
    const now = new Date();
    const formattedDate = now.toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('lastUpdated').textContent = formattedDate;
     // Fetch everything again
     if (pin) {
        getUID(pin, token, email)
            .then(result => {
                if (result.success) {
                    const data = result.data;
                    getDevices(data.device); // Update device data
                    console.log('fetch again');
                } else {
                    console.error('Error fetching UID data:', result.error);
                }
            })
            .catch(error => console.error('Error in updateLastUpdated:', error));
    } else {
        console.error('Pin not available for fetching updates.');
    }
}
// // Update every 10 minute
// setInterval(updateLastUpdated, 600000);

// function validateCookies() {
//     const token = getCookie('token');
//     const email = getCookie('email');
//     const pin = getCookie('pin');

//     if (!token || !email || !pin) {
//         console.warn('Session expired or cookies are missing. Redirecting to login.');
//         window.location.href = 'login.html'; // Redirect to login
//         return false;
//     }
//     return true;
// }

// function autoLogoutOnCookieExpiry() {
//     if (!validateCookies()) {
//         console.warn('Cookies expired. Logging out.');
//         signOut(); // Call the sign-out function
//     }
// }

// // Check for expired cookies every 1 minute
// setInterval(autoLogoutOnCookieExpiry, 60000); // 60 seconds




// FEB 21
async function validateAndRefreshToken() {
    const token = getCookie('token');
    
    if (!token) {
        console.warn('Token missing, attempting to re-authenticate...');
        const newToken = await authenticate();
        if (newToken) {
            // Fetch new data with the new token
            const result = await getUID(DEFAULT_PIN, newToken, DEFAULT_EMAIL);
            if (result.success) {
                const data = result.data;
                getDevices(data.device);
            }
        } else {
            console.error('Failed to re-authenticate');
        }
    }
}

// Check and refresh token if needed every 1 minute
setInterval(validateAndRefreshToken, 60000); // 60 seconds
