// =====================================================
// SKILLSWAP - FRONTEND
// Connected to deployed backend
// =====================================================

const API_URL = "https://skillswap-backend-9i4k.onrender.com";


// =====================================================
// PAGE NAVIGATION
// =====================================================

function showPage(pageId) {

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active-page");
    });

    const page = document.getElementById(pageId);

    if (page) {
        page.classList.add("active-page");
    }

    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.remove("active");

        if (link.dataset.page === pageId) {
            link.classList.add("active");
        }
    });

    if (pageId === "marketplace") {
        renderGigs();
    }

    if (pageId === "dashboard") {
        renderDashboard();
    }

    if (pageId === "bookings") {
        renderMyBookings();
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// =====================================================
// MARKETPLACE - GET GIGS FROM BACKEND
// =====================================================

async function renderGigs() {

    const grid = document.getElementById("gigGrid");

    if (!grid) return;

    try {

        const response = await fetch(`${API_URL}/api/gigs`);

        if (!response.ok) {
            throw new Error("Failed to load gigs");
        }

        const gigs = await response.json();

        const searchInput = document.getElementById("searchInput");
        const categoryFilter = document.getElementById("categoryFilter");

        const search = searchInput
            ? searchInput.value.toLowerCase().trim()
            : "";

        const category = categoryFilter
            ? categoryFilter.value
            : "All";


        const filtered = gigs.filter(gig => {

            const searchable =
                `${gig.title} ${gig.description} ${gig.category} ${gig.creatorName}`
                    .toLowerCase();

            const matchesSearch =
                searchable.includes(search);

            const matchesCategory =
                category === "All" ||
                gig.category === category;

            return matchesSearch && matchesCategory;
        });


        const gigCount = document.getElementById("gigCount");

        if (gigCount) {
            gigCount.textContent = filtered.length;
        }


        if (filtered.length === 0) {

            grid.innerHTML = `
                <div class="empty" style="grid-column:1/-1">
                    <h3>No gigs found</h3>
                    <p>Try another search or category.</p>
                </div>
            `;

            return;
        }


        grid.innerHTML = filtered.map(gig => `

            <article class="gig-card">

                <div class="gig-top">

                    <span class="category">
                        ${escapeHTML(gig.category)}
                    </span>

                    <span class="gig-price">
                        ₹${Number(gig.rate).toLocaleString()}
                    </span>

                </div>

                <h3>
                    ${escapeHTML(gig.title)}
                </h3>

                <p class="gig-description">
                    ${escapeHTML(gig.description)}
                </p>

                <div class="creator">

                    <div class="creator-avatar">
                        ${getInitial(gig.creatorName)}
                    </div>

                    <div>
                        <strong>
                            ${escapeHTML(gig.creatorName)}
                        </strong>

                        <small>Creator</small>
                    </div>

                </div>

                <button
                    class="book-btn"
                    onclick="openBooking(${gig.id})"
                >
                    Book this gig →
                </button>

            </article>

        `).join("");


    } catch (error) {

        console.error("Failed to load gigs:", error);

        grid.innerHTML = `
            <div class="empty" style="grid-column:1/-1">
                <h3>Unable to load gigs</h3>
                <p>Please refresh the page and try again.</p>
            </div>
        `;
    }
}


// =====================================================
// POST A GIG
// =====================================================

document
    .getElementById("gigForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();


        const title =
            document.getElementById("gigTitle").value.trim();

        const category =
            document.getElementById("gigCategory").value;

        const rate =
            Number(document.getElementById("gigRate").value);

        const description =
            document.getElementById("gigDescription").value.trim();

        const creatorName =
            document.getElementById("creatorName").value.trim();


        if (
            !title ||
            !category ||
            !rate ||
            rate <= 0 ||
            !description ||
            !creatorName
        ) {

            showToast(
                "Please complete all fields.",
                "!"
            );

            return;
        }


        try {

            const response = await fetch(
                `${API_URL}/api/gigs`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        title,
                        category,
                        rate,
                        description,
                        creatorName
                    })
                }
            );


            const data = await response.json();


            if (!response.ok) {

                showToast(
                    data.message || "Failed to publish gig.",
                    "!"
                );

                return;
            }


            this.reset();


            showToast(
                "Your gig was published!",
                "✓"
            );


            showPage("marketplace");

            renderGigs();


        } catch (error) {

            console.error(error);

            showToast(
                "Unable to connect to server.",
                "!"
            );
        }

    });


// =====================================================
// BOOKING MODAL
// =====================================================

