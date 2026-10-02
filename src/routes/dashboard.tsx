import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Package, Truck, PhoneCall, Globe, ArrowLeft, Bell, CreditCard,
  AlertTriangle, ShoppingBag, Check, HelpCircle, Clock4, BadgePercent,
  ChevronDown, LifeBuoy, MailCheck, TrendingUp, Users, LayoutGrid,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { HubTabBar } from "@/components/hub/hub-shell";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import logo from "@/assets/cupai-logo.png.asset.json";
import {
  listNotifications, markNotificationRead, type NotificationRow, type NotificationType,
} from "@/lib/notifications.functions";
import { getEarningsSummary } from "@/lib/orders.functions";
import { getCurrentActor } from "@/lib/staff.functions";
import { hasPermission, type StaffPermission } from "@/lib/staff-types";




export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم · cupai" },
      { name: "description", content: "أدر منتجاتك، سياساتك، شحنك، وبيانات تواصلك." },
      { property: "og:title", content: "لوحة التحكم · cupai" },
      { property: "og:description", content: "ملخص الطلبات والعملاء والأرباح وإدارة المتجر." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardPage,
});

type Tile = {
  to: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  tone: string;
  /** Permission required to open this tile. */
  perm: StaffPermission;
};

const TILES: Tile[] = [
  { to: "/orders", label: "الطلبات", description: "متابعة وتجهيز", icon: <ShoppingBag className="h-5 w-5" />, tone: "bg-dashboard-blue-soft text-dashboard-blue", perm: "orders" },
  { to: "/products", label: "المخزون", description: "المنتجات والكميات", icon: <Package className="h-5 w-5" />, tone: "bg-dashboard-green-soft text-dashboard-green", perm: "brand_data" },
  { to: "/published", label: "الموقع", description: "واجهة متجرك", icon: <Globe className="h-5 w-5" />, tone: "bg-dashboard-blue-soft text-dashboard-blue", perm: "settings" },
  { to: "/offers", label: "العروض", description: "الخصومات الحالية", icon: <BadgePercent className="h-5 w-5" />, tone: "bg-dashboard-amber-soft text-dashboard-amber", perm: "brand_data" },
  { to: "/earnings", label: "الأرباح", description: "ملخص التحصيل", icon: <TrendingUp className="h-5 w-5" />, tone: "bg-dashboard-green-soft text-dashboard-green", perm: "earnings" },
  { to: "/shipping", label: "الشحن", description: "المناطق والتكلفة", icon: <Truck className="h-5 w-5" />, tone: "bg-dashboard-blue-soft text-dashboard-blue", perm: "brand_data" },
  { to: "/settings/payment-methods", label: "الدفع", description: "طرق استلام المال", icon: <CreditCard className="h-5 w-5" />, tone: "bg-dashboard-rose-soft text-dashboard-rose", perm: "settings" },
  { to: "/contacts", label: "التواصل", description: "بيانات الاتصال", icon: <PhoneCall className="h-5 w-5" />, tone: "bg-dashboard-blue-soft text-dashboard-blue", perm: "brand_data" },
];

function formatMoney(value: number) {
  return new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 2 }).format(value);
}

