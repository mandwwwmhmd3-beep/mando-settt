# Moon Sat — Vercel بدون Supabase

هذه النسخة لا تستخدم Supabase ولا تطلب `SUPABASE_URL` أو `SUPABASE_SERVICE_ROLE_KEY`.

## متغيرات Vercel المطلوبة
- `JWT_SECRET`
- `ADMIN_USER`
- `ADMIN_PASSWORD`

## مهم
تسجيل الدخول وواجهة لوحة التحكم وواجهة `/api/health` تعمل.
رفع الملفات غير مفعّل في هذه النسخة، لأن Vercel لا يوفر نظام ملفات دائمًا لتخزين الملفات.

لا تضع كلمات المرور أو الأسرار داخل GitHub.
