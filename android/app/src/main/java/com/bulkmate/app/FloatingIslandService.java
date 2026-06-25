package com.bulkmate.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
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
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

public class FloatingIslandService extends Service {

    private static final String CHANNEL_ID = "fi_overlay_svc";
    private static final int    NOTIF_ID   = 9002;

    private WindowManager windowManager;
    private View          overlayView;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private Runnable      autoHideTask;

    @Override
    public void onCreate() {
        super.onCreate();
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // WAJIB: startForeground dipanggil pertama sebelum operasi lain
        startAsForeground();

        if (intent != null && "SHOW".equals(intent.getAction())) {
            String label = intent.getStringExtra("label");
            String color = intent.getStringExtra("color");
            handler.post(() -> showOverlay(
                label != null ? label : "Pengingat",
                color != null ? color : "#22c55e"
            ));
        } else {
            handler.post(this::dismissAndStop);
        }
        return START_NOT_STICKY;
    }

    private void startAsForeground() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(
                CHANNEL_ID, "BulkMate Overlay", NotificationManager.IMPORTANCE_MIN);
            ch.setShowBadge(false);
            ch.setSound(null, null);
            ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).createNotificationChannel(ch);
        }
        Notification notif = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("BulkMate")
            .setSmallIcon(android.R.drawable.ic_popup_reminder)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setSilent(true)
            .build();

        // Android 14+ requires foreground service type in startForeground()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) { // API 34
            startForeground(NOTIF_ID, notif, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        } else {
            startForeground(NOTIF_ID, notif);
        }
    }

    private void showOverlay(String label, String colorHex) {
        removeOverlay();

        // Baca posisi kamera
        SharedPreferences prefs = getSharedPreferences("FloatingIslandPrefs", MODE_PRIVATE);
        int camX = prefs.getInt("camX", 0);
        int camY = prefs.getInt("camY", 8);

        int accent;
        try { accent = Color.parseColor(colorHex); }
        catch (Exception e) { accent = Color.parseColor("#22c55e"); }

        // ── Build pill view ──────────────────────────────────────────────────
        LinearLayout pill = new LinearLayout(this);
        pill.setOrientation(LinearLayout.HORIZONTAL);
        pill.setGravity(Gravity.CENTER_VERTICAL);
        pill.setPadding(dp(14), dp(8), dp(14), dp(8));
        pill.setElevation(dp(8));

        GradientDrawable bg = new GradientDrawable();
        bg.setShape(GradientDrawable.RECTANGLE);
        bg.setCornerRadius(dp(50));
        bg.setColor(Color.parseColor("#0f0f0f"));
        bg.setStroke(2, Color.argb(40, 255, 255, 255));
        pill.setBackground(bg);

        // Dot
        View dot = new View(this);
        LinearLayout.LayoutParams dotLp = new LinearLayout.LayoutParams(dp(8), dp(8));
        dotLp.setMarginEnd(dp(7));
        dot.setLayoutParams(dotLp);
        GradientDrawable dotBg = new GradientDrawable();
        dotBg.setShape(GradientDrawable.OVAL);
        dotBg.setColor(accent);
        dot.setBackground(dotBg);

        // Text
        TextView txt = new TextView(this);
        txt.setText("Waktunya " + label + "!");
        txt.setTextColor(Color.WHITE);
        txt.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13f);
        txt.setTypeface(null, Typeface.BOLD);
        txt.setMaxLines(1);

        pill.addView(dot);
        pill.addView(txt);
        pill.setOnClickListener(v -> dismissAndStop());

        overlayView = pill;

        // ── WindowManager params ─────────────────────────────────────────────
        int wmType = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
            ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            : WindowManager.LayoutParams.TYPE_PHONE;

        WindowManager.LayoutParams lp = new WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            wmType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
                | WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
            PixelFormat.TRANSLUCENT
        );
        lp.gravity = Gravity.TOP | Gravity.CENTER_HORIZONTAL;
        lp.y = camY;
        lp.x = camX;

        try {
            windowManager.addView(overlayView, lp);
        } catch (Exception e) {
            stopSelf();
            return;
        }

        // Entry animation
        overlayView.setScaleX(0.65f);
        overlayView.setScaleY(0.65f);
        overlayView.setAlpha(0f);
        overlayView.animate()
            .scaleX(1f).scaleY(1f).alpha(1f)
            .setDuration(380)
            .setInterpolator(new OvershootInterpolator(1.6f))
            .start();

        // Auto-dismiss after 8 seconds
        autoHideTask = this::dismissAndStop;
        handler.postDelayed(autoHideTask, 8000);
    }

    private void dismissAndStop() {
        if (autoHideTask != null) handler.removeCallbacks(autoHideTask);
        if (overlayView != null) {
            overlayView.animate()
                .scaleX(0.6f).scaleY(0.6f).alpha(0f)
                .setDuration(240)
                .withEndAction(() -> { removeOverlay(); stopSelf(); })
                .start();
        } else {
            stopSelf();
        }
    }

    private void removeOverlay() {
        if (overlayView != null) {
            try { windowManager.removeView(overlayView); } catch (Exception ignored) {}
            overlayView = null;
        }
    }

    private int dp(int val) {
        return Math.round(val * getResources().getDisplayMetrics().density);
    }

    @Nullable @Override public IBinder onBind(Intent intent) { return null; }
    @Override public void onDestroy() { super.onDestroy(); removeOverlay(); }
}
