import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Chart from "chart.js/auto";
import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

export default function App() {
  const [user, setUser] = useState(null);
  const [input, setInput] = useState({ email: "", password: "" });
  const [isSignup, setIsSignup] = useState(false);
  const [filter, setFilter] = useState("Monthly");
  const [theme, setTheme] = useState("light");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(generateData());
  const [stats, setStats] = useState({
    revenue: 0,
    users: 0,
    growth: 0,
    performance: 0,
  });

  const barRef = useRef();
  const lineRef = useRef();
  const doughnutRef = useRef();

  // === Firebase Auth Listener ===
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      setInput({ email: "", password: "" }); // reset form when user state changes
    });
    return unsubscribe;
  }, []);

  // === Auth Actions ===
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isSignup) {
        await createUserWithEmailAndPassword(auth, input.email, input.password);
        alert("🎉 Signup successful!");
      } else {
        await signInWithEmailAndPassword(auth, input.email, input.password);
        alert("✅ Login successful!");
      }
      setInput({ email: "", password: "" });
    } catch (err) {
      alert(err.message);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setInput({ email: "", password: "" });
  };

  // === Firestore Functions ===
  const dataCollection = collection(db, "dashboardStats");

  const saveDataToFirestore = async () => {
    try {
      await addDoc(dataCollection, {
        timestamp: serverTimestamp(),
        sales: data.sales,
        users: data.users,
        performance: data.performance,
        totalRevenue: data.sales.reduce((a, b) => a + b, 0),
      });
      console.log("📤 Data saved to Firestore");
    } catch (err) {
      console.error("❌ Firestore save error:", err);
    }
  };

  const fetchDataFromFirestore = async () => {
    try {
      const q = query(dataCollection, orderBy("timestamp", "desc"));
      const snapshot = await getDocs(q);
      const latest = snapshot.docs[0]?.data();
      if (latest) {
        setData({
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
          sales: latest.sales,
          users: latest.users,
          performance: latest.performance,
        });
        console.log("📥 Data fetched from Firestore");
      }
    } catch (err) {
      console.error("❌ Firestore fetch error:", err);
    }
  };

  // === AddUser Function ===
  const addUser = async () => {
    try {
      await addDoc(collection(db, "users"), {
        name: "Jana",
        email: "jana@example.com",
        role: "Admin",
        createdAt: serverTimestamp(),
      });
      alert("🎉 User 'Jana' added successfully!");
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("❌ Failed to add user");
    }
  };

  // === CHART SETUP ===
  useEffect(() => {
    if (!user || !barRef.current || !lineRef.current || !doughnutRef.current)
      return;

    setStats({
      revenue: data.sales.reduce((a, b) => a + b, 0),
      users: data.users.reduce((a, b) => a + b, 0),
      growth: Math.floor(Math.random() * 40 + 10),
      performance: Math.floor(Math.random() * 100),
    });

    if (barRef.current.chart) barRef.current.chart.destroy();
    if (lineRef.current.chart) lineRef.current.chart.destroy();
    if (doughnutRef.current.chart) doughnutRef.current.chart.destroy();

    barRef.current.chart = new Chart(barRef.current, {
      type: "bar",
      data: {
        labels: data.labels,
        datasets: [
          {
            label: "Revenue (₹K)",
            data: data.sales,
            backgroundColor: ["#3b82f6", "#06b6d4", "#10b981", "#f59e0b"],
            borderRadius: 6,
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    });

    lineRef.current.chart = new Chart(lineRef.current, {
      type: "line",
      data: {
        labels: data.labels,
        datasets: [
          {
            label: "User Growth",
            data: data.users,
            borderColor: "#8b5cf6",
            backgroundColor: "rgba(139,92,246,0.2)",
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    });

    doughnutRef.current.chart = new Chart(doughnutRef.current, {
      type: "doughnut",
      data: {
        labels: ["Marketing", "Tech", "Sales", "Ops"],
        datasets: [
          {
            data: data.performance,
            backgroundColor: ["#3b82f6", "#f97316", "#10b981", "#ef4444"],
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    });
  }, [user, data]);

  // === Auto Update Firestore ===
  useEffect(() => {
    const interval = setInterval(async () => {
      const newData = generateData();
      setData(newData);
      await saveDataToFirestore();
    }, 7000);

    fetchDataFromFirestore();
    return () => clearInterval(interval);
  }, []);

  // === Loading Screen ===
  if (loading)
    return (
      <div style={styles.centerPage}>
        <h2>Loading...</h2>
      </div>
    );

  // === Login / Signup ===
  if (!user)
    return (
      <div style={styles.loginBg}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          style={styles.loginBox}
        >
          <h1>📊 Pro Business Dashboard</h1>
          <p style={{ color: "#94a3b8" }}>
            {isSignup ? "Create an account" : "Login to continue"}
          </p>
          <form onSubmit={handleSubmit}>
            <input
              placeholder="Email"
              type="email"
              value={input.email}
              style={styles.input}
              onChange={(e) => setInput({ ...input, email: e.target.value })}
            />
            <input
              placeholder="Password"
              type="password"
              value={input.password}
              style={styles.input}
              onChange={(e) => setInput({ ...input, password: e.target.value })}
            />
            <button style={styles.btn}>
              {isSignup ? "Sign Up" : "Login"}
            </button>
          </form>

          {/* toggle link */}
          <p
            onClick={() => setIsSignup(!isSignup)}
            style={{
              marginTop: 15,
              fontSize: 14,
              cursor: "pointer",
              color: "#3b82f6",
              textDecoration: "underline",
            }}
          >
            {isSignup
              ? "Already have an account? Login"
              : "Don’t have an account? Sign up"}
          </p>
        </motion.div>
      </div>
    );

  // === Dashboard ===
  return (
    <div
      style={{
        ...styles.container,
        background:
          theme === "light"
            ? "linear-gradient(135deg,#e0f2fe,#fef3c7)"
            : "radial-gradient(circle at top left,#0f172a,#1e293b,#0f172a)",
        color: theme === "light" ? "#111" : "#f1f5f9",
      }}
    >
      <header style={styles.header}>
        <h2>Welcome, {user.email}</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <select
            style={styles.select}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option>Daily</option>
            <option>Weekly</option>
            <option>Monthly</option>
          </select>
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            style={{
              ...styles.btnSmall,
              backgroundColor: theme === "light" ? "#334155" : "#f8fafc",
              color: theme === "light" ? "white" : "#334155",
            }}
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
          <button onClick={addUser} style={styles.btnAdd}>
            ➕ Add Jana
          </button>
          <button onClick={logout} style={styles.logout}>
            Logout
          </button>
        </div>
      </header>

      <div style={styles.cards}>
        <Card title="Revenue" value={`₹${stats.revenue}K`} color="#3b82f6" />
        <Card title="Active Users" value={stats.users} color="#10b981" />
        <Card title="Growth" value={`${stats.growth}%`} color="#f59e0b" />
        <Card title="Performance" value={`${stats.performance}%`} color="#8b5cf6" />
      </div>

      <div style={styles.charts}>
        <ChartBox title="Revenue Overview" refEl={barRef} />
        <ChartBox title="User Growth" refEl={lineRef} />
        <ChartBox title="Department Performance" refEl={doughnutRef} />
      </div>

      <footer style={styles.footer}>
        <p>⚙️ Real-time Business Intelligence Dashboard © 2025 — Updated Every 7s</p>
      </footer>
    </div>
  );
}

// === Helper + Components ===
function generateData() {
  return {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    sales: Array(6).fill().map(() => Math.floor(Math.random() * 1200 + 300)),
    users: Array(6).fill().map(() => Math.floor(Math.random() * 500 + 100)),
    performance: [70, 85, 60, 95],
  };
}

const Card = ({ title, value, color }) => (
  <motion.div whileHover={{ scale: 1.03 }} style={{ ...styles.card, borderTop: `5px solid ${color}` }}>
    <h4>{title}</h4>
    <p style={{ fontSize: 24, fontWeight: "bold", color }}>{value}</p>
  </motion.div>
);

const ChartBox = ({ title, refEl }) => (
  <div style={styles.chartBox}>
    <h3 style={{ marginBottom: 10 }}>{title}</h3>
    <div style={{ height: "250px" }}>
      <canvas ref={refEl}></canvas>
    </div>
  </div>
);

// === Styles ===
const styles = {
  container: { width: "100vw", minHeight: "100vh", overflowY: "auto", padding: "20px 40px" },
  loginBg: {
    width: "100vw",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg,#6366f1,#3b82f6,#06b6d4)",
    color: "white",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  logout: {
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: 8,
    padding: "8px 14px",
    cursor: "pointer",
  },
  btnAdd: {
    backgroundColor: "#10b981",
    color: "white",
    border: "none",
    borderRadius: 8,
    padding: "8px 14px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  select: { padding: 8, borderRadius: 8, border: "1px solid #ccc" },
  btnSmall: { border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontWeight: "bold" },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 20,
    marginTop: 30,
  },
  card: { background: "white", padding: 20, borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", textAlign: "center" },
  charts: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 25, marginTop: 40 },
  chartBox: { background: "white", padding: 20, borderRadius: 10, boxShadow: "0 3px 10px rgba(0,0,0,0.1)" },
  footer: { marginTop: 50, textAlign: "center", fontSize: 13, opacity: 0.7 },
  centerPage: { width: "100vw", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" },
  loginBox: {
    background: "white",
    padding: 40,
    borderRadius: 12,
    width: 320,
    textAlign: "center",
    boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
  },
  input: { width: "90%", margin: 8, padding: 10, borderRadius: 6, border: "1px solid #ccc" },
  btn: {
    width: "95%",
    padding: 10,
    marginTop: 10,
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
};
