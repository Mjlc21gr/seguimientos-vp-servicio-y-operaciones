import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { google } from "googleapis";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import cron from "node-cron";
import { format, addDays, isSameDay, parseISO } from "date-fns";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "8080", 10);

app.use(express.json());

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const RANGE = `${process.env.GOOGLE_SHEET_NAME || 'tareas'}!A2:H`;

// Email Transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", // Defaulting to Gmail, user can change
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmail(to: string, subject: string, text: string, html?: string) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("SMTP credentials missing. Email not sent:", subject);
    return;
  }
  try {
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Admin Seguimientos'}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html
    });
  } catch (err) {
    console.error("Error sending email:", err);
  }
}

function getSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let key = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !key) {
    console.error("Missing Google Sheets credentials in environment variables");
    return null;
  }

  // ROBUST CLEANING "DE RAIZ"
  let cleanedKey = key.trim();

  // 1. Check if the user pasted the entire JSON object
  if (cleanedKey.startsWith('{')) {
    try {
      const json = JSON.parse(cleanedKey);
      if (json.private_key) {
        cleanedKey = json.private_key;
      } else if (json.key) {
        cleanedKey = json.key;
      }
    } catch (e) {
      // Not valid JSON, continue with original string
    }
  }

  // 2. Remove accidental surrounding quotes
  cleanedKey = cleanedKey.replace(/^["']|["']$/g, '');

  // 3. Convert literal \n sequences to actual newlines
  cleanedKey = cleanedKey.replace(/\\n/g, '\n');

  // 4. Final normalization: 
  // Ensure we have the headers, and that there are no weird double-newlines or trailing spaces
  // This helps prevent 'DECODER routines::unsupported' in OpenSSL 3+
  if (!cleanedKey.includes('-----BEGIN PRIVATE KEY-----')) {
     cleanedKey = `-----BEGIN PRIVATE KEY-----\n${cleanedKey}`;
  }
  if (!cleanedKey.includes('-----END PRIVATE KEY-----')) {
     cleanedKey = `${cleanedKey}\n-----END PRIVATE KEY-----`;
  }
  
  // Ensure the headers have their own lines
  cleanedKey = cleanedKey
    .replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n')
    .replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');

  try {
    const auth = new google.auth.JWT({
      email,
      key: cleanedKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    return google.sheets({ version: 'v4', auth });
  } catch (err) {
    console.error("Auth initialization error:", err);
    return null;
  }
}

// API Routes
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const sheets = getSheetsClient();
  if (!sheets) return res.status(500).json({ error: "No credentials" });

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Usuarios!A2:D',
    });

    const rows = response.data.values || [];
    const userRow = rows.find(row => row[1] === email);

    if (userRow) {
      const storedPassword = userRow[3];
      let isMatch = false;
      
      try {
        // Try bcrypt first, fallback to plaintext for legacy
        isMatch = await bcrypt.compare(String(password), storedPassword);
        if (!isMatch && storedPassword === String(password)) {
          isMatch = true;
        }
      } catch (e) {
        if (storedPassword === String(password)) isMatch = true;
      }

      if (isMatch) {
        return res.json({
          success: true,
          user: {
            name: userRow[0],
            email: userRow[1],
            role: userRow[2]
          }
        });
      }
    }
    
    res.status(401).json({ error: "Credenciales inválidas" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/change-password", async (req, res) => {
  const { email, newPassword } = req.body;
  const sheets = getSheetsClient();
  if (!sheets) return res.status(500).json({ error: "No credentials" });

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Usuarios!A2:D',
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[1] === email);

    if (rowIndex === -1) return res.status(404).json({ error: "Usuario no encontrado" });

    // Encrypt password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(String(newPassword), salt);

    const actualRow = rowIndex + 2; // +1 for 0-index, +1 for header
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Usuarios!D${actualRow}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[hashedPassword]]
      }
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/managers", async (req, res) => {
  const sheets = getSheetsClient();
  if (!sheets) return res.status(500).json({ error: "No credentials" });

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Usuarios!A2:D', // Fetch up to D (Password)
    });

    const rows = response.data.values || [];
    const managers = rows.map((row, index) => ({
      id: index.toString(),
      name: row[0] || "",
      email: row[1] || "", // Email is now in Col B
      role: row[2] || "",  // Role is now in Col C
    }));

    res.json(managers);
  } catch (error: any) {
    console.error("Error fetching managers:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/tasks", async (req, res) => {
  const { email, role } = req.query;
  const sheets = getSheetsClient();
  if (!sheets) return res.status(500).json({ error: "No credentials" });

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
    });

    const rows = response.data.values || [];
    let tasks = rows.map((row, index) => ({
      id: index + 2, // Row number as temporary ID
      assignmentDate: row[0] || "",
      dueDate: row[1] || "",
      commitmentDate: row[2] || "",
      title: row[3] || "",
      assignedTo: row[4] || "",
      observations: row[5] || "",
      managerComments: row[6] || "",
      status: row[7] || "pendiente asignación",
      taskType: row[8] || "",
    }));

    // Role-based filtering
    if (role !== 'admin' && email) {
      tasks = tasks.filter(t => t.assignedTo === email);
    }

    res.json(tasks);
  } catch (error: any) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/tasks", async (req, res) => {
  const sheets = getSheetsClient();
  if (!sheets) return res.status(500).json({ error: "No credentials" });

  const { assignmentDate, dueDate, commitmentDate, title, assignedTo, observations, managerComments, status, taskType } = req.body;

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          assignmentDate,
          dueDate,
          commitmentDate,
          title,
          assignedTo,
          observations,
          managerComments,
          status,
          taskType
        ]],
      },
    });

    // Send email notification on creation
    await sendEmail(
      assignedTo,
      "Nueva Tarea Asignada",
      `Se te ha asignado una nueva tarea: ${title}\nFecha de compromiso: ${commitmentDate}\nObservaciones: ${observations}`,
      `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
        <h2 style="color: #0a6c45;">Nueva Tarea Asignada</h2>
        <p><strong>Tarea:</strong> ${title}</p>
        <p><strong>Fecha de compromiso:</strong> ${commitmentDate}</p>
        <p><strong>Observaciones:</strong> ${observations}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">Este es un mensaje automático de Seguimientos VP Servicio y Operaciones.</p>
      </div>`
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/tasks/:id", async (req, res) => {
  const { id } = req.params;
  const sheets = getSheetsClient();
  if (!sheets) return res.status(500).json({ error: "No credentials" });

  const { dueDate, commitmentDate, title, assignedTo, observations, managerComments, status, taskType, previousStatus } = req.body;

  try {
    // If re-opening (previous was 'terminado' and now is something else)
    if (previousStatus === 'terminado' && status !== 'terminado') {
      await sendEmail(
        assignedTo,
        "Tarea Reabierta - Seguimiento",
        `La tarea "${title}" ha sido reabierta por un administrador.`,
        `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: #ef4444;">Tarea Reabierta</h2>
          <p>La tarea <strong>"${title}"</strong> que figuraba como terminada ha sido <strong>reabierta</strong> por el administrador.</p>
          <p>Por favor revisa los comentarios y actualiza el progreso según corresponda.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">Seguimientos VP Servicio y Operaciones.</p>
        </div>`
      );
    }

    // We update the whole row range A:I for that specific ID (row number)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${process.env.GOOGLE_SHEET_NAME || 'tareas'}!A${id}:I${id}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          req.body.assignmentDate, // Keep original if provided
          dueDate,
          commitmentDate,
          title,
          assignedTo,
          observations,
          managerComments,
          status,
          taskType
        ]]
      }
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Reminders Cron Job - Every day at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log("Running reminders cron job...");
    const sheets = getSheetsClient();
    if (!sheets) return;

    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: RANGE,
      });

      const rows = response.data.values || [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const row of rows) {
        const commitmentDateStr = row[2]; // Col C
        const title = row[3];
        const assignedTo = row[4];
        const status = row[7];

        if (status === "terminado" || !assignedTo || !commitmentDateStr) continue;

        const commitmentDate = parseISO(commitmentDateStr);
        if (isNaN(commitmentDate.getTime())) continue;

        const diffDays = Math.ceil((commitmentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 2) {
          // 2 days reminder
          await sendEmail(
            assignedTo,
            "Recordatorio de Vencimiento: 2 días",
            `Recordatorio: La tarea "${title}" vence en 2 días (${commitmentDateStr}).`,
            `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
              <h2 style="color: #0fb67a;">Recordatorio de Vencimiento</h2>
              <p>Hola, este es un recordatorio de que la tarea <strong>${title}</strong> vence en <strong>2 días</strong>.</p>
              <p>Fecha de compromiso: ${commitmentDateStr}</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="font-size: 12px; color: #666;">Por favor gestiona esta tarea a tiempo.</p>
            </div>`
          );
        } else if (diffDays === 0) {
          // Today's urgent alert
          await sendEmail(
            assignedTo,
            "ALERTA: Tarea Vence HOY - Urgente",
            `ALERTA: La tarea "${title}" vence hoy (${commitmentDateStr}). Por favor gestiónala con urgencia.`,
            `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #d91c1c; border-radius: 12px; background-color: #fff5f5;">
              <h2 style="color: #d91c1c;">🚨 ALERTA DE URGENCIA</h2>
              <p>La tarea <strong>${title}</strong> vence <strong>HOY</strong>.</p>
              <p>Fecha de compromiso: ${commitmentDateStr}</p>
              <p style="font-weight: bold; color: #d91c1c;">Por favor, gestiónala inmediatamente.</p>
              <hr style="border: 0; border-top: 1px solid #fbdede; margin: 20px 0;">
              <p style="font-size: 11px; color: #999;">Notificación de sistema de alta prioridad.</p>
            </div>`
          );
        }
      }
    } catch (err) {
      console.error("Error in reminders cron job:", err);
    }
  });
}

startServer();
