
import express from "express";
import bodyParser from "body-parser";
import router from "./routes.ts";

const app = express();
app.use(bodyParser.json());
app.use(router);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