function DashboardPage() {
  const actorQuery = useQuery({
    queryKey: ["current-actor"],
    queryFn: () => getCurrentActor(),
    staleTime: 60_000,
  });
  const actor = actorQuery.data ?? null;
  const can = (perm: StaffPermission) => (actor ? hasPermission(actor, perm) : false);
  const isOwner = actor?.isOwner ?? false;

  const notifs = useQuery({
    queryKey: ["notifications"],
    queryFn: () => listNotifications(),
    refetchInterval: 15000,
    enabled: !!actor,
  });
  const earnings = useQuery({
    queryKey: ["earnings-summary"],
    queryFn: () => getEarningsSummary(),
    refetchInterval: 30000,
    enabled: can("earnings"),
  });
  const visibleTiles = useMemo(() => TILES.filter((t) => can(t.perm)), [actor]);


  const unread = (notifs.data ?? []).filter((n) => !n.is_read).length;
  const orderCount = earnings.data?.orderCount ?? 0;
  const pendingProfit = earnings.data?.pendingProfit ?? 0;

  return (
    <div dir="rtl" className="hub hub-dashboard min-h-screen pb-24 lg:pb-0">
      <aside className="fixed inset-y-0 right-0 z-30 hidden w-64 border-l border-border bg-card p-5 lg:flex lg:flex-col">
        <Link to="/" className="mb-8 flex items-center gap-3 px-2">
          <img src={logo.url} alt="cupai" className="h-10 w-10 shrink-0 rounded-lg" />
          <span>
            <span className="block text-sm font-bold">متجرك</span>
            <span className="hub-latin block text-[10px] text-muted-foreground">CUPAI</span>
          </span>
        </Link>
        <nav className="space-y-1" aria-label="التنقل الرئيسي">
          <Link to="/dashboard" className="flex items-center gap-3 rounded-lg bg-primary px-3 py-2.5 text-sm font-bold text-primary-foreground">
            <LayoutGrid className="h-[18px] w-[18px]" /> الرئيسية
          </Link>
          {visibleTiles.map((tile) => (
            <Link key={tile.to} to={tile.to as never} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <span className="grid h-7 w-7 place-items-center">{tile.icon}</span>{tile.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-border pt-4 text-xs text-muted-foreground">
          إدارة متجرك من مكان واحد
        </div>
      </aside>

      <div className="lg:mr-64">
        <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
            <Link to="/" className="flex min-w-0 items-center gap-3 lg:hidden">
              <img src={logo.url} alt="cupai" className="h-9 w-9 shrink-0 rounded-lg" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold">متجرك</span>
                <span className="flex items-center gap-1 text-[10px] text-dashboard-green">
                  <span className="h-1.5 w-1.5 rounded-full bg-dashboard-green" /> جاهز للعمل
                </span>
              </span>
            </Link>
            <div className="hidden lg:block">
              <p className="text-xs text-muted-foreground">لوحة التحكم</p>
              <h1 className="text-lg font-bold">نظرة عامة</h1>
            </div>
            <a href="#notifications" className="relative grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:text-foreground" aria-label="فتح الإشعارات">
              <Bell className="h-[18px] w-[18px]" />
              {unread > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-card" />}
            </a>
          </div>
        </header>

        <main className="mx-auto max-w-6xl space-y-7 px-4 py-6 sm:px-6 lg:py-8">
          <section>
            <div className="mb-4">
              <p className="text-xs font-semibold text-primary">اليوم في متجرك</p>
              <h2 className="mt-1 text-2xl font-bold">مرحباً بك</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {can("orders") && (
                <Link to="/orders" className="dashboard-summary-card group">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-dashboard-blue-soft text-dashboard-blue"><ShoppingBag className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs text-muted-foreground">إجمالي الطلبات</span>
                    <span className="dashboard-number mt-1 block text-2xl font-bold">{earnings.isLoading ? "—" : orderCount}</span>
                  </span>
                  <ArrowLeft className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-x-1" />
                </Link>
              )}
              {can("earnings") && (
                <Link to="/earnings" className="dashboard-summary-card group">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-dashboard-green-soft text-dashboard-green"><Clock4 className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs text-muted-foreground">أرباح قيد التحصيل</span>
                    <span className="dashboard-number mt-1 flex flex-wrap items-baseline gap-1 text-2xl font-bold">
                      {earnings.isLoading ? "—" : formatMoney(pendingProfit)}
                      {earnings.data?.currency && <small className="text-[10px] font-semibold text-muted-foreground">{earnings.data.currency}</small>}
                    </span>
                  </span>
                  <ArrowLeft className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-x-1" />
                </Link>
              )}
            </div>
          </section>

          {visibleTiles.length > 0 && (
            <section>
              <div className="mb-4 flex items-end justify-between gap-3">
                <div><p className="text-xs text-muted-foreground">كل ما تحتاجه</p><h2 className="mt-1 text-base font-bold">الوصول السريع</h2></div>
                <span className="text-xs text-muted-foreground">{visibleTiles.length} أدوات</span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {visibleTiles.map((tile) => (
                  <Link key={tile.to} to={tile.to as never} className="group flex min-h-32 flex-col justify-between rounded-lg border border-border bg-card p-4 shadow-card transition hover:-translate-y-0.5 hover:border-primary/30">
                    <span className={`grid h-10 w-10 place-items-center rounded-lg ${tile.tone}`}>{tile.icon}</span>
                    <span className="mt-5 min-w-0">
                      <span className="block text-sm font-bold">{tile.label}</span>
                      <span className="mt-1 block text-[11px] text-muted-foreground">{tile.description}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,.65fr)]">
            <NotificationsSection rows={notifs.data ?? []} loading={notifs.isLoading} error={notifs.error} />
            <section>
              <h2 className="mb-3 text-sm font-bold">إدارة الحساب</h2>
              <div className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
                {can("settings") && (
                  <Link to="/settings/notifications" className="flex items-center gap-3 border-b border-border p-4 transition-colors hover:bg-muted/60">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-muted text-foreground"><MailCheck className="h-[18px] w-[18px]" /></span>
                    <span className="min-w-0 flex-1 text-sm font-semibold">إشعارات البريد</span>
                    <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                  </Link>
                )}
                {isOwner && (
                  <Link to="/team" className="flex items-center gap-3 p-4 transition-colors hover:bg-muted/60">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-muted text-foreground"><Users className="h-[18px] w-[18px]" /></span>
                    <span className="min-w-0 flex-1 text-sm font-semibold">الفريق والصلاحيات</span>
                    <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                  </Link>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>

      <div className="lg:hidden"><HubTabBar /></div>
    </div>
  );
}

const NOTIF_META: Record<NotificationType, {

  label: string; Icon: React.ComponentType<{ className?: string }>;
  bg: string; text: string; ring: string;
}> = {
  ai_error: {
    label: "خطأ في الذكاء الاصطناعي",
    Icon: AlertTriangle,
    bg: "bg-destructive/10", text: "text-destructive", ring: "ring-destructive/20",
  },
  new_order: {
    label: "طلب جديد",
    Icon: ShoppingBag,
    bg: "bg-dashboard-green-soft", text: "text-dashboard-green", ring: "ring-dashboard-green/20",
  },
  human_needed: {
    label: "استدعاء تدخل",
    Icon: LifeBuoy,
    bg: "bg-destructive/10", text: "text-destructive", ring: "ring-destructive/20",
  },

  missing_information: {
    label: "معلومة ناقصة",
    Icon: HelpCircle,
    bg: "bg-dashboard-blue-soft", text: "text-dashboard-blue", ring: "ring-dashboard-blue/20",
  },
  missing_info_followup: {
    label: "تم إبلاغ العملاء المنتظرين",
    Icon: MailCheck,
    bg: "bg-dashboard-green-soft", text: "text-dashboard-green", ring: "ring-dashboard-green/20",
  },
};

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" });
  } catch { return iso; }
}


function notificationTarget(_row: NotificationRow): { to: "/orders"; params?: undefined } {
  return { to: "/orders" };
}

function NotificationsSection({ rows, loading, error }: { rows: NotificationRow[]; loading: boolean; error: unknown }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const markRead = useMutation({
    mutationFn: (id: string) => markNotificationRead({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
    onError: (e: any) => toast.error(e?.message || "تعذر التحديث"),
  });

  const unreadCount = rows.filter((r) => !r.is_read).length;

  return (
    <section id="notifications" className="scroll-mt-20">
      <h2 className="mb-3 text-sm font-bold">آخر الإشعارات</h2>
      <Collapsible open={open} onOpenChange={setOpen} className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="h-auto w-full justify-start rounded-none p-4 hover:bg-muted/60">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-dashboard-rose-soft text-dashboard-rose"><Bell className="h-[18px] w-[18px]" /></span>
            <span className="min-w-0 flex-1 text-right">
              <span className="block text-sm font-bold">الإشعارات</span>
              <span className="block text-xs font-normal text-muted-foreground">{loading ? "جارٍ التحميل…" : unreadCount ? `${unreadCount} غير مقروء` : "لا يوجد جديد"}</span>
            </span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="border-t border-border p-3">

      {Boolean(error) && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {(error as Error)?.message || "تعذر تحميل الإشعارات."}
        </div>
      )}

      {!loading && rows.length === 0 && !error && (
        <div className="p-6 text-center text-sm text-muted-foreground">
          لا توجد إشعارات بعد.
        </div>
      )}

      <ul className="space-y-2">
        {rows.slice(0, 8).map((n) => {
          const meta = NOTIF_META[n.type] ?? NOTIF_META.ai_error;
          const Icon = meta.Icon;
          return (
            <li key={n.id} className={`flex items-start gap-2 rounded-lg border p-3 ${
                n.is_read ? "border-border/60 bg-background/70" : "border-primary/30 bg-primary/5 ring-1 ring-primary/10"
              }`}
            >
               <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ring-1 ${meta.bg} ${meta.text} ${meta.ring}`}>
                <Icon className="h-4 w-4" />
              </div>
               <Link {...notificationTarget(n)} className="min-w-0 flex-1" onClick={() => !n.is_read && markRead.mutate(n.id)}>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${meta.text}`}>{meta.label}</span>
                  {!n.is_read && (
                    <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      جديد
                    </span>
                  )}
                  <span className="ms-auto text-[11px] text-muted-foreground">{formatTime(n.created_at)}</span>
                </div>
                {n.message && (
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {n.message}
                  </p>
                )}
               </Link>
              {!n.is_read && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 shrink-0"
                  onClick={() => markRead.mutate(n.id)}
                  disabled={markRead.isPending}
                >
                  <Check className="h-3.5 w-3.5" />
                  تحديد كمقروء
                </Button>
              )}
            </li>
          );
        })}
      </ul>
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}
