// controllers/viewsController.js
import { CourseModel } from "../models/courseModel.js";
import { SessionModel } from "../models/sessionModel.js";
import { UserModel } from "../models/userModel.js";
import {
  bookCourseForUser,
  bookSessionForUser,
} from "../services/bookingService.js";
import { BookingModel } from "../models/bookingModel.js";

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

// Pick up to N items at random from an array (no new dependencies)
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

        // Collect class locations
        const locations = Array.from(
          new Set(
            sessions
              .map((s) => s.location)
              .filter(
                (loc) => typeof loc === "string" && loc.trim().length > 0,
              ),
          ),
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
          // For homepage “classes and their location”
          classLocations: locations.join(", ") || "TBA",
        };
      }),
    );

    res.render("home", {
      title: "Yoga Courses",
      isLoggedIn: Boolean(req.user),
      isOrganiser: req.user?.role === "organiser",
      // organisationOverview:
      //   "Welcome to our yoga studio. Browse upcoming courses and classes below. Class locations are shown where available.",
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
      return res
        .status(404)
        .render("error", { title: "Not found", message: "Course not found" });

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

export const postBookCourse = async (req, res, next) => {
  try {
    // Feature 2 requirement: redirect to login if user is not logged in
    if (!req.user) {
      return res.redirect("/login");
    }
    const courseId = req.params.id;

    const booking = await bookCourseForUser(req.user.id, courseId);
    res.redirect(`/courses-page/${courseId}?courseBooked=1&status=${booking.status}`);
  } catch (err) {
    res
      .status(400)
      .render("error", { title: "Booking failed", message: err.message });
  }
};

export const postBookSession = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.redirect("/login");
    }
    const sessionId = req.params.id;
    const booking = await bookSessionForUser(req.user.id, sessionId);
    res.redirect(`/courses-page/${booking.courseId}?sessionBooked=${sessionId}&status=${booking.status}`);
  } catch (err) {
    const message =
      err.code === "DROPIN_NOT_ALLOWED"
        ? "Drop-ins are not allowed for this course."
        : err.message;
    res.status(400).render("error", { title: "Booking failed", message });
  }
};

export const bookingConfirmationPage = async (req, res, next) => {
  try {
    const bookingId = req.params.bookingId;
    const booking = await BookingModel.findById(bookingId);
    if (!booking)
      return res
        .status(404)
        .render("error", { title: "Not found", message: "Booking not found" });

    res.render("booking_confirmation", {
      title: "Booking confirmation",
      booking: {
        id: booking._id,
        type: booking.type,
        status: req.query.status || booking.status,
        createdAt: booking.createdAt ? fmtDate(booking.createdAt) : "",
      },
    });
  } catch (err) {
    next(err);
  }
};
// Feature 4: Login page
export const loginPage = (req, res) => {
  const success =
    req.query.registered === "1"
      ? "Your account has been created successfully. Please log in."
      : null;

  res.status(200).render("login", {
    title: "Login",
    isLoggedIn: Boolean(req.user),
    email: "",
    error: null,
    success,
    redirectTo: null,
  });
};

// Feature 5: Login success message + redirect
export const handleLogin = (req, res) => {
  res.status(200).render("login", {
    title: "Login",
    isLoggedIn: true,
    email: req.user?.email || "",
    error: null,
    success: "Logged in successfully! Returning to homepage",
    redirectTo: "/",
  });
};

export const logout = (req, res) => {
  res.clearCookie("jwt").status(200).redirect("/");
};

export const registerPage = (req, res) => {
  res.render("register", {
    title: "Register",
    name: "",
    email: "",
    errors: {},
  });
};

// ✅ NEW: POST /register handler
export const postRegister = async (req, res) => {
  const { name, email, password } = req.body;
  const errors = {};

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.email = "Not a valid email address";
  }

  // Password validation (6–12 chars, letter, number, special char)
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{6,12}$/;
  if (!passwordRegex.test(password)) {
    errors.password =
      "Password must be 6-12 characters long and contain at least one: letter, number and special character";
  }

  // Email uniqueness
  const existingUser = await UserModel.findByEmail(email);
  if (existingUser) {
    errors.email =
      "An account has already been created with this email address";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).render("register", {
      title: "Register",
      name,
      email,
      errors,
    });
  }

  try {
    await UserModel.create({
      name,
      email,
      password,
      role: "user",
    });

    return res.redirect("/login?registered=1");
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).render("register", {
      title: "Register",
      name,
      email,
      errors: {
        general: "Something went wrong! Please try again",
      },
    });
  }
};