async function openBooking(gigId) {

    try {

        const response =
            await fetch(`${API_URL}/api/gigs/${gigId}`);

        if (!response.ok) {
            throw new Error("Gig not found");
        }

        const gig = await response.json();


        document.getElementById("bookingGigId").value =
            gig.id;

        document.getElementById("modalGigTitle").textContent =
            gig.title;

        document.getElementById("modalGigInfo").textContent =
            `${gig.category} · ₹${Number(gig.rate).toLocaleString()} · by ${gig.creatorName}`;


        document
            .getElementById("bookingModal")
            .classList.add("show");


    } catch (error) {

        console.error(error);

        showToast(
            "Unable to open this gig.",
            "!"
        );
    }
}


function closeModal() {

    document
        .getElementById("bookingModal")
        .classList.remove("show");

    document
        .getElementById("bookingForm")
        .reset();
}


// =====================================================
// CREATE BOOKING
// =====================================================

document
    .getElementById("bookingForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();


        const gigId =
            document.getElementById("bookingGigId").value;

        const clientName =
            document.getElementById("clientName").value.trim();

        const message =
            document.getElementById("clientMessage").value.trim();


        if (!clientName) {

            showToast(
                "Please enter your name.",
                "!"
            );

            return;
        }


        // Remember client name for My Bookings
        localStorage.setItem(
            "skillswap_clientName",
            clientName
        );


        try {

            const response =
                await fetch(
                    `${API_URL}/api/bookings`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({
                            gigId: Number(gigId),
                            clientName,
                            message
                        })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                showToast(
                    data.message ||
                    "Booking could not be created.",
                    "!"
                );

                return;
            }


            closeModal();


            showToast(
                "Booking submitted successfully!",
                "✓"
            );


            setTimeout(() => {
                showPage("bookings");
            }, 500);


        } catch (error) {

            console.error(error);

            showToast(
                "Unable to connect to server.",
                "!"
            );
        }

    });


// =====================================================
// CREATOR DASHBOARD
// =====================================================

async function renderDashboard() {

    const container =
        document.getElementById("dashboardBookings");

    if (!container) return;


    /*
       Your current demo creator is Anisha.
       If the creator name changes, the backend API
       can return bookings for that creator.
    */

    const creatorName =
        localStorage.getItem("skillswap_creatorName") ||
        "Anisha";


    try {

        const response =
            await fetch(
                `${API_URL}/api/bookings/creator/${encodeURIComponent(creatorName)}`
            );


        if (!response.ok) {
            throw new Error("Failed to load creator bookings");
        }


        const bookings =
            await response.json();


        const pending =
            bookings.filter(
                b => b.status === "Pending"
            ).length;

        const accepted =
            bookings.filter(
                b => b.status === "Accepted"
            ).length;

        const declined =
            bookings.filter(
                b => b.status === "Declined"
            ).length;


        document.getElementById("pendingCount").textContent =
            pending;

        document.getElementById("acceptedCount").textContent =
            accepted;

        document.getElementById("declinedCount").textContent =
            declined;

        document.getElementById("totalBookingCount").textContent =
            bookings.length;


        if (bookings.length === 0) {

            container.innerHTML = `
                <div class="empty">
                    <h3>No booking requests yet</h3>
                    <p>
                        When clients book your gigs,
                        their requests will appear here.
                    </p>
                </div>
            `;

            return;
        }


        const sorted =
            [...bookings].sort(
                (a, b) =>
                    new Date(b.createdAt) -
                    new Date(a.createdAt)
            );


        container.innerHTML =
            sorted.map(booking => `

                <div class="booking-card">

                    <div class="booking-main">

                        <h3>
                            ${escapeHTML(booking.gigTitle)}
                        </h3>

                        <p>
                            <strong>Client:</strong>
                            ${escapeHTML(booking.clientName)}
                        </p>

                        <p>
                            ${escapeHTML(
                                booking.message ||
                                "No message provided."
                            )}
                        </p>

                        <p>
                            <strong>Rate:</strong>
                            ₹${Number(booking.rate).toLocaleString()}
                        </p>

                    </div>


                    <div class="booking-meta">

                        <span class="status ${booking.status.toLowerCase()}">
                            ${booking.status}
                        </span>


                        ${
                            booking.status === "Pending"
                            ?
                            `
                            <div class="booking-actions">

                                <button
                                    class="accept-btn"
                                    onclick="updateBooking('${booking.id}', 'Accepted')"
                                >
                                    ✓ Accept
                                </button>

                                <button
                                    class="decline-btn"
                                    onclick="updateBooking('${booking.id}', 'Declined')"
                                >
                                    Decline
                                </button>

                            </div>
                            `
                            :
                            ""
                        }

                    </div>

                </div>

            `).join("");


    } catch (error) {

        console.error(error);

        container.innerHTML = `
            <div class="empty">
                <h3>Unable to load bookings</h3>
                <p>Please refresh the page.</p>
            </div>
        `;
    }
}


