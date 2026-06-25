package com.bulkmate.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.util.DisplayMetrics;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.LinearLayout;
import android.widget.Space;
import android.widget.TextView;

public class FloatingIslandReceiver extends BroadcastReceiver {

    private static View   shownView;
    private static final Handler H = new Handler(Looper.getMainLooper());
    private static Runnable removeTask;
    private static PowerManager.WakeLock wakeLock;

    @Override
    public void onReceive(Context context, Intent intent) {
        if (!"SHOW_FI".equals(intent.getAction())) return;
        String label = intent.getStringExtra("label");
        String color = intent.getStringExtra("color");

        // Acquire WakeLock to keep process alive for overlay duration
        PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        if (wakeLock == null || !wakeLock.isHeld()) {
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "BulkMate::IslandWakeLock");
            wakeLock.acquire(10_000L); // 10 seconds max
        }

        // Show overlay directly (reliable, no service needed)
        H.post(() -> showOverlay(context, label != null ? label : "Pengingat", color != null ? color : "#22c55e"));

        // Also try to start ForegroundService as backup
        try {
            Intent svc = new Intent(context, FloatingIslandService.class);
            svc.setAction("SHOW");
            svc.putExtra("label", label);
            svc.putExtra("color", color);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                context.startForegroundService(svc);
            else
                context.startService(svc);
        } catch (Exception ignored) {}
    }

    static void showOverlay(Context ctx, String label, String colorHex) {
        if (!android.provider.Settings.canDrawOverlays(ctx)) return;
        removeOverlay(ctx);

        int accent;
        try { accent = Color.parseColor(colorHex); }
        catch (Exception e) { accent = Color.parseColor("#22c55e"); }

        android.content.SharedPreferences prefs = ctx.getSharedPreferences("FloatingIslandPrefs", Context.MODE_PRIVATE);
        int camX = prefs.getInt("camX", 0);
        int camY = prefs.getInt("camY", 6);

        LinearLayout pill = buildPill(ctx, label, accent, camX);
        pill.setOnClickListener(v -> removeOverlay(ctx));
        shownView = pill;

        int wmType = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
            ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            : WindowManager.LayoutParams.TYPE_PHONE;

        WindowManager.LayoutParams lp = new WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            wmType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
                | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        );
        // Position pill to the RIGHT of the camera dot center
        WindowManager wm = (WindowManager) ctx.getSystemService(Context.WINDOW_SERVICE);
        int d = (int) ctx.getResources().getDisplayMetrics().density;
        int screenW = getScreenWidth(ctx, wm);
        // Camera center = screenW/2 + camX. Start pill 8dp after camera right edge (camera radius ~7dp)
        lp.gravity = Gravity.TOP | Gravity.START;
        lp.x = screenW / 2 + camX + (7 * d) + (4 * d); // right of camera dot
        lp.y = camY;

        try { wm.addView(shownView, lp); } catch (Exception e) { return; }

        shownView.setScaleX(0.7f); shownView.setScaleY(0.7f); shownView.setAlpha(0f);
        shownView.animate().scaleX(1f).scaleY(1f).alpha(1f).setDuration(350).start();

        if (removeTask != null) H.removeCallbacks(removeTask);
        removeTask = () -> removeOverlay(ctx);
        H.postDelayed(removeTask, 8000);
    }

    private static void removeOverlay(Context ctx) {
        if (shownView != null) {
            try {
                ((WindowManager) ctx.getSystemService(Context.WINDOW_SERVICE)).removeView(shownView);
            } catch (Exception ignored) {}
            shownView = null;
        }
        if (wakeLock != null && wakeLock.isHeld()) { wakeLock.release(); wakeLock = null; }
    }

    /**
     * Builds the pill view.
     * Layout: [icon/dot] [space] [text] — no text over the camera hole.
     * Camera is to the LEFT (pill starts from camera's right edge).
     */
    static LinearLayout buildPill(Context ctx, String label, int accent, int camX) {
        int d = (int) ctx.getResources().getDisplayMetrics().density;

        LinearLayout pill = new LinearLayout(ctx);
        pill.setOrientation(LinearLayout.HORIZONTAL);
        pill.setGravity(Gravity.CENTER_VERTICAL);
        pill.setPadding(12 * d, 7 * d, 14 * d, 7 * d);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP)
            pill.setElevation(10 * d);

        GradientDrawable bg = new GradientDrawable();
        bg.setShape(GradientDrawable.RECTANGLE);
        bg.setCornerRadius(50 * d);
        bg.setColor(Color.parseColor("#111111"));
        bg.setStroke(2, Color.argb(55, 255, 255, 255));
        pill.setBackground(bg);

        // Colored dot indicator
        View dot = new View(ctx);
        LinearLayout.LayoutParams dotLp = new LinearLayout.LayoutParams(8 * d, 8 * d);
        dotLp.setMarginEnd(7 * d);
        dot.setLayoutParams(dotLp);
        GradientDrawable dotBg = new GradientDrawable();
        dotBg.setShape(GradientDrawable.OVAL);
        dotBg.setColor(accent);
        dot.setBackground(dotBg);

        // Text
        TextView txt = new TextView(ctx);
        txt.setText("Waktunya " + label + "!");
        txt.setTextColor(Color.WHITE);
        txt.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13f);
        txt.setTypeface(null, Typeface.BOLD);
        txt.setMaxLines(1);

        pill.addView(dot);
        pill.addView(txt);
        return pill;
    }

    private static int getScreenWidth(Context ctx, WindowManager wm) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            return wm.getCurrentWindowMetrics().getBounds().width();
        }
        DisplayMetrics dm = new DisplayMetrics();
        wm.getDefaultDisplay().getMetrics(dm);
        return dm.widthPixels;
    }
}