export const addCoursePage = (req, res) => {
  res.render("add-course", {
    title: "Add Course",
    isLoggedIn: true,
    isOrganiser: true,
  });
};

export const postAddCourse = async (req, res) => {
  const {
    title,
    durationNumber,
    durationUnit,
    level,
    type,
    allowDropIn,
    startDay,
    startMonth,
    startYear,
    endDay,
    endMonth,
    endYear,
    sessionCount,
    description,
  } = req.body;

  const course = await CourseModel.create({
    title,
    duration: `${durationNumber} ${durationUnit}`,
    level,
    type,
    allowDropIn: allowDropIn === "yes",
    startDate: `${startYear}-${startMonth}-${startDay}`,
    endDate: `${endYear}-${endMonth}-${endDay}`,
    instructorId: req.user.id,
    sessionIds: [],
    description,
  });

  res.redirect(
    `/organiser/add-course/${course._id}/sessions?count=${sessionCount}`
  );
};

export const addSessionsPage = (req, res) => {
  const count = Number(req.query.count);

  const rows = Array.from({ length: count }, (_, i) => ({
    index: i,
    displayIndex: i + 1,
    // blank defaults for add flow
    sessionId: "",
    startYear: "",
    startMonth: "",
    startDay: "",
    startHour: "",
    startMinute: "",
    endYear: "",
    endMonth: "",
    endDay: "",
    endHour: "",
    endMinute: "",
    capacity: "",
    description: "",
    location: "",
    price: "",
  }));

  res.render("add-sessions", {
    title: "Add Sessions",
    courseId: req.params.courseId,
    rows,
    isOrganiser: req.user?.role === "organiser",
    isLoggedIn: Boolean(req.user),
    count: rows.length,
    formAction: `/organiser/add-course/${req.params.courseId}/sessions`,
  });
};

export const postAddSessions = async (req, res) => {
  const courseId = req.params.courseId;
  const count = Number(req.body.count);

  const sessionIds = [];

  for (let i = 0; i < count; i++) {
    const session = await SessionModel.create({
      courseId,
      startDateTime: new Date(
        req.body[`startYear${i}`],
        req.body[`startMonth${i}`] - 1,
        req.body[`startDay${i}`],
        req.body[`startHour${i}`],
        req.body[`startMinute${i}`]
      ).toISOString(),
      endDateTime: new Date(
        req.body[`endYear${i}`],
        req.body[`endMonth${i}`] - 1,
        req.body[`endDay${i}`],
        req.body[`endHour${i}`],
        req.body[`endMinute${i}`]
      ).toISOString(),
      capacity: Number(req.body[`capacity${i}`]),
      bookedCount: 0,
      description: req.body[`description${i}`],
      location: req.body[`location${i}`],
      price: Number(req.body[`price${i}`]),
    });

    sessionIds.push(session._id);
  }

  await CourseModel.update(courseId, { sessionIds });

  res.redirect("/?created=1");
};
const splitYMD = (ymd) => {
  if (!ymd || typeof ymd !== "string" || !ymd.includes("-")) {
    return { y: "", m: "", d: "" };
  }
  const [y, m, d] = ymd.split("-");
  return { y: y ?? "", m: m ?? "", d: d ?? "" };
};

const parseDuration = (duration) => {
  if (!duration || typeof duration !== "string") return { n: "", u: "" };
  const parts = duration.trim().split(/\s+/);
  if (parts.length < 2) return { n: parts[0] ?? "", u: "" };
  return { n: parts[0] ?? "", u: parts[1] ?? "" };
};

const pad2 = (n) => String(n).padStart(2, "0");

const splitISO = (iso) => {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) {
    return { y: "", m: "", d: "", hh: "", mm: "" };
  }
  return {
    y: String(d.getFullYear()),
    m: pad2(d.getMonth() + 1),
    d: pad2(d.getDate()),
    hh: pad2(d.getHours()),
    mm: pad2(d.getMinutes()),
  };
};

