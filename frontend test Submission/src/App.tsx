import { useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import {
  AppBar, Toolbar, Typography, Container, Box, Paper, TextField, Button,
  IconButton, Grid, Divider, Chip, List, ListItem, ListItemText, Tooltip, Tabs, Tab,
  Snackbar, Alert, InputAdornment
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import LinkIcon from "@mui/icons-material/Link";
import { createShortUrl, getStats, CreateShortUrlReq, CreateShortUrlRes, ShortUrlStats } from "./api.ts";
import { isValidShortcode, isValidUrl } from "./validation.ts";
import { Log } from "./logger.ts";

type Row = { url: string; validity?: string; shortcode?: string; error?: string; result?: CreateShortUrlRes };

function Shell({ children }: { children: React.ReactNode }) {
  const [tab, setTab] = useState(0);
  const navigate = useNavigate();

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>URL Shortener</Typography>
          <Button color="inherit" component={Link} to="/">Shorten</Button>
          <Button color="inherit" component={Link} to="/stats">Statistics</Button>
        </Toolbar>
      </AppBar>
      <Container sx={{ py: 3 }}>
        {children}
      </Container>
    </>
  );
}

function ShortenerPage() {
  const [rows, setRows] = useState<Row[]>([{ url: "" }]);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; type: "success" | "error" }>({ open: false, msg: "", type: "success" });

  const canAdd = rows.length < 5;
  const canRemove = rows.length > 1;

  const setRow = (i: number, patch: Partial<Row>) => {
    setRows(prev => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };

  const validateRow = (r: Row): string | undefined => {
    if (!r.url || !isValidUrl(r.url)) return "Enter a valid URL";
    if (r.validity && !/^\d+$/.test(r.validity)) return "Validity must be an integer (minutes)";
    if (r.shortcode && !isValidShortcode(r.shortcode)) return "Shortcode must be 3–20 alphanumerics/_-";
    return;
  };

  const onSubmit = async () => {
    const errors = rows.map(validateRow);
    if (errors.some(Boolean)) {
      setRows(rows.map((r, i) => ({ ...r, error: errors[i] })));
      setSnack({ open: true, msg: "Please fix validation errors", type: "error" });
      return;
    }
    try {
      await Log("frontend", "info", "shortener", "Submitting batch shorten request");
      const reqs: CreateShortUrlReq[] = rows.map(r => ({
        url: r.url,
        validity: r.validity ? parseInt(r.validity) : undefined,
        shortcode: r.shortcode || undefined,
      }));

      const results = await Promise.all(reqs.map(createShortUrl));
      const updated = rows.map((r, i) => ({ ...r, result: results[i], error: undefined }));
      setRows(updated);

      // Save to session for Stats page
      const existing = JSON.parse(sessionStorage.getItem("shorts") || "[]");
      sessionStorage.setItem("shorts", JSON.stringify([...results, ...existing]));
      setSnack({ open: true, msg: "Short links created", type: "success" });
    } catch (e: any) {
      setSnack({ open: true, msg: e?.message || "Failed to create", type: "error" });
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSnack({ open: true, msg: "Copied!", type: "success" });
    } catch {
      setSnack({ open: true, msg: "Copy failed", type: "error" });
    }
  };

  return (
    <Shell>
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>Shorten up to 5 URLs</Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          {rows.map((r, i) => (
            <Grid item xs={12} key={i}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Original URL"
                      value={r.url}
                      onChange={(e) => setRow(i, { url: e.target.value })}
                      error={!!r.error && r.error.includes("URL")}
                      helperText={r.error && r.error.includes("URL") ? r.error : " "}
                      InputProps={{ startAdornment: <InputAdornment position="start"><LinkIcon /></InputAdornment> }}
                    />
                  </Grid>
                  <Grid item xs={6} md={2}>
                    <TextField
                      fullWidth
                      label="Validity (min) — optional"
                      value={r.validity || ""}
                      onChange={(e) => setRow(i, { validity: e.target.value })}
                      error={!!r.error && r.error.includes("Validity")}
                      helperText={r.error && r.error.includes("Validity") ? r.error : " "}
                    />
                  </Grid>
                  <Grid item xs={6} md={2}>
                    <TextField
                      fullWidth
                      label="Shortcode — optional"
                      value={r.shortcode || ""}
                      onChange={(e) => setRow(i, { shortcode: e.target.value })}
                      error={!!r.error && r.error.includes("Shortcode")}
                      helperText={r.error && r.error.includes("Shortcode") ? r.error : " "}
                    />
                  </Grid>
                  <Grid item xs={12} md={2} sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                    <Tooltip title="Add row"><span>
                      <IconButton disabled={!canAdd} onClick={() => setRows(prev => [...prev, { url: "" }])}><AddIcon /></IconButton>
                    </span></Tooltip>
                    <Tooltip title="Remove row"><span>
                      <IconButton disabled={!canRemove} onClick={() => setRows(prev => prev.slice(0, -1))}><RemoveIcon /></IconButton>
                    </span></Tooltip>
                  </Grid>

                  {r.result && (
                    <Grid item xs={12}>
                      <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                        <Chip label={`Short: ${r.result.shortUrl}`} />
                        <Chip label={`Expires: ${new Date(r.result.expiresAt).toLocaleString()}`} />
                        <Button variant="outlined" size="small" startIcon={<ContentCopyIcon />} onClick={() => copy(r.result.shortUrl)}>
                          Copy
                        </Button>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Box mt={2} display="flex" gap={2}>
          <Button variant="contained" onClick={onSubmit}>Create Short Links</Button>
          <Button variant="outlined" color="secondary" onClick={() => setRows([{ url: "" }])}>Reset</Button>
        </Box>
      </Paper>

      <Snackbar open={snack.open} autoHideDuration={2500} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.type}>{snack.msg}</Alert>
      </Snackbar>
    </Shell>
  );
}

function StatsPage() {
  const [codes, setCodes] = useState<CreateShortUrlRes[]>(
    () => JSON.parse(sessionStorage.getItem("shorts") || "[]")
  );
  const [selected, setSelected] = useState<ShortUrlStats | null>(null);
  const [error, setError] = useState<string>("");

  const load = async (code: string) => {
    setError("");
    try {
      const s = await getStats(code);
      setSelected(s);
    } catch (e: any) {
      setSelected(null);
      setError(e?.message || "Failed to load stats");
    }
  };

  return (
    <Shell>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <QueryStatsIcon />
              <Typography variant="h6">Your Short Links (this session)</Typography>
            </Box>
            <Divider sx={{ mb: 1 }} />
            <List dense>
              {codes.length === 0 && <Typography variant="body2">No links yet. Create one on the Shorten page.</Typography>}
              {codes.map((c) => (
                <ListItem key={c.shortcode} button onClick={() => load(c.shortcode)}>
                  <ListItemText
                    primary={`${location.origin.replace(":3000", ":5000")}/${c.shortcode}`}
                    secondary={new Date(c.expiresAt).toLocaleString()}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom>Details</Typography>
            <Divider sx={{ mb: 2 }} />
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {!selected && !error && <Typography variant="body2">Select a short link to view statistics.</Typography>}
            {selected && (
              <Box display="grid" gap={1}>
                <Chip label={`Shortcode: ${selected.shortcode}`} />
                <Chip label={`Original: ${selected.originalUrl}`} />
                <Chip label={`Created: ${new Date(selected.createdAt).toLocaleString()}`} />
                <Chip label={`Expires: ${new Date(selected.expiresAt).toLocaleString()}`} />
                <Chip label={`Total Clicks: ${selected.totalClicks}`} />
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1">Click Events</Typography>
                <List dense sx={{ maxHeight: 300, overflowY: "auto" }}>
                  {selected.clicks.length === 0 && <Typography variant="body2">No clicks yet.</Typography>}
                  {selected.clicks.map((c, i) => (
                    <ListItem key={i}>
                      <ListItemText
                        primary={new Date(c.timestamp).toLocaleString()}
                        secondary={`Source: ${c.source || "unknown"} | Location: ${c.location || "unknown"}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Shell>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ShortenerPage />} />
        <Route path="/stats" element={<StatsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
