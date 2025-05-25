import createError from "http-errors";
import express, { Request, Response, NextFunction } from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import cors from "cors";

import indexRouter from "../src/routes/index";

const app = express();

// Enable CORS
app.use(cors());

// Built-in middleware
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "../src/public")));

// Your routes
app.use("/", indexRouter);

// Catch 404 and forward to error handler
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(createError(404));
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  // Set locals, providing error only in development
  res.locals.message = err.message;
  res.locals.error = app.get("env") === "development" ? err : {};

  // Render the error page
  res.status(err.status || 500);
  res.render("error");
});

export default app;
