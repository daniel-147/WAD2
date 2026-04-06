// controllers/organiserController.js

import { CourseModel } from "../models/courseModel.js";
import { SessionModel } from "../models/sessionModel.js";
import { BookingModel } from "../models/bookingModel.js";
import { UserModel } from "../models/userModel.js";

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

/* ============================
   ADD COURSE
   ============================ */

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

  res.redirect(`/organiser/add-course/${course._id}/sessions?count=${sessionCount}`);
};

/* ============================
   ADD SESSIONS
   ============================ */

export const addSessionsPage = (req, res) => {
  const count = Number(req.query.count);

  const rows = Array.from({ length: count }, (_, i) => ({
    index: i,
    displayIndex: i + 1,
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
    isOrganiser: true,
    isLoggedIn: true,
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

/* ============================
   UPDATE COURSE
   ============================ */

export const updateCoursePage = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    const course = await CourseModel.findById(courseId);

    if (!course) {
      return res.status(404).render("error", {
        title: "Not found",
        message: "Course not found",
      });
    }

    const sessions = await SessionModel.listByCourse(courseId);
    const sessionCount = sessions.length;

    const [startYear, startMonth, startDay] =
      course.startDate?.split("-") ?? ["", "", ""];
    const [endYear, endMonth, endDay] =
      course.endDate?.split("-") ?? ["", "", ""];

    const [durationNumber, durationUnit] = course.duration?.split(" ") ?? ["", ""];

    res.render("add-course", {
      title: "Update Course",
      isLoggedIn: true,
      isOrganiser: true,
      isUpdate: true,
      courseId,
      titleValue: course.title,
      descriptionValue: course.description,
      sessionCountValue: String(sessionCount),
      durationNumberValue: durationNumber,
      durationUnit_days: durationUnit === "days",
      durationUnit_weeks: durationUnit === "weeks",
      durationUnit_months: durationUnit === "months",
      level_beginner: course.level === "beginner",
      level_intermediate: course.level === "intermediate",
      level_advanced: course.level === "advanced",
      type_weekend: course.type === "weekend",
      type_weekly: course.type === "weekly",
      allowDropInYes: course.allowDropIn === true,
      allowDropInNo: course.allowDropIn === false,
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

    res.redirect(`/organiser/update-course/${courseId}/sessions?count=${sessionCount}`);
  } catch (err) {
    next(err);
  }
};

/* ============================
   UPDATE SESSIONS
   ============================ */

export const updateSessionsPage = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    const requestedCount = Number(req.query.count);

    const course = await CourseModel.findById(courseId);
    if (!course) {
      return res.status(404).render("error", {
        title: "Not found",
        message: "Course not found",
      });
    }

    const existing = await SessionModel.listByCourse(courseId);
    const sorted = [...existing].sort(
      (a, b) => new Date(a.startDateTime) - new Date(b.startDateTime)
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

export const postUpdateSessions = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    const count = Number(req.body.count);

    const existing = await SessionModel.listByCourse(courseId);
    const sorted = [...existing].sort(
      (a, b) => new Date(a.startDateTime) - new Date(b.startDateTime)
    );

    const sessionsToDelete = sorted.slice(count);
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

/* ============================
   VIEW SESSION PARTICIPANTS
   ============================ */

export const viewSessionParticipants = async (req, res, next) => {
  try {
    const sessionId = req.params.sessionId;

    const session = await SessionModel.findById(sessionId);
    if (!session) {
      return res.status(404).render("error", {
        title: "Not found",
        message: "Session not found",
      });
    }

    const bookings = await BookingModel.listBySession(sessionId);

    const participants = [];
    for (const booking of bookings) {
      if (!booking.userId) continue;

      const user = await UserModel.findById(booking.userId);
      if (!user) continue;

      participants.push({
        name: user.name,
        email: user.email,
      });
    }

    res.render("session-participants", {
      title: "Class Participants",
      isLoggedIn: true,
      isOrganiser: true,
      session,
      participants,
    });
  } catch (err) {
    next(err);
  }
};

/* ============================
   ADD ORGANISER
   ============================ */

export const addOrganiserPage = (req, res) => {
  res.render("add-organiser", {
    title: "Add Organiser",
    isLoggedIn: true,
    isOrganiser: true,
    errors: {},
    name: "",
    email: "",
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
      email,
    });
  }

  await UserModel.create({
    name,
    email,
    password,
    role: "organiser",
  });

  res.redirect("/organiser/users");
};
