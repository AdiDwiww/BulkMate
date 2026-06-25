package com.bulkmate.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.view.animation.OvershootInterpolator;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

public class FloatingIslandService extends Service {

    private static final String CHANNEL_ID = "fi_service";
    private WindowManager  wm;
    private View           pillView;
    private Handler        handler = new Handler(Looper.getMainLooper());
    private Runnable       autoHide;

    @Override
    public void onCreate() {
        super.onCreate();
        wm = (WindowManager) getSystemService(WINDOW_SERVICE);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) return START_NOT_STICKY;

        startAsForeground();

        if ("SHOW".equals(intent.getAction())) {
            String label = intent.getStringExtra("label");
            String color = intent.getStringExtra("color");
            showPill(label != null ? label : "Pengingat", color != null ? color : "#22c55e");
        } else {
            dismissAndStop();
        }
        return START_NOT_STICKY;
    }

    // ─── Build the pill view ───────────────────────────────────────────────────

    private void showPill(String label, String colorHex) {
        removePill();

        int accent;
        try { accent = Color.parseColor(colorHex); }
        catch (Exception e) { accent = Color.parseColor("#22c55e"); }

        // Camera position from SharedPreferences
        SharedPreferences prefs = getSharedPreferences("FloatingIslandPrefs", MODE_PRIVATE);
        int camX = prefs.getInt("camX", 0);
        int camY = prefs.getInt("camY", 8);

        // ── Pill container ──
        LinearLayout pill = new LinearLayout(this);
        pill.setOrientation(LinearLayout.HORIZONTAL);
        pill.setGravity(Gravity.CENTER_VERTICAL);

        int ph = dp(13), pv = dp(8);
        pill.setPadding(ph, pv, ph, pv);

        GradientDrawable bg = new GradientDrawable();
        bg.setShape(GradientDrawable.RECTANGLE);
        bg.setCornerRadius(dp(50));
        bg.setColor(Color.parseColor("#0f0f0f"));
        bg.setStroke(dp(1), Color.argb(38, 255, 255, 255));
        pill.setBackground(bg);

        // Glow: outer shadow via elevation on API 21+
        pill.setElevation(dp(8));

        // ── Dot ──
        View dot = new View(this);
        int ds = dp(7);
        LinearLayout.LayoutParams dotLp = new LinearLayout.LayoutParams(ds, ds);
        dotLp.setMarginEnd(dp(6));
        dot.setLayoutParams(dotLp);
        GradientDrawable dotBg = new GradientDrawable();
        dotBg.setShape(GradientDrawable.OVAL);
        dotBg.setColor(accent);
        dot.setBackground(dotBg);

        // ── Text ──
        TextView txt = new TextView(this);
        txt.setText("Waktunya " + label + "!");
        txt.setTextColor(Color.WHITE);
        txt.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12.5f);
        txt.setTypeface(null, Typeface.BOLD);
        txt.setMaxLines(1);

        pill.addView(dot);
        pill.addView(txt);

        // ── Tap to dismiss ──
        pill.setOnClickListener(v -> dismissAndStop());

        pillView = pill;

        // ── WindowManager params ──
        int wmType = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            : WindowManager.LayoutParams.TYPE_PHONE;

        WindowManager.LayoutParams lp = new WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            wmType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE |
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        );
        lp.gravity = Gravity.TOP | Gravity.CENTER_HORIZONTAL;
        lp.y = camY;
        lp.x = camX;

        try {
            wm.addView(pillView, lp);
        } catch (Exception e) {
            stopSelf();
            return;
        }

        // ── Entry animation: scale in ──
        pillView.setScaleX(0.6f);
        pillView.setScaleY(0.6f);
        pillView.setAlpha(0f);
        pillView.animate()
            .scaleX(1f).scaleY(1f).alpha(1f)
            .setDuration(380)
            .setInterpolator(new OvershootInterpolator(1.8f))
            .start();

        // ── Auto dismiss after 8 seconds ──
        autoHide = this::dismissAndStop;
        handler.postDelayed(autoHide, 8000);
    }

    private void dismissAndStop() {
        handler.removeCallbacks(autoHide);
        if (pillView != null) {
            // Exit animation: scale + fade out
            pillView.animate()
                .scaleX(0.65f).scaleY(0.65f).alpha(0f)
                .setDuration(250)
                .withEndAction(() -> {
                    removePill();
                    stopSelf();
                })
                .start();
        } else {
            stopSelf();
        }
    }

    private void removePill() {
        if (pillView != null) {
            try { wm.removeView(pillView); } catch (Exception ignored) {}
            pillView = null;
        }
    }

    private int dp(int val) {
        return Math.round(val * getResources().getDisplayMetrics().density);
    }

    // ─── Foreground service notification ──────────────────────────────────────

    private void startAsForeground() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(
                CHANNEL_ID, "BulkMate Overlay", NotificationManager.IMPORTANCE_MIN);
            ch.setShowBadge(false);
            ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).createNotificationChannel(ch);
        }
        Notification notif = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("BulkMate")
            .setSmallIcon(android.R.drawable.ic_popup_reminder)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setSilent(true)
            .build();
        startForeground(9002, notif);
    }

    @Nullable @Override
    public IBinder onBind(Intent intent) { return null; }

    @Override
    public void onDestroy() { super.onDestroy(); removePill(); }
}
