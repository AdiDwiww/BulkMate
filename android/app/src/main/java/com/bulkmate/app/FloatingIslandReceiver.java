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

        android.util.Log.d("BulkMate-Alarm", "[BroadcastReceiver] received reminder: " + label);

        // Try to start ForegroundService (this is the single source of truth for the overlay)
        try {
            Intent svc = new Intent(context, FloatingIslandService.class);
            svc.setAction("SHOW");
            svc.putExtra("label", label);
            svc.putExtra("color", color);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                context.startForegroundService(svc);
            else
                context.startService(svc);
        } catch (Exception e) {
            android.util.Log.e("BulkMate-Alarm", "[BroadcastReceiver] Error starting service: " + e.getMessage());
        }
    }

    // `buildPill` is used by FloatingIslandService
    // `buildPill` creates the small state

    /**
     * Builds the pill view — matches in-app DynamicIsland design.
     * Layout: [dot●] [18dp gap = camera hole] [🔔 Waktunya label!]
     * Dot kamera HP ada di tengah pill → gap memastikan tidak ada teks di atas dot.
     */
    static LinearLayout buildPill(Context ctx, String label, int accent, int camX) {
        int d = (int) ctx.getResources().getDisplayMetrics().density;

        // Root pill container
        LinearLayout pill = new LinearLayout(ctx);
        pill.setOrientation(LinearLayout.HORIZONTAL);
        pill.setGravity(Gravity.CENTER_VERTICAL);
        pill.setPadding(14 * d, 0, 14 * d, 0);
        pill.setMinimumHeight(36 * d);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP)
            pill.setElevation(10 * d);

        // Background: dark gradient (#0f0f0f → #1e1e1e) + subtle white border
        GradientDrawable bg = new GradientDrawable(
            GradientDrawable.Orientation.TL_BR,
            new int[]{Color.parseColor("#0f0f0f"), Color.parseColor("#1e1e1e")}
        );
        bg.setShape(GradientDrawable.RECTANGLE);
        bg.setCornerRadius(50 * d);
        bg.setStroke(1, Color.argb(26, 255, 255, 255)); // rgba(255,255,255,0.10)
        pill.setBackground(bg);

        // ── Kiri: dot indikator warna (pulse animation) ──
        View dot = new View(ctx);
        LinearLayout.LayoutParams dotLp = new LinearLayout.LayoutParams(8 * d, 8 * d);
        dot.setLayoutParams(dotLp);
        GradientDrawable dotBg = new GradientDrawable();
        dotBg.setShape(GradientDrawable.OVAL);
        dotBg.setColor(accent);
        dot.setBackground(dotBg);
        android.view.animation.AlphaAnimation pulse =
            new android.view.animation.AlphaAnimation(1f, 0.35f);
        pulse.setDuration(600); pulse.setRepeatMode(android.view.animation.Animation.REVERSE);
        pulse.setRepeatCount(android.view.animation.Animation.INFINITE);
        dot.startAnimation(pulse);

        // ── Tengah: gap 18dp = area dot kamera depan HP ──
        Space cameraGap = new Space(ctx);
        cameraGap.setLayoutParams(new LinearLayout.LayoutParams(18 * d, LinearLayout.LayoutParams.MATCH_PARENT));

        // ── Kanan: grup bell + teks ──
        LinearLayout right = new LinearLayout(ctx);
        right.setOrientation(LinearLayout.HORIZONTAL);
        right.setGravity(Gravity.CENTER_VERTICAL);

        TextView bell = new TextView(ctx);
        bell.setText("\uD83D\uDD14"); // 🔔
        bell.setTextSize(TypedValue.COMPLEX_UNIT_SP, 10f);
        LinearLayout.LayoutParams bellLp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        bellLp.setMarginEnd(5 * d);
        bell.setLayoutParams(bellLp);

        TextView txt = new TextView(ctx);
        txt.setText("Waktunya " + label + "!");
        txt.setTextColor(Color.WHITE);
        txt.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11f);
        txt.setTypeface(null, Typeface.BOLD);
        txt.setLetterSpacing(0.01f);
        txt.setMaxLines(1);
        txt.setEllipsize(android.text.TextUtils.TruncateAt.END);

        right.addView(bell);
        right.addView(txt);

        pill.addView(dot);
        pill.addView(cameraGap);
        pill.addView(right);
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