// GET update course (reuse add-course form, pre-populated)
export const updateCoursePage = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    const course = await CourseModel.findById(courseId);

    if (!course) {
      return res
        .status(404)
        .render("error", { title: "Not found", message: "Course not found" });
    }

    // ✅ derive session count from actual sessions
    const sessions = await SessionModel.listByCourse(courseId);
    const sessionCount = sessions.length;

    // parse duration: "6 weeks"
    let durationNumber = "";
    let durationUnit = "";
    if (course.duration) {
      const parts = course.duration.split(" ");
      durationNumber = parts[0] ?? "";
      durationUnit = parts[1] ?? "";
    }

    const [startYear, startMonth, startDay] =
      course.startDate?.split("-") ?? ["", "", ""];
    const [endYear, endMonth, endDay] =
      course.endDate?.split("-") ?? ["", "", ""];

    res.render("add-course", {
      title: "Update Course",
      isLoggedIn: true,
      isOrganiser: true,
      isUpdate: true,

      courseId,

      // text fields
      titleValue: course.title ?? "",
      descriptionValue: course.description ?? "",

      // ✅ THIS was missing
      sessionCountValue: String(sessionCount),

      // duration
      durationNumberValue: durationNumber,
      durationUnit_days: durationUnit === "days",
      durationUnit_weeks: durationUnit === "weeks",
      durationUnit_months: durationUnit === "months",

      // level
      level_beginner: course.level === "beginner",
      level_intermediate: course.level === "intermediate",
      level_advanced: course.level === "advanced",

      // type
      type_weekend: course.type === "weekend",
      type_weekly: course.type === "weekly",

      // drop‑ins
      allowDropInYes: course.allowDropIn === true,
      allowDropInNo: course.allowDropIn === false,

      // dates
      startDayValue: startDay,
      startMonthValue: startMonth,
      startYearValue: startYear,
      endDayValue: endDay,
      endMonthValue: endMonth,
      endYearValue: endYear,
    });
  } catch (err) {
    next(err);
  }
};


// POST update course (update existing, then go to sessions form)
export const postUpdateCourse = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    const {
      title,
      durationNumber,
      durationUnit,
      level,
      type,
      allowDropIn,
      startDay,
      startMonth,
      startYear,
      endDay,
      endMonth,
      endYear,
      sessionCount,
      description,
    } = req.body;

    await CourseModel.update(courseId, {
      title,
      duration: `${durationNumber} ${durationUnit}`,
      level,
      type,
      allowDropIn: allowDropIn === "yes",
      startDate: `${startYear}-${startMonth}-${startDay}`,
      endDate: `${endYear}-${endMonth}-${endDay}`,
      description,
    });

    res.redirect(
      `/organiser/update-course/${courseId}/sessions?count=${sessionCount}`
    );
  } catch (err) {
    next(err);
  }
};

// GET update sessions (reuse add-sessions form, pre-populated)
export const updateSessionsPage = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    const requestedCount = Number(req.query.count);

    const course = await CourseModel.findById(courseId);
    if (!course) {
      return res
        .status(404)
        .render("error", { title: "Not found", message: "Course not found" });
    }

    const existing = await SessionModel.listByCourse(courseId);

    // Sort ascending; if decreased, drop furthest future (end of list)
    const sorted = [...existing].sort(
      (a, b) =>
        new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
    );

    const toPopulate = sorted.slice(0, Math.min(requestedCount, sorted.length));
    const rows = [];

    for (let i = 0; i < toPopulate.length; i++) {
      const s = toPopulate[i];
      const sp = splitISO(s.startDateTime);
      const ep = splitISO(s.endDateTime);

      rows.push({
        index: i,
        sessionId: s._id,

        startYear: sp.y,
        startMonth: sp.m,
        startDay: sp.d,
        startHour: sp.hh,
        startMinute: sp.mm,

        endYear: ep.y,
        endMonth: ep.m,
        endDay: ep.d,
        endHour: ep.hh,
        endMinute: ep.mm,

        capacity: s.capacity ?? "",
        description: s.description ?? "",
        location: s.location ?? "",
        price: s.price ?? "",
      });
    }

    // If increased, extra blank rows
    for (let i = toPopulate.length; i < requestedCount; i++) {
      rows.push({
        index: i,
        sessionId: "",
        startYear: "",
        startMonth: "",
        startDay: "",
        startHour: "",
        startMinute: "",
        endYear: "",
        endMonth: "",
        endDay: "",
        endHour: "",
        endMinute: "",
        capacity: "",
        description: "",
        location: "",
        price: "",
      });
    }

    res.render("add-sessions", {
      title: "Add Sessions",
      isLoggedIn: true,
      isOrganiser: true,
      isUpdate: true,
      formAction: `/organiser/update-course/${courseId}/sessions`,
      courseId,
      count: requestedCount,
      rows,
    });
  } catch (err) {
    next(err);
  }
};

