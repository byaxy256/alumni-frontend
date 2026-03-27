import { useState } from "react";

const sidebarLinks = [
  { label: "Dashboard", icon: "⊞", sub: "Bacinbard", active: true },
  { label: "All Projects", icon: "☰" },
  { label: "Tasks", icon: "☰" },
  { label: "Budgets", icon: "☰" },
  { label: "Reports", icon: "☰" },
];

const statCards = [
  { label: "Ongoing Projects", value: "2", action: "View All", color: "#3B6CB7", icon: "🖼" },
  { label: "Upcoming Tasks", value: "4", action: "Manage", color: "#E8A838", icon: "📋" },
  { label: "Total Project", value: "UGX 870,000", color: "#2E7D5E", icon: "⊕" },
  { label: "Budget Utilized", value: "UGX 320,000", color: "#E8A838", icon: "💰" },
];

const ongoingProjects = [
  { name: "Career Workshop", status: "Ongoing", statusColor: "#E8A838", budget: "UGX 250,000", progress: 65 },
  { name: "Scholarship Initiative", status: "Progressing", statusColor: "#2E7D5E", budget: "UGX 320,000", progress: 45 },
  { name: "Career Workshop", status: "Popjedup", statusColor: "#E8A838", budget: "UGX 300,000", progress: 30 },
];

const upcomingTasks = [
  { project: "Career Workshop", desc: "Coordinate speaker arrangements", date: "8 May 2024", overdue: false },
  { project: "Alumni Meet & Greet", desc: "Preview feedback forms and materials", date: "15 May 2024", overdue: true },
  { project: "Scholarship Initiative", desc: "Review new scholarship applications", date: "3 May 2024", overdue: true },
  { project: "Career Workshop", date: "2 May 2024", overdue: false },
];

const recentActivity = [
  { project: "Career Workshop", totalBudget: "UGX 250,000", resourcing: "UGX 100" },
  { project: "Alumni Meet & Greet", totalBudget: "UGX 250,000", resourcing: "UGX 220" },
  { project: "Scholarship Initiative", totalBudget: "UGX 320,000", resourcing: "UGX 140" },
];

const assignedTasks1 = [
  { project: "Prepare Alumni Meet.", due: "15 May 2024", state: "Pending", stateColor: "#3B6CB7" },
  { project: "Contact printing, serrates", due: "10 May 2024", state: "In Projects", stateColor: "#5B8DDE" },
  { project: "Follow up with venue. sompletator.", due: "8 May 2024", state: "Completed", stateColor: "#2E7D5E" },
];

const assignedTasks2 = [
  { project: "Prepare Alumni Meet. nette Imortasik.", due: "13 May 2024", state: "Reading", stateColor: "#E85454" },
  { project: "Contact printing, oerstes", due: "10 May 2024", state: "All Projects", stateColor: "#5B8DDE" },
  { project: "Follow up with venue. secrdictator.", due: "8 May 2024", state: "Completed", stateColor: "#2E7D5E" },
];

const notifications1 = [
  { name: "Mustafa", text: "reassigned scholarship review task to lydia.", time: "0 hours ago" },
  { name: "Lydia", text: "marked venue follow-up task completed. meet help herit ago" },
  { name: "Mustafa", text: "updated Scholarship Initiative Bus-, tabid, rave 1 hours ago" },
];

const notifications2 = [
  { name: "Mustafa", time: "9 hours ago", text: "Draplabi y nete nfe aluarship review task to Lyc." },
  { name: "Lydia", time: "1 day ago", text: "uopa mantve monce inotoras one task compiered." },
  { name: "Lydia", time: "1 day ago", text: "upolated properrint expressive loasions. Furtnatue 1 day ago" },
];

function Avatar({ initials, size = 32 }: { initials: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg, #5B8DDE, #2E7D5E)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontWeight: 700, fontSize: size * 0.35, flexShrink: 0
    }}>{initials}</div>
  );
}

