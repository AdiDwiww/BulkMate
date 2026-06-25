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
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.DisplayMetrics;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.view.animation.OvershootInterpolator;
import android.widget.LinearLayout;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

public class FloatingIslandService extends Service {

    private static final String CH  = "fi_overlay";
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
        startFg();
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
        if (overlay != null) {
            // BUG 3: Deduplicate - DO NOT create new overlay if one is already active.
            return;
        }

        SharedPreferences prefs = getSharedPreferences("FloatingIslandPrefs", MODE_PRIVATE);
        int camX = prefs.getInt("camX", 0);
        int camY = prefs.getInt("camY", 6);

        int accent;
        try { accent = Color.parseColor(colorHex); }
        catch (Exception e) { accent = Color.parseColor("#22c55e"); }

        final int d = (int) getResources().getDisplayMetrics().density;

        // Container
        final android.widget.FrameLayout root = new android.widget.FrameLayout(this);
        int wmType = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
            ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY : WindowManager.LayoutParams.TYPE_PHONE;
        WindowManager.LayoutParams lp = new WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT, WindowManager.LayoutParams.WRAP_CONTENT, wmType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        );
        
        // BUG 5: Calculate status bar height to prevent colliding with icons
        int statusBarHeight = 0;
        int resourceId = getResources().getIdentifier("status_bar_height", "dimen", "android");
        if (resourceId > 0) statusBarHeight = getResources().getDimensionPixelSize(resourceId);

        // BUG 1: Always center horizontally, don't use camX for window offset.
        lp.gravity = Gravity.TOP | Gravity.CENTER_HORIZONTAL;
        lp.x = 0; 
        lp.y = statusBarHeight + (camY * d) + (8 * d); // Add margin below status bar

        // Animated Background
        GradientDrawable bg = new GradientDrawable(
            GradientDrawable.Orientation.TL_BR, new int[]{Color.parseColor("#0f0f0f"), Color.parseColor("#1e1e1e")}
        );
        bg.setShape(GradientDrawable.RECTANGLE);
        bg.setCornerRadius(50 * d);
        bg.setStroke(1, Color.argb(26, 255, 255, 255));
        root.setBackground(bg);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) root.setElevation(10 * d);

        // Pill layout (State 1)
        LinearLayout pill = FloatingIslandReceiver.buildPill(this, label, accent, camX);
        pill.setLayoutParams(new android.widget.FrameLayout.LayoutParams(148 * d, 36 * d, Gravity.CENTER));

        // Expanded layout (State 2)
        LinearLayout exp = new LinearLayout(this);
        exp.setOrientation(LinearLayout.VERTICAL);
        exp.setLayoutParams(new android.widget.FrameLayout.LayoutParams(300 * d, 122 * d));
        exp.setPadding(13 * d, 12 * d, 13 * d, 11 * d);
        exp.setAlpha(0f);
        exp.setVisibility(View.GONE);

        // Header
        LinearLayout header = new LinearLayout(this);
        header.setOrientation(LinearLayout.HORIZONTAL);
        header.setGravity(Gravity.CENTER_VERTICAL);
        View iconBox = new View(this);
        iconBox.setLayoutParams(new LinearLayout.LayoutParams(32 * d, 32 * d));
        GradientDrawable ibg = new GradientDrawable(); ibg.setColor(Color.argb(32, Color.red(accent), Color.green(accent), Color.blue(accent)));
        ibg.setCornerRadius(10 * d); ibg.setStroke(1, Color.argb(55, Color.red(accent), Color.green(accent), Color.blue(accent)));
        iconBox.setBackground(ibg);
        
        LinearLayout texts = new LinearLayout(this);
        texts.setOrientation(LinearLayout.VERTICAL);
        LinearLayout.LayoutParams tlp = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1);
        tlp.setMargins(9 * d, 0, 0, 0);
        texts.setLayoutParams(tlp);
        android.widget.TextView tLabel = new android.widget.TextView(this);
        tLabel.setText(label); tLabel.setTextColor(Color.WHITE); tLabel.setTextSize(13f); tLabel.setTypeface(null, android.graphics.Typeface.BOLD);
        android.widget.TextView tTime = new android.widget.TextView(this);
        tTime.setText("Sekarang"); tTime.setTextColor(Color.argb(102, 255, 255, 255)); tTime.setTextSize(10.5f);
        texts.addView(tLabel); texts.addView(tTime);
        header.addView(iconBox); header.addView(texts);

        // Accent Line
        View line = new View(this);
        LinearLayout.LayoutParams lineLp = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 2 * d);
        lineLp.setMargins(0, 8 * d, 0, 9 * d);
        line.setLayoutParams(lineLp);
        line.setBackgroundColor(accent);

        // Buttons
        LinearLayout btnRow = new LinearLayout(this);
        btnRow.setOrientation(LinearLayout.HORIZONTAL);
        android.widget.Button btnOk = new android.widget.Button(this);
        btnOk.setText("Siap Makan"); btnOk.setTextColor(Color.WHITE); btnOk.setTextSize(12f);
        btnOk.setBackgroundColor(accent);
        LinearLayout.LayoutParams blp = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 34 * d);
        btnOk.setLayoutParams(blp);
        btnOk.setOnClickListener(v -> dismissStop());
        btnRow.addView(btnOk);

        exp.addView(header); exp.addView(line); exp.addView(btnRow);

        root.addView(exp);
        root.addView(pill);

        // Animation logic
        root.setOnClickListener(v -> {
            if (exp.getVisibility() == View.VISIBLE) return;
            if (autoHide != null) handler.removeCallbacks(autoHide);
            exp.setVisibility(View.VISIBLE);
            
            android.animation.ValueAnimator anim = android.animation.ValueAnimator.ofFloat(0f, 1f);
            anim.setDuration(400); anim.setInterpolator(new OvershootInterpolator(1.2f));
            anim.addUpdateListener(a -> {
                float val = (float) a.getAnimatedValue();
                int w = (int) (148 * d + (300 * d - 148 * d) * val);
                int h = (int) (36 * d + (122 * d - 36 * d) * val);
                float rad = 50 * d + (26 * d - 50 * d) * val;
                
                lp.width = w; lp.height = h;
                wm.updateViewLayout(root, lp);
                
                bg.setCornerRadius(rad);
                pill.setAlpha(1f - val);
                if (val > 0.5f) {
                    pill.setVisibility(View.GONE);
                    exp.setAlpha((val - 0.5f) * 2f);
                }
            });
            anim.start();
            lp.flags &= ~WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE; // allow touch on buttons
            wm.updateViewLayout(root, lp);
        });

        overlay = root;
        try { wm.addView(overlay, lp); } catch (Exception e) { stopSelf(); return; }

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
            .setContentTitle("BulkMate Reminder")
            .setSmallIcon(android.R.drawable.ic_popup_reminder)
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
