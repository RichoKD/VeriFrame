# Dashboard Pages Overview

This document shows all three dashboard pages using the BaseLayout template.

## Pages Structure

```text
frontend/src/app/dashboard/
├── page.tsx           # Role selection page
├── creators/
│   └── page.tsx      # Creator dashboard (gradientVariant="blue")
├── nodes/
│   └── page.tsx      # Node dashboard (gradientVariant="cyan")
└── admin/
    └── page.tsx      # Admin dashboard (gradientVariant="purple")
```

---

## 1. Creator Dashboard

**Path**: `/dashboard/creators`  
**Gradient**: `blue` (blue-400 to cyan-400)  
**Purpose**: Manage projects and collaborate with nodes

### Template Structure

```tsx
<BaseLayout
  title="Creator Dashboard"
  subtitle="Manage your projects and collaborate with nodes"
  gradientVariant="blue"
  showFooter={true}
>
  {/* Your content here */}
</BaseLayout>
```

### Suggested Content

- Stats Grid: Active Jobs, Completed, Total Spent, Active Nodes
- Action Bar: Create New Job button, tabs (Active/Completed/Drafts)
- Jobs List: Cards showing job details, progress, nodes assigned
- Forms: Create job, Edit job, Release payment

---

## 2. Node Dashboard

**Path**: `/dashboard/nodes`  
**Gradient**: `cyan` (cyan-400 to purple-400)  
**Purpose**: Browse jobs, deliver work, and earn rewards

### Template Structure

```tsx
<BaseLayout
  title="Node Dashboard"
  subtitle="Browse jobs, deliver work, and earn rewards"
  gradientVariant="cyan"
  showFooter={true}
>
  {/* Your content here */}
</BaseLayout>
```

### Suggested Content

- Stats Grid: Jobs Completed, Total Earnings, Success Rate, Reputation Score
- Status Badge: Online/Offline indicator
- Navigation Tabs: Available Jobs, Active Jobs, Completed
- Jobs Grid: Available jobs to accept, active work, submission forms
- Profile: Skills, ratings, portfolio

---

## 3. Admin Dashboard

**Path**: `/dashboard/admin`  
**Gradient**: `purple` (purple-400 to blue-400)  
**Purpose**: Monitor platform health and manage disputes

### Template Structure

```tsx
<BaseLayout
  title="Admin Dashboard"
  subtitle="Monitor platform health and manage disputes"
  gradientVariant="purple"
  showFooter={true}
>
  {/* Your content here */}
</BaseLayout>
```

### Suggested Content

- Stats Grid: Total Users, Active Jobs, Platform Volume, Open Disputes
- Quick Actions: Generate Report, Manage Users, System Logs
- Activity Feed: Recent platform activities
- Disputes List: Cases requiring attention
- System Health: Performance metrics, uptime status

---

## Routing Flow

```text
User clicks "Connect Wallet"
        ↓
/dashboard (Role Selection)
        ↓
User selects role
        ↓
    ┌───────┴───────┐
    ↓               ↓               ↓
Creator         Node            Admin
/dashboard/     /dashboard/     /dashboard/
creators        nodes           admin
(blue)          (cyan)          (purple)
```

---

## Common Content Patterns

### Stats Card

```tsx
<Card className="bg-zinc-900/80 border-zinc-800 p-6 backdrop-blur-sm">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm text-slate-400 mb-1">Label</p>
      <p className="text-3xl font-bold text-slate-200">Value</p>
    </div>
    <div className="p-3 rounded-lg bg-blue-500/20">
      <Icon className="w-6 h-6 text-blue-400" />
    </div>
  </div>
</Card>
```

### Action Button

```tsx
<Button className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600">
  <Icon className="w-4 h-4 mr-2" />
  Action Text
</Button>
```

### Content Card

```tsx
<Card className="bg-zinc-900/80 border-zinc-800 p-6 backdrop-blur-sm hover:border-zinc-700 transition-colors">
  {/* Your card content */}
</Card>
```

### Empty State

```tsx
<Card className="bg-zinc-900/80 border-zinc-800 p-12 text-center backdrop-blur-sm">
  <Icon className="w-16 h-16 mx-auto mb-4 text-slate-600" />
  <h3 className="text-xl font-semibold text-slate-300 mb-2">No items yet</h3>
  <p className="text-slate-400 mb-6">Description text</p>
  <Button>Call to Action</Button>
</Card>
```

---

## Color Scheme Reference

| Dashboard | Primary          | Secondary        | Use Case                    |
| --------- | ---------------- | ---------------- | --------------------------- |
| Creator   | Blue (#4A90E2)   | Cyan (#2ED2C9)   | Jobs, projects, management  |
| Node      | Cyan (#2ED2C9)   | Purple (#6B46C1) | Work, earnings, tasks       |
| Admin     | Purple (#6B46C1) | Blue (#4A90E2)   | Oversight, disputes, system |

---

## Responsive Grid Layouts

### Stats Grid (4 columns)

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Stats cards */}
</div>
```

### Content Grid (3 columns)

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Content cards */}
</div>
```

### Two Column Layout

```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">{/* Main content */}</div>
  <div>{/* Sidebar */}</div>
</div>
```

---

## Next Steps

1. **For Creators Dashboard**: Add job creation form, job listings, payment management
2. **For Nodes Dashboard**: Add available jobs browser, work submission interface, earnings tracker
3. **For Admin Dashboard**: Add user management panel, dispute resolution interface, analytics

All three dashboards are now set up with the BaseLayout template and ready for you to add your custom content! 🚀