// POST update sessions (update existing rows; create new rows; then update course.sessionIds)
export const postUpdateSessions = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    const count = Number(req.body.count);

    const existing = await SessionModel.listByCourse(courseId);

    // Sorted ascending by startDateTime
    const sorted = [...existing].sort(
      (a, b) =>
        new Date(a.startDateTime) - new Date(b.startDateTime)
    );

    const sessionsToKeep = sorted.slice(0, count);
    const sessionsToDelete = sorted.slice(count);

    // ✅ delete sessions beyond new count
    for (const s of sessionsToDelete) {
      await SessionModel.delete(s._id);
    }

    const sessionIds = [];

    for (let i = 0; i < count; i++) {
      const sessionId = req.body[`sessionId${i}`];

      const startDateTime = new Date(
        req.body[`startYear${i}`],
        req.body[`startMonth${i}`] - 1,
        req.body[`startDay${i}`],
        req.body[`startHour${i}`],
        req.body[`startMinute${i}`]
      ).toISOString();

      const endDateTime = new Date(
        req.body[`endYear${i}`],
        req.body[`endMonth${i}`] - 1,
        req.body[`endDay${i}`],
        req.body[`endHour${i}`],
        req.body[`endMinute${i}`]
      ).toISOString();

      const patch = {
        courseId,
        startDateTime,
        endDateTime,
        capacity: Number(req.body[`capacity${i}`]),
        description: req.body[`description${i}`],
        location: req.body[`location${i}`],
        price: Number(req.body[`price${i}`]),
      };

      if (sessionId) {
        await SessionModel.update(sessionId, patch);
        sessionIds.push(sessionId);
      } else {
        const created = await SessionModel.create({
          ...patch,
          bookedCount: 0,
        });
        sessionIds.push(created._id);
      }
    }

    await CourseModel.update(courseId, { sessionIds });
    res.redirect("/?updated=1");
  } catch (err) {
    next(err);
  }

  
};


export const viewSessionParticipants = async (req, res, next) => {
  try {
    const sessionId = req.params.sessionId;

    const session = await SessionModel.findById(sessionId);
    if (!session) {
      return res
        .status(404)
        .render("error", { title: "Not found", message: "Session not found" });
    }

    const bookings = await BookingModel.listBySession(sessionId);


    const participants = [];
    for (const booking of bookings) {
      if (!booking.userId) continue;

      const user = await UserModel.findById(booking.userId);
      if (!user) continue;

      participants.push({
        name: user.name,
        email: user.email
      });
    }

    res.render("session-participants", {
      title: "Class Participants",
      isLoggedIn: true,
      isOrganiser: true,
      session,
      participants
    });
  } catch (err) {
    next(err);
  }
};


export const addOrganiserPage = (req, res) => {
  res.render("add-organiser", {
    title: "Add Organiser",
    isLoggedIn: true,
    isOrganiser: true,
    errors: {},
    name: "",
    email: ""
  });
};

export const postAddOrganiser = async (req, res) => {
  const { name, email, password } = req.body;
  const errors = {};

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.email = "Not a valid email address";
  }

  const passwordRegex =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{6,12}$/;
  if (!passwordRegex.test(password)) {
    errors.password =
      "Password must be 6-12 characters long and contain at least one: letter, number and special character";
  }

  const existingUser = await UserModel.findByEmail(email);
  if (existingUser) {
    errors.email = "An account already exists with this email address";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).render("add-organiser", {
      title: "Add Organiser",
      isLoggedIn: true,
      isOrganiser: true,
      errors,
      name,
      email
    });
  }

  await UserModel.create({
    name,
    email,
    password,
    role: "organiser"
  });

  res.redirect("/organiser/users");
};

/* ============================
   Feature 12 – Edit Users
   ============================ */

export const userListPage = async (req, res) => {
  const users = await UserModel.listAll();

  res.render("user-list", {
    title: "Edit Users",
    isLoggedIn: true,
    isOrganiser: true,
    users
  });
};

export const deleteUser = async (req, res) => {
  const { userId } = req.params;
  await UserModel.deleteById(userId);
  res.redirect("/organiser/users");
};
