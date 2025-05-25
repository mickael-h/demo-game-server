import createError from "http-errors";
import express, { Request, Response, NextFunction } from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import cors from "cors";

import indexRouter from "../src/routes/index"; // adjust path

const app = express();

// Enable CORS
app.use(cors());

// built-in middleware
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "../src/public")));

// your routes
app.use("/", indexRouter);

// error handlers, etc...
app.use((req: Request, res: Response, next: NextFunction) => {
  next(createError(404));
});
app.use((err: any, req: Request, res: Response) => {
  // render the error page...
  res.status(err.status || 500);
  res.render("error");
});

// **THIS** is the key—export the Express app, don’t call listen():
export default app;