function DonutChart() {
  const cx = 70, cy = 70, r = 50;
  const segments = [
    { value: 245, color: "#3B6CB7" },
    { value: 175, color: "#2E7D5E" },
    { value: 100, color: "#E8A838" },
  ];
  const total = segments.reduce((s, x) => s + x.value, 0);
  let angle = -90;
  const paths = segments.map((seg) => {
    const sweep = (seg.value / total) * 360;
    const start = angle;
    angle += sweep;
    const end = angle;
    const s = toXY(cx, cy, r, start);
    const e = toXY(cx, cy, r, end);
    const large = sweep > 180 ? 1 : 0;
    return { d: `M${cx},${cy} L${s.x},${s.y} A${r},${r} 0 ${large},1 ${e.x},${e.y} Z`, color: seg.color };
  });

  function toXY(cx: number, cy: number, r: number, deg: number): { x: number; y: number } {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      {paths.map((p, i) => <path key={i} d={p.d} fill={p.color} />)}
      <circle cx={cx} cy={cy} r={30} fill="#fff" />
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="9" fill="#333" fontWeight="600">UGX</text>
      <text x={cx} y={cy + 6} textAnchor="middle" fontSize="9" fill="#333" fontWeight="700">135,000</text>
    </svg>
  );
}

export default function Dashboard() {
  const [active, setActive] = useState("Dashboard");

  return (
    <div style={{
      minHeight: "100vh", background: "#EAECF2",
      fontFamily: "'Segoe UI', sans-serif", padding: "24px 16px"
    }}>
      <div style={{
        maxWidth: 900, margin: "0 auto", borderRadius: 16, overflow: "hidden",
        boxShadow: "0 8px 40px rgba(0,0,0,0.18)"
      }}>

        {/* Top Nav */}
        <div style={{
          background: "linear-gradient(90deg, #2B4A8C 0%, #3B6CB7 100%)",
          padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar initials="PM" size={36} />
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>Projects Manager Dashboard</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#fff", cursor: "pointer" }}>
            <Avatar initials="M" size={32} />
            <span style={{ fontWeight: 600 }}>Mustafa</span>
            <span style={{ fontSize: 12 }}>▾</span>
          </div>
        </div>

        <div style={{ display: "flex", minHeight: 600 }}>

          {/* Sidebar */}
          <div style={{
            width: 200, background: "linear-gradient(180deg, #2B4A8C 0%, #1E3670 100%)",
            padding: "24px 0", display: "flex", flexDirection: "column", justifyContent: "space-between"
          }}>
            <div>
              <div style={{ padding: "0 20px 20px" }}>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>Welcome back, Mustafa!</div>
                <div style={{ color: "#A8C0E8", fontSize: 11, marginTop: 2 }}>Role: Projects Manager</div>
              </div>
              <nav>
                {sidebarLinks.map(link => (
                  <div key={link.label}
                    onClick={() => setActive(link.label)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "11px 20px", cursor: "pointer",
                      background: active === link.label ? "rgba(255,255,255,0.15)" : "transparent",
                      borderRadius: active === link.label ? "0 20px 20px 0" : 0,
                      marginRight: 12,
                      color: active === link.label ? "#fff" : "#A8C0E8",
                      fontWeight: active === link.label ? 700 : 400,
                      fontSize: 13, transition: "all 0.15s"
                    }}>
                    <span style={{ fontSize: 14 }}>{link.icon}</span>
                    <div>
                      <div>{link.label}</div>
                      {link.sub && <div style={{ fontSize: 10, color: "#A8C0E8" }}>{link.sub}</div>}
                    </div>
                  </div>
                ))}
              </nav>
            </div>
            <div style={{ padding: "0 20px 20px" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                color: "#A8C0E8", fontSize: 13, cursor: "pointer", padding: "10px 0"
              }}>
                <span>⊟</span> Logout
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div style={{ flex: 1, background: "#F4F6FB", overflowY: "auto" }}>

            {/* Welcome Banner */}
            <div style={{ background: "#fff", padding: "20px 24px 0", borderBottom: "1px solid #E8ECF4" }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 10 }}>Internal Office</div>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 8,
                  background: "#EEF2FF", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 20, flexShrink: 0
                }}>☰</div>
                <div style={{ paddingBottom: 16 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#1E2D4E" }}>Welcome back, Mustafa!</div>
                  <div style={{ fontSize: 12, color: "#666", marginTop: 4, maxWidth: 400 }}>
                    Here are the current projects, upcoming tasks, and budget updates for the Alumni Fund.
                  </div>
                </div>
              </div>

              {/* Stat Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, paddingBottom: 20 }}>
                {statCards.map((card, i) => (
                  <div key={i} style={{
                    background: card.color, borderRadius: 10, padding: "14px 16px",
                    color: "#fff", position: "relative", overflow: "hidden"
                  }}>
                    <div style={{ fontSize: 10, opacity: 0.9, marginBottom: 4 }}>{card.label}</div>
                    <div style={{ fontSize: i < 2 ? 28 : 16, fontWeight: 800, lineHeight: 1.1 }}>{card.value}</div>
                    {card.action && (
                      <div style={{
                        marginTop: 8, fontSize: 10, background: "rgba(255,255,255,0.2)",
                        display: "inline-block", padding: "2px 10px", borderRadius: 10
                      }}>{card.action}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

              {/* Ongoing Projects */}
              <div style={{ background: "#fff", borderRadius: 10, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "#1E2D4E" }}>Ongoing Projects</span>
                  <span style={{ fontSize: 11, color: "#3B6CB7", cursor: "pointer" }}>View All &gt;</span>
                </div>
                <div style={{
                  background: "#EEF4FF", borderRadius: 6, padding: "5px 10px",
                  fontSize: 11, color: "#3B6CB7", marginBottom: 12
                }}>· Ongoing Projects</div>
                {ongoingProjects.map((p, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#1E2D4E" }}>{p.name}</span>
                      <span style={{
                        fontSize: 10, background: p.statusColor, color: "#fff",
                        padding: "2px 8px", borderRadius: 10
                      }}>{p.status}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 5, background: "#E8ECF4", borderRadius: 3 }}>
                        <div style={{ width: `${p.progress}%`, height: "100%", background: "#3B6CB7", borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 10, color: "#888" }}>{p.budget}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Upcoming Tasks */}
              <div style={{ background: "#fff", borderRadius: 10, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "#1E2D4E" }}>Upcoming Tasks</span>
                  <span style={{ fontSize: 11, color: "#3B6CB7", cursor: "pointer" }}>View All &gt;</span>
                </div>
                {upcomingTasks.map((t, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#1E2D4E" }}>{t.project}</div>
                        {t.desc && <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{t.desc}</div>}
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 8 }}>
                        <div style={{ fontSize: 10, color: "#888" }}>{t.date}</div>
                        {t.overdue && (
                          <div style={{
                            fontSize: 9, background: "#FFE8E8", color: "#E85454",
                            padding: "1px 6px", borderRadius: 8, marginTop: 2
                          }}>Overdue</div>
                        )}
                      </div>
                    </div>
                    {i < upcomingTasks.length - 1 && <div style={{ borderBottom: "1px solid #F0F2F8", marginTop: 8 }} />}
                  </div>
                ))}
              </div>

              {/* Recent Activity */}
              <div style={{ background: "#fff", borderRadius: 10, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "#1E2D4E" }}>Recent Activity</span>
                  <span style={{ fontSize: 11, color: "#3B6CB7", cursor: "pointer" }}>View All &gt;</span>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ color: "#888" }}>
                      <th style={{ textAlign: "left", paddingBottom: 6, fontWeight: 600 }}>Projects</th>
                      <th style={{ textAlign: "left", paddingBottom: 6, fontWeight: 600 }}>Total Budget</th>
                      <th style={{ textAlign: "left", paddingBottom: 6, fontWeight: 600 }}>Resourcing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivity.map((r, i) => (
                      <tr key={i} style={{ borderTop: "1px solid #F0F2F8" }}>
                        <td style={{ padding: "7px 0", color: "#1E2D4E" }}>{r.project}</td>
                        <td style={{ color: "#444" }}>{r.totalBudget}</td>
                        <td style={{ color: "#444" }}>{r.resourcing}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Budget Utilization */}
              <div style={{ background: "#fff", borderRadius: 10, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "#1E2D4E" }}>Budget Utilization Breakdown</span>
                  <span style={{ fontSize: 11, color: "#3B6CB7", cursor: "pointer" }}>View All &gt;</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <DonutChart />
                  <div style={{ fontSize: 11 }}>
                    {[
                      { label: "Projects:", value: "245", color: "#3B6CB7" },
                      { label: "Events:", value: "175K", color: "#2E7D5E" },
                      { label: "Sutotiss:", value: "100K", color: "#E8A838" },
                    ].map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: item.color }} />
                        <span style={{ color: "#666" }}>{item.label}</span>
                        <span style={{ fontWeight: 700, color: "#1E2D4E" }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Assigned Tasks 1 */}
              <div style={{ background: "#fff", borderRadius: 10, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "#1E2D4E" }}>Assigned Tasks</span>
                  <span style={{ fontSize: 11, color: "#3B6CB7", cursor: "pointer" }}>View All &gt;</span>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ color: "#888" }}>
                      <th style={{ textAlign: "left", paddingBottom: 6, fontWeight: 600 }}>Projects</th>
                      <th style={{ textAlign: "left", paddingBottom: 6, fontWeight: 600 }}>Due</th>
                      <th style={{ textAlign: "left", paddingBottom: 6, fontWeight: 600 }}>States</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedTasks1.map((t, i) => (
                      <tr key={i} style={{ borderTop: "1px solid #F0F2F8" }}>
                        <td style={{ padding: "7px 0", color: "#1E2D4E" }}>{t.project}</td>
                        <td style={{ color: "#888" }}>{t.due}</td>
                        <td>
                          <span style={{
                            background: t.stateColor, color: "#fff",
                            padding: "2px 8px", borderRadius: 10, fontSize: 10
                          }}>{t.state}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Notifications 1 */}
              <div style={{ background: "#fff", borderRadius: 10, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "#1E2D4E" }}>Notifications</span>
                  <span style={{ fontSize: 11, color: "#3B6CB7", cursor: "pointer" }}>View All &gt;</span>
                </div>
                {notifications1.map((n, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                    <Avatar initials={n.name[0]} size={28} />
                    <div style={{ fontSize: 11 }}>
                      <span style={{ fontWeight: 700, color: "#1E2D4E" }}>{n.name}</span>
                      <span style={{ color: "#666" }}> {n.text}</span>
                      {n.time && <div style={{ color: "#aaa", fontSize: 10, marginTop: 2 }}>{n.time}</div>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Assigned Tasks 2 */}
              <div style={{ background: "#fff", borderRadius: 10, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "#1E2D4E" }}>Assigned Tasks</span>
                  <span style={{ fontSize: 11, color: "#3B6CB7", cursor: "pointer" }}>View All &gt;</span>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ color: "#888" }}>
                      <th style={{ textAlign: "left", paddingBottom: 6, fontWeight: 600 }}>Projects</th>
                      <th style={{ textAlign: "left", paddingBottom: 6, fontWeight: 600 }}>Due</th>
                      <th style={{ textAlign: "left", paddingBottom: 6, fontWeight: 600 }}>States</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedTasks2.map((t, i) => (
                      <tr key={i} style={{ borderTop: "1px solid #F0F2F8" }}>
                        <td style={{ padding: "7px 0", color: "#1E2D4E" }}>{t.project}</td>
                        <td style={{ color: "#888" }}>{t.due}</td>
                        <td>
                          <span style={{
                            background: t.stateColor, color: "#fff",
                            padding: "2px 8px", borderRadius: 10, fontSize: 10
                          }}>{t.state}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Notifications 2 */}
              <div style={{ background: "#fff", borderRadius: 10, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "#1E2D4E" }}>Notifications</span>
                  <span style={{ fontSize: 11, color: "#3B6CB7", cursor: "pointer" }}>View All &gt;</span>
                </div>
                {notifications2.map((n, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                    <Avatar initials={n.name[0]} size={28} />
                    <div style={{ fontSize: 11 }}>
                      <span style={{ fontWeight: 700, color: "#1E2D4E" }}>{n.name}</span>
                      {n.time && <span style={{ color: "#aaa", fontSize: 10 }}>, {n.time}</span>}
                      <div style={{ color: "#666", marginTop: 2 }}>{n.text}</div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}