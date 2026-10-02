import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, ExternalLink, Globe, ImageIcon, Lock, Settings, Trash2, Unlock, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  getSiteState, publishSite, unpublishSite, deleteSite,
  updateWebsiteIdentity, uploadWebsiteLogo,
} from "@/lib/website.functions";

function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result ?? "");
      const i = s.indexOf(",");
      res(i >= 0 ? s.slice(i + 1) : s);
    };
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

/** Store link shown at the top of the control page, with a gear opening site settings. */
export function SiteLinkBar() {
  const qc = useQueryClient();
  const site = useQuery({ queryKey: ["site-state"], queryFn: () => getSiteState() });
  const [open, setOpen] = useState(false);
  const state = site.data;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const logoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(state?.brand_name ?? "");
    setDescription(state?.description ?? "");
    setLogoUrl(state?.logo_url ?? "");
  }, [state?.brand_name, state?.description, state?.logo_url]);

  const refresh = () => qc.invalidateQueries({ queryKey: ["site-state"] });
  const onErr = (e: unknown) => toast.error(e instanceof Error ? e.message : "حدث خطأ");

  const saveMut = useMutation({
    mutationFn: (patch: Record<string, unknown>) => updateWebsiteIdentity({ data: patch as never }),
    onSuccess: () => { refresh(); toast.success("تم الحفظ"); },
    onError: onErr,
  });
  const uploadMut = useMutation({
    mutationFn: async (file: File) => {
      const base64 = await fileToBase64(file);
      const { url } = await uploadWebsiteLogo({ data: { file_name: file.name, mime_type: file.type, base64 } });
      return url;
    },
    onSuccess: (url) => { setLogoUrl(url); saveMut.mutate({ logo_url: url }); },
    onError: onErr,
  });
  const toggleMut = useMutation({
    mutationFn: () => (state?.site_status === "published" ? unpublishSite({}) : publishSite({})),
    onSuccess: () => { refresh(); toast.success(state?.site_status === "published" ? "تم تقييد الموقع" : "تم تفعيل الموقع"); },
    onError: onErr,
  });
  const deleteMut = useMutation({
    mutationFn: () => deleteSite({}),
    onSuccess: () => { refresh(); setOpen(false); toast.success("تم حذف الموقع"); },
    onError: onErr,
  });

  if (!state?.site_created || !state.brand_slug) return null;

  const path = `/c/${state.brand_slug}`;
  const url = `${typeof window !== "undefined" ? window.location.origin : ""}${path}`;
  const published = state.site_status === "published";

  return (
    <>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-dashboard-blue-soft text-dashboard-blue">
          <Globe className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            رابط موقعك
            <span className={`h-1.5 w-1.5 rounded-full ${published ? "bg-dashboard-green" : "bg-destructive"}`} />
            {published ? "منشور" : "مقيد"}
          </div>
          <a href={path} target="_blank" rel="noopener noreferrer" dir="ltr" className="block truncate text-left text-sm font-semibold hover:underline">
            {url.replace(/^https?:\/\//, "")}
          </a>
        </div>
        <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="نسخ الرابط"
          onClick={() => { navigator.clipboard?.writeText(url); toast.success("تم نسخ الرابط"); }}>
          <Copy className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" asChild aria-label="فتح الموقع">
          <a href={path} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
        </Button>
        <Button size="icon" variant="outline" className="h-8 w-8" aria-label="إعدادات الموقع" onClick={() => setOpen(true)}>
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right">إعدادات الموقع</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full border bg-muted/40">
                {logoUrl ? <img src={logoUrl} alt="لوجو الموقع" className="h-full w-full object-cover" /> : <ImageIcon className="h-7 w-7 text-muted-foreground" />}
              </div>
              <input ref={logoRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadMut.mutate(f); e.target.value = ""; }} />
              <Button variant="outline" size="sm" disabled={uploadMut.isPending} onClick={() => logoRef.current?.click()}>
                <Upload className="ml-1 h-4 w-4" />
                {uploadMut.isPending ? "جارٍ الرفع…" : logoUrl ? "تغيير اللوجو" : "إضافة لوجو"}
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label>اسم الموقع</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: متجر القهوة" />
            </div>
            <div className="space-y-1.5">
              <Label>الوصف</Label>
              <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="وصف قصير لمتجرك" />
            </div>
            <Button className="w-full" disabled={saveMut.isPending || name.trim().length < 2}
              onClick={() => saveMut.mutate({ brand_name: name.trim(), description })}>
              حفظ
            </Button>

            <div className="grid grid-cols-2 gap-2 border-t border-border pt-4">
              <Button variant="outline" disabled={toggleMut.isPending} onClick={() => toggleMut.mutate()}>
                {published ? <><Lock className="ml-1 h-4 w-4" />تقييد الموقع</> : <><Unlock className="ml-1 h-4 w-4" />إلغاء التقييد</>}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={deleteMut.isPending}>
                    <Trash2 className="ml-1 h-4 w-4" />حذف الموقع
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent dir="rtl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-right">حذف الموقع؟</AlertDialogTitle>
                    <AlertDialogDescription className="text-right">سيتوقف ظهور موقعك للعملاء.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteMut.mutate()}>حذف</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
