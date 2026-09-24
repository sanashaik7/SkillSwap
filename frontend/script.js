// =====================================================
// SKILLSWAP FRONTEND
// Connected to Node.js + SQLite Backend
// =====================================================

const API = "http://localhost:5000/api";

let gigs = [];
let bookings = [];


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
        loadGigs();
    }

    if (pageId === "dashboard") {
        loadCreatorBookings();
    }

    if (pageId === "bookings") {
        loadClientBookings();
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// =====================================================
// GET ALL GIGS
// =====================================================

async function loadGigs() {

    try {

        const response = await fetch(`${API}/gigs`);

        if (!response.ok) {
            throw new Error("Failed to load gigs");
        }

        gigs = await response.json();

        renderGigs();

    } catch (error) {

        console.error("Gigs error:", error);

        document.getElementById("gigCount").textContent = "0";

        document.getElementById("gigGrid").innerHTML = `
            <div class="empty" style="grid-column:1/-1">
                <h3>Unable to load gigs</h3>
                <p>Make sure the SkillSwap backend is running.</p>
            </div>
        `;
    }
}


// =====================================================
// DISPLAY GIGS
// =====================================================

function renderGigs() {

    const grid = document.getElementById("gigGrid");

    if (!grid) return;

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


    document.getElementById("gigCount").textContent =
        filtered.length;


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
}


// =====================================================
// CREATE GIG
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

            const response = await fetch(`${API}/gigs`, {

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
            });


            const data = await response.json();


            if (!response.ok) {

                showToast(
                    data.message || "Failed to create gig.",
                    "!"
                );

                return;
            }


            this.reset();

            showToast(
                "Your gig was published!",
                "✓"
            );


            await loadGigs();

            showPage("marketplace");

        } catch (error) {

            console.error(error);

            showToast(
                "Backend connection failed.",
                "!"
            );
        }
    });


// =====================================================
// BOOKING MODAL
// =====================================================

function openBooking(gigId) {

    const gig =
        gigs.find(g => Number(g.id) === Number(gigId));

    if (!gig) return;


    document.getElementById("bookingGigId").value =
        gig.id;

    document.getElementById("modalGigTitle").textContent =
        gig.title;

    document.getElementById("modalGigInfo").textContent =
        `${gig.category} · ₹${Number(gig.rate).toLocaleString()} · by ${gig.creatorName}`;


    document
        .getElementById("bookingModal")
        .classList.add("show");
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


        try {

            const response = await fetch(`${API}/bookings`, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    gigId: Number(gigId),
                    clientName,
                    message
                })
            });


            const data = await response.json();


            if (!response.ok) {

                showToast(
                    data.message || "Booking failed.",
                    "!"
                );

                return;
            }


            closeModal();


            showToast(
                "Booking submitted successfully!",
                "✓"
            );


            await loadClientBookings();


            setTimeout(() => {
                showPage("bookings");
            }, 500);


        } catch (error) {

            console.error(error);

            showToast(
                "Backend connection failed.",
                "!"
            );
        }
    });


// =====================================================
// CREATOR DASHBOARD
// =====================================================

async function loadCreatorBookings() {

    try {

        // Use the creator name that you used for your database gig.
        const creatorName = "Anisha";

        const response =
            await fetch(
                `${API}/bookings/creator/${encodeURIComponent(creatorName)}`
            );


        if (!response.ok) {
            throw new Error("Failed to load creator bookings");
        }


        bookings = await response.json();

        renderDashboard();

    } catch (error) {

        console.error(error);

        bookings = [];

        renderDashboard();
    }
}


function renderDashboard() {

    const container =
        document.getElementById("dashboardBookings");


    if (!container) return;


    const pending =
        bookings.filter(b => b.status === "Pending").length;

    const accepted =
        bookings.filter(b => b.status === "Accepted").length;

    const declined =
        bookings.filter(b => b.status === "Declined").length;


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
                <p>When clients book your gigs, requests will appear here.</p>
            </div>
        `;

        return;
    }


    container.innerHTML =
        bookings.map(booking => `

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
                                onclick="updateBooking(${booking.id}, 'Accepted')"
                            >
                                ✓ Accept
                            </button>

                            <button
                                class="decline-btn"
                                onclick="updateBooking(${booking.id}, 'Declined')"
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
}


// =====================================================
// ACCEPT / DECLINE BOOKING
// =====================================================

async function updateBooking(bookingId, status) {

    const action =
        status === "Accepted"
            ? "accept"
            : "decline";


    try {

        const response =
            await fetch(
                `${API}/bookings/${bookingId}/${action}`,
                {
                    method: "PATCH"
                }
            );


        const data = await response.json();


        if (!response.ok) {

            showToast(
                data.message || "Update failed.",
                "!"
            );

            return;
        }


        showToast(
            status === "Accepted"
                ? "Booking accepted."
                : "Booking declined.",
            status === "Accepted"
                ? "✓"
                : "!"
        );


        await loadCreatorBookings();

        await loadClientBookings();

    } catch (error) {

        console.error(error);

        showToast(
            "Backend connection failed.",
            "!"
        );
    }
}


// =====================================================
// CLIENT BOOKINGS
// =====================================================

async function loadClientBookings() {

    try {

        // Demo client name.
        // This must match the name entered while booking.
        const clientName =
            document.getElementById("clientName")
                ?.value.trim() || "Client One";


        const response =
            await fetch(
                `${API}/bookings/client/${encodeURIComponent(clientName)}`
            );


        if (!response.ok) {
            throw new Error("Failed to load client bookings");
        }


        bookings = await response.json();

        renderMyBookings();

    } catch (error) {

        console.error(error);

        bookings = [];

        renderMyBookings();
    }
}


function renderMyBookings() {

    const container =
        document.getElementById("myBookings");


    if (!container) return;


    if (bookings.length === 0) {

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


    container.innerHTML =
        bookings.map(booking => `

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
}


// =====================================================
// TOAST
// =====================================================

let toastTimer;

function showToast(message, icon = "✓") {

    const toast =
        document.getElementById("toast");

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

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// =====================================================
// INITIAL LOAD
// =====================================================

loadGigs();
loadCreatorBookings();
loadClientBookings();