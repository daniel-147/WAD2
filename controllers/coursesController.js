// controllers/coursesController.js
import { bookCourseForUser, bookSessionForUser } from "../services/bookingService.js";
import { BookingModel } from "../models/bookingModel.js";

export const postBookCourse = async (req, res) => {
  if (!req.user) return res.redirect("/login");

  try {
    const booking = await bookCourseForUser(req.user.id, req.params.id);
    res.redirect(`/courses-page/${req.params.id}?courseBooked=1&status=${booking.status}`);
  } catch (err) {
    res.status(400).render("error", {
      title: "Booking failed",
      message: err.message,
    });
  }
};

export const postBookSession = async (req, res) => {
  if (!req.user) return res.redirect("/login");

  try {
    const booking = await bookSessionForUser(req.user.id, req.params.id);
    res.redirect(`/courses-page/${booking.courseId}?sessionBooked=${req.params.id}&status=${booking.status}`);
  } catch (err) {
    const message =
      err.code === "DROPIN_NOT_ALLOWED"
        ? "Drop-ins are not allowed for this course."
        : err.message;

    res.status(400).render("error", {
      title: "Booking failed",
      message,
    });
  }
};

export const bookingConfirmationPage = async (req, res) => {
  const booking = await BookingModel.findById(req.params.bookingId);
  if (!booking)
    return res.status(404).render("error", {
      title: "Not found",
      message: "Booking not found",
    });

  res.render("booking_confirmation", {
    title: "Booking confirmation",
    booking: {
      id: booking._id,
      type: booking.type,
      status: req.query.status || booking.status,
      createdAt: booking.createdAt
        ? new Date(booking.createdAt).toLocaleString("en-GB")
        : "",
    },
  });
};
