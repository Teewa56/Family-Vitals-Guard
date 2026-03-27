import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import familyRouter from "./family";
import alertsRouter from "./alerts";
import reportsRouter from "./reports";
import dashboardRouter from "./dashboard";
import profileRouter from "./profile";
import providersRouter from "./providers";
import forecastRouter from "./forecast";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use("/family", familyRouter);
router.use("/alerts", alertsRouter);
router.use("/reports", reportsRouter);
router.use("/dashboard", dashboardRouter);
router.use("/profile", profileRouter);
router.use("/providers", providersRouter);
router.use("/forecast", forecastRouter);

export default router;