// =====================================================
// ACCEPT / DECLINE BOOKING
// =====================================================

async function updateBooking(bookingId, status) {

    const endpoint =
        status === "Accepted"
            ? "accept"
            : "decline";


    try {

        const response =
            await fetch(
                `${API_URL}/api/bookings/${bookingId}/${endpoint}`,
                {
                    method: "PATCH"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            showToast(
                data.message ||
                "Unable to update booking.",
                "!"
            );

            return;
        }


        if (status === "Accepted") {

            showToast(
                "Booking accepted.",
                "✓"
            );

        } else {

            showToast(
                "Booking declined.",
                "!"
            );
        }


        // Refresh dashboard from backend
        await renderDashboard();


        // Refresh client bookings too
        await renderMyBookings();


    } catch (error) {

        console.error(error);

        showToast(
            "Unable to connect to server.",
            "!"
        );
    }
}


// =====================================================
// MY BOOKINGS
// =====================================================

async function renderMyBookings() {

    const container =
        document.getElementById("myBookings");

    if (!container) return;


    const clientName =
        localStorage.getItem("skillswap_clientName");


    if (!clientName) {

        container.innerHTML = `
            <div class="empty">

                <h3>No bookings yet</h3>

                <p>
                    Browse the marketplace and book a gig
                    to see it here.
                </p>

                <button
                    class="browse-btn"
                    onclick="showPage('marketplace')"
                >
                    Browse gigs
                </button>

            </div>
        `;

        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/api/bookings/client/${encodeURIComponent(clientName)}`
            );


        if (!response.ok) {
            throw new Error("Failed to load client bookings");
        }


        const bookings =
            await response.json();


        if (bookings.length === 0) {

            container.innerHTML = `
                <div class="empty">

                    <h3>No bookings yet</h3>

                    <p>
                        Browse the marketplace and book a gig
                        to see it here.
                    </p>

                </div>
            `;

            return;
        }


        const sorted =
            [...bookings].sort(
                (a, b) =>
                    new Date(b.createdAt) -
                    new Date(a.createdAt)
            );


        container.innerHTML =
            sorted.map(booking => `

                <div class="booking-card">

                    <div class="booking-main">

                        <h3>
                            ${escapeHTML(booking.gigTitle)}
                        </h3>

                        <p>
                            Creator:
                            <strong>
                                ${escapeHTML(booking.creatorName)}
                            </strong>
                        </p>

                        <p>
                            ₹${Number(booking.rate).toLocaleString()}
                        </p>

                        ${
                            booking.status === "Declined"
                            ?
                            `
                            <button
                                class="browse-btn"
                                onclick="showPage('marketplace')"
                            >
                                Browse other gigs →
                            </button>
                            `
                            :
                            ""
                        }

                    </div>


                    <div class="booking-meta">

                        <span class="status ${booking.status.toLowerCase()}">
                            ${booking.status}
                        </span>

                    </div>

                </div>

            `).join("");


    } catch (error) {

        console.error(error);

        container.innerHTML = `
            <div class="empty">

                <h3>Unable to load bookings</h3>

                <p>
                    Please refresh the page and try again.
                </p>

            </div>
        `;
    }
}


// =====================================================
// TOAST
// =====================================================

let toastTimer;

function showToast(message, icon = "✓") {

    const toast =
        document.getElementById("toast");

    if (!toast) return;


    document.getElementById("toastText").textContent =
        message;

    document.getElementById("toastIcon").textContent =
        icon;


    toast.classList.add("show");


    clearTimeout(toastTimer);


    toastTimer =
        setTimeout(() => {

            toast.classList.remove("show");

        }, 3000);
}


// =====================================================
// HELPERS
// =====================================================

function getInitial(name) {

    return escapeHTML(
        String(name || "")
            .trim()
            .charAt(0)
            .toUpperCase()
    );
}


function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// =====================================================
// INITIAL LOAD
// =====================================================

renderGigs();
renderDashboard();
renderMyBookings();