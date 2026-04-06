// controllers/publicController.js
import { CourseModel } from "../models/courseModel.js";
import { SessionModel } from "../models/sessionModel.js";

const fmtDate = (iso) =>
  new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const fmtDateOnly = (iso) =>
  new Date(iso).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const pickRandomUpTo = (arr, max) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(max, copy.length));
};

export const homePage = async (req, res, next) => {
  try {
    const courses = await CourseModel.list();
    const selected = pickRandomUpTo(courses, 5);

    const cards = await Promise.all(
      selected.map(async (c) => {
        const sessions = await SessionModel.listByCourse(c._id);
        const nextSession = sessions[0];

        const locations = Array.from(
          new Set(
            sessions
              .map((s) => s.location)
              .filter((loc) => typeof loc === "string" && loc.trim().length > 0)
          )
        );

        return {
          id: c._id,
          title: c.title,
          level: c.level,
          type: c.type,
          allowDropIn: c.allowDropIn,
          startDate: c.startDate ? fmtDateOnly(c.startDate) : "",
          endDate: c.endDate ? fmtDateOnly(c.endDate) : "",
          nextSession: nextSession ? fmtDate(nextSession.startDateTime) : "TBA",
          sessionsCount: sessions.length,
          description: c.description,
          classLocations: locations.join(", ") || "TBA",
        };
      })
    );

    res.render("home", {
      title: "Yoga Courses",
      isLoggedIn: Boolean(req.user),
      isOrganiser: req.user?.role === "organiser",
      courses: cards,
    });
  } catch (err) {
    next(err);
  }
};

export const courseDetailPage = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const course = await CourseModel.findById(courseId);
    if (!course)
      return res.status(404).render("error", {
        title: "Not found",
        message: "Course not found",
      });

    const sessions = await SessionModel.listByCourse(courseId);
    const sessionBookedId = req.query.sessionBooked || null;
    const courseBooked = req.query.courseBooked === "1";

    const rows = sessions.map((s) => ({
      id: s._id,
      start: fmtDate(s.startDateTime),
      end: fmtDate(s.endDateTime),
      capacity: s.capacity,
      booked: s.bookedCount ?? 0,
      remaining: Math.max(0, (s.capacity ?? 0) - (s.bookedCount ?? 0)),
      description: s.description ?? "",
      location: s.location ?? "",
      price: s.price ?? "",
      justBooked: sessionBookedId === s._id,
    }));

    res.render("course", {
      title: course.title,
      isLoggedIn: Boolean(req.user),
      courseBooked,
      course: {
        id: course._id,
        title: course.title,
        duration: course.duration ?? "",
        level: course.level,
        type: course.type,
        allowDropIn: course.allowDropIn,
        startDate: course.startDate ? fmtDateOnly(course.startDate) : "",
        endDate: course.endDate ? fmtDateOnly(course.endDate) : "",
        description: course.description,
      },
      isOrganiser: req.user?.role === "organiser",
      sessions: rows,
    });
  } catch (err) {
    next(err);
  }
};
