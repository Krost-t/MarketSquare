import express from "express";
import type { Express, Request, Response } from "express";

const app: Express = express();

const PORT = process.env.PORT || 3000;

// Middleware 
// Parse JSON bodies
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.json({message: "Hello, World!"});
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});