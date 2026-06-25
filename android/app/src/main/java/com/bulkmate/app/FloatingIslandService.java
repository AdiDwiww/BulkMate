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
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.view.animation.OvershootInterpolator;
import android.widget.LinearLayout;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

public class FloatingIslandService extends Service {

    private static final String CH = "fi_overlay";
    private static final int    NID = 9002;

    private WindowManager wm;
    private View          overlay;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private Runnable      autoHide;

    @Override public void onCreate() {
        super.onCreate();
        wm = (WindowManager) getSystemService(WINDOW_SERVICE);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        startFg(); // Must be called first
        if (intent != null && "SHOW".equals(intent.getAction())) {
            String label = intent.getStringExtra("label");
            String color = intent.getStringExtra("color");
            handler.post(() -> show(
                label != null ? label : "Pengingat",
                color != null ? color : "#22c55e"
            ));
        } else {
            handler.post(this::dismissStop);
        }
        return START_NOT_STICKY;
    }

    private void show(String label, String colorHex) {
        remove();
        SharedPreferences prefs = getSharedPreferences("FloatingIslandPrefs", MODE_PRIVATE);
        int camX = prefs.getInt("camX", 0);
        int camY = prefs.getInt("camY", 6);

        int accent;
        try { accent = Color.parseColor(colorHex); }
        catch (Exception e) { accent = Color.parseColor("#22c55e"); }

        // Reuse shared pill builder
        LinearLayout pill = FloatingIslandReceiver.buildPill(this, label, accent);
        pill.setOnClickListener(v -> dismissStop());
        overlay = pill;

        int wmType = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
            ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            : WindowManager.LayoutParams.TYPE_PHONE;

        WindowManager.LayoutParams lp = new WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            wmType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
                | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,  // ← allows positioning in status bar
            PixelFormat.TRANSLUCENT
        );
        lp.gravity = Gravity.TOP | Gravity.CENTER_HORIZONTAL;
        lp.y = camY;
        lp.x = camX;

        try {
            wm.addView(overlay, lp);
        } catch (Exception e) { stopSelf(); return; }

        overlay.setScaleX(0.65f); overlay.setScaleY(0.65f); overlay.setAlpha(0f);
        overlay.animate().scaleX(1f).scaleY(1f).alpha(1f)
            .setDuration(380).setInterpolator(new OvershootInterpolator(1.6f)).start();

        autoHide = this::dismissStop;
        handler.postDelayed(autoHide, 8000);
    }

    private void dismissStop() {
        if (autoHide != null) handler.removeCallbacks(autoHide);
        if (overlay != null) {
            overlay.animate().scaleX(0.6f).scaleY(0.6f).alpha(0f).setDuration(230)
                .withEndAction(() -> { remove(); stopSelf(); }).start();
        } else stopSelf();
    }

    private void remove() {
        if (overlay != null) {
            try { wm.removeView(overlay); } catch (Exception ignored) {}
            overlay = null;
        }
    }

    private void startFg() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(CH, "BulkMate Overlay", NotificationManager.IMPORTANCE_MIN);
            ch.setShowBadge(false); ch.setSound(null, null);
            ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).createNotificationChannel(ch);
        }
        Notification n = new NotificationCompat.Builder(this, CH)
            .setContentTitle("BulkMate Reminder").setSmallIcon(android.R.drawable.ic_popup_reminder)
            .setPriority(NotificationCompat.PRIORITY_MIN).setSilent(true).build();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(NID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        } else {
            startForeground(NID, n);
        }
    }

    @Nullable @Override public IBinder onBind(Intent i) { return null; }
    @Override public void onDestroy() { super.onDestroy(); remove(); }
}
