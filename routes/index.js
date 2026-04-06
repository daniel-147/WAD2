import { Router } from "express";

import publicRoutes from "./public.js";
import authRoutes from "./auth.js";
import coursesRoutes from "./courses.js";
import organiserRoutes from "./organiser.js";
import usersRoutes from "./users.js";

const router = Router();

router.use(publicRoutes);
router.use(authRoutes);
router.use(coursesRoutes);
router.use(organiserRoutes);
router.use(usersRoutes);

export default router;
