import { Router, type IRouter } from "express";
import healthRouter from "./health";
import familyRouter from "./family";
import alertsRouter from "./alerts";
import reportsRouter from "./reports";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/family", familyRouter);
router.use("/alerts", alertsRouter);
router.use("/reports", reportsRouter);
router.use("/dashboard", dashboardRouter);

export default router;
