# SkillSwap — Decision Points

## DP1 — Rejection

When a creator declines a booking, the client can see the booking in **My Bookings** with the status **Declined**.

The client can then look for another available gig and submit a new booking request. We chose this because a declined request should not leave the client without feedback, and the client should be able to continue using the marketplace.

## DP2 — Double Booking

A gig cannot accept another booking while it already has a **Pending** booking.

If another client tries to book the same gig while a Pending booking exists, the API rejects the request and returns a clear message explaining that the gig already has a pending booking. This prevents multiple clients from competing for the same currently pending gig.

## DP3 — Discovery

Gigs are displayed with the **newest gigs first**.

We chose this so newly posted creator services receive immediate visibility while still keeping the marketplace simple and predictable for users.