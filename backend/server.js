const express = require("express");
const cors = require("cors");
const db = require("./database");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// ==========================================
// HOME
// ==========================================
app.get("/", (req, res) => {
    res.json({
        message: "SkillSwap Backend API is running!"
    });
});

// ==========================================
// HEALTH CHECK
// ==========================================
app.get("/api/health", (req, res) => {
    res.json({
        status: "OK",
        message: "SkillSwap API is working"
    });
});

// ==========================================
// GET ALL GIGS
// ==========================================
app.get("/api/gigs", (req, res) => {
    try {
        const gigs = db.prepare(`
            SELECT *
            FROM gigs
            ORDER BY createdAt DESC
        `).all();

        res.json(gigs);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch gigs",
            error: error.message
        });
    }
});

// ==========================================
// GET ONE GIG
// ==========================================
app.get("/api/gigs/:id", (req, res) => {
    try {
        const gig = db.prepare(`
            SELECT *
            FROM gigs
            WHERE id = ?
        `).get(req.params.id);

        if (!gig) {
            return res.status(404).json({
                message: "Gig not found"
            });
        }

        res.json(gig);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch gig",
            error: error.message
        });
    }
});

// ==========================================
// CREATE A GIG
// ==========================================
app.post("/api/gigs", (req, res) => {
    try {
        const {
            title,
            category,
            rate,
            description,
            creatorName
        } = req.body;

        if (!title || !category || !rate || !description || !creatorName) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const result = db.prepare(`
            INSERT INTO gigs
            (
                title,
                category,
                rate,
                description,
                creatorName
            )
            VALUES (?, ?, ?, ?, ?)
        `).run(
            title,
            category,
            Number(rate),
            description,
            creatorName
        );

        const newGig = db.prepare(`
            SELECT *
            FROM gigs
            WHERE id = ?
        `).get(result.lastInsertRowid);

        res.status(201).json({
            message: "Gig created successfully",
            gig: newGig
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to create gig",
            error: error.message
        });
    }
});

// ==========================================
// CREATE BOOKING
// ==========================================
app.post("/api/bookings", (req, res) => {
    try {
        const {
            gigId,
            clientName,
            message
        } = req.body;

        if (!gigId || !clientName) {
            return res.status(400).json({
                message: "gigId and clientName are required"
            });
        }

        const gig = db.prepare(`
            SELECT *
            FROM gigs
            WHERE id = ?
        `).get(gigId);

        if (!gig) {
            return res.status(404).json({
                message: "Gig not found"
            });
        }

        // DOUBLE BOOKING PROTECTION
        const pendingBooking = db.prepare(`
            SELECT *
            FROM bookings
            WHERE gigId = ?
            AND status = 'Pending'
        `).get(gigId);

        if (pendingBooking) {
            return res.status(409).json({
                message:
                    "This gig already has a pending booking. Please try again later."
            });
        }

        // CREATE BOOKING
        const result = db.prepare(`
            INSERT INTO bookings
            (
                gigId,
                clientName,
                creatorName,
                message,
                status
            )
            VALUES (?, ?, ?, ?, 'Pending')
        `).run(
            gigId,
            clientName,
            gig.creatorName,
            message || ""
        );

        const booking = db.prepare(`
            SELECT
                bookings.*,
                gigs.title AS gigTitle,
                gigs.category,
                gigs.rate,
                gigs.description
            FROM bookings
            JOIN gigs
                ON bookings.gigId = gigs.id
            WHERE bookings.id = ?
        `).get(result.lastInsertRowid);

        res.status(201).json({
            message: "Booking created successfully",
            booking
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to create booking",
            error: error.message
        });
    }
});

// ==========================================
// GET CREATOR BOOKINGS
// ==========================================
app.get("/api/bookings/creator/:creatorName", (req, res) => {
    try {
        const bookings = db.prepare(`
            SELECT
                bookings.*,
                gigs.title AS gigTitle,
                gigs.category,
                gigs.rate,
                gigs.description
            FROM bookings
            JOIN gigs
                ON bookings.gigId = gigs.id
            WHERE bookings.creatorName = ?
            ORDER BY bookings.createdAt DESC
        `).all(req.params.creatorName);

        res.json(bookings);

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch creator bookings",
            error: error.message
        });
    }
});

// ==========================================
// ACCEPT BOOKING
// ==========================================
app.patch("/api/bookings/:id/accept", (req, res) => {
    try {
        const booking = db.prepare(`
            SELECT *
            FROM bookings
            WHERE id = ?
        `).get(req.params.id);

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        if (booking.status !== "Pending") {
            return res.status(400).json({
                message: `Booking is already ${booking.status}`
            });
        }

        db.prepare(`
            UPDATE bookings
            SET status = 'Accepted'
            WHERE id = ?
        `).run(req.params.id);

        const updatedBooking = db.prepare(`
            SELECT *
            FROM bookings
            WHERE id = ?
        `).get(req.params.id);

        res.json({
            message: "Booking accepted successfully",
            booking: updatedBooking
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to accept booking",
            error: error.message
        });
    }
});

// ==========================================
// DECLINE BOOKING
// ==========================================
app.patch("/api/bookings/:id/decline", (req, res) => {
    try {
        const booking = db.prepare(`
            SELECT *
            FROM bookings
            WHERE id = ?
        `).get(req.params.id);

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        if (booking.status !== "Pending") {
            return res.status(400).json({
                message: `Booking is already ${booking.status}`
            });
        }

        db.prepare(`
            UPDATE bookings
            SET status = 'Declined'
            WHERE id = ?
        `).run(req.params.id);

        const updatedBooking = db.prepare(`
            SELECT *
            FROM bookings
            WHERE id = ?
        `).get(req.params.id);

        res.json({
            message: "Booking declined successfully",
            booking: updatedBooking
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to decline booking",
            error: error.message
        });
    }
});

// ==========================================
// GET CLIENT BOOKINGS
// ==========================================
app.get("/api/bookings/client/:clientName", (req, res) => {
    try {
        const bookings = db.prepare(`
            SELECT
                bookings.*,
                gigs.title AS gigTitle,
                gigs.category,
                gigs.rate,
                gigs.description
            FROM bookings
            JOIN gigs
                ON bookings.gigId = gigs.id
            WHERE bookings.clientName = ?
            ORDER BY bookings.createdAt DESC
        `).all(req.params.clientName);

        res.json(bookings);

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch client bookings",
            error: error.message
        });
    }
});

// ==========================================
// START SERVER
// ==========================================
app.listen(PORT, () => {
    console.log(
        `SkillSwap backend running at http://localhost:${PORT}`
    );
});